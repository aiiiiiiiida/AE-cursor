import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Settings, Eye, Save, X, Mail, Globe, Database, FileText, Calendar, Users, Zap, Clock, CheckCircle, AlertCircle, ArrowLeft, Play, Upload, Minus, Type, ToggleLeft, Split, Hourglass, ExternalLink,
  Search,
  User,
  MessageCircle,
  Image,
  Tag,
  CheckSquare,
  Video,
  Bot,
  ChevronUp,
  ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ActivityTemplate, UIElement, ConditionalFollowUp } from '../types';
import { DynamicForm } from './DynamicForm';

const AVAILABLE_ICONS = [
  
  { name: 'Zap', component: Zap },
  { name: 'Mail', component: Mail },
  { name: 'Globe', component: Globe },
  { name: 'Database', component: Database },
  { name: 'FileText', component: FileText },
  { name: 'Calendar', component: Calendar },
  { name: 'Users', component: Users },
  { name: 'Clock', component: Clock },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'Split', component: Split },
 
  { name: 'Hourglass', component: Hourglass },
  { name: 'Search', component: Search },
  { name: 'User', component: User },
  { name: 'Message', component: MessageCircle },
  { name: 'Image', component: Image },
  { name: 'Tag', component: Tag },
  { name: 'Checklist', component: CheckSquare },
  { name: 'Video', component: Video },
   { name: 'ExternalLink', component: ExternalLink },
  { name: 'Robot', component: Bot }
];

const ICON_COLORS = [
  { name: 'Purple', value: 'purple', bg: '#EAE8FB', iconColor: '#4D3EE0' },
  { name: 'Orange', value: 'orange', bg: '#FBEDD5', iconColor: '#DA5C30' },
  { name: 'Teal', value: 'teal', bg: '#D8F4F2', iconColor: '#3C6D68' }
];

export function ActivityConfigurator() {
  const navigate = useNavigate();
  const { state, createActivityTemplate, updateActivityTemplate, deleteActivityTemplate } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [triggerCreated, setTriggerCreated] = useState(false);

  // Create default trigger template if it doesn't exist (only once)
  useEffect(() => {
    if (triggerCreated || state.loading) return;

    const triggerTemplates = state.activityTemplates.filter(template => 
      template.name.toLowerCase().includes('trigger') || template.icon === 'Zap'
    );

    // If no trigger templates exist, create one
    if (triggerTemplates.length === 0 && state.activityTemplates.length >= 0) {
      const createDefaultTrigger = async () => {
        try {
          await createActivityTemplate({
            name: 'Trigger',
            icon: 'Zap',
            iconColor: 'teal',
            description: 'Workflow starts here',
            category: 'Workflow',
            sidePanelDescription: 'Configure when this workflow should start',
            sidePanelElements: [
              {
                id: 'trigger-type',
                type: 'dropdown',
                label: 'Trigger Type',
                options: ['Manual', 'Schedule', 'Webhook', 'Email Received', 'File Upload'],
                required: true
              },
              {
                id: 'trigger-condition',
                type: 'text',
                label: 'Trigger Condition',
                placeholder: 'Enter trigger condition',
                required: false
              }
            ]
          });
          setTriggerCreated(true);
        } catch (error) {
          console.error('Failed to create default trigger template:', error);
        }
      };

      createDefaultTrigger();
    } else if (triggerTemplates.length > 1) {
      // If multiple trigger templates exist, keep only the first one and delete the rest
      const keepTrigger = triggerTemplates[0];
      const duplicateTriggers = triggerTemplates.slice(1);
      
      // Process deletions sequentially to avoid race conditions
      const deleteDuplicates = async () => {
        for (const trigger of duplicateTriggers) {
          try {
            await deleteActivityTemplate(trigger.id);
          } catch (error) {
            console.error('Failed to delete duplicate trigger template:', error);
          }
        }
      };

      deleteDuplicates();
    }
  }, [state.activityTemplates, state.loading, createActivityTemplate, deleteActivityTemplate, triggerCreated]);

  const handleCreateTemplate = async (templateData: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createActivityTemplate(templateData);
      setShowCreateModal(false);
    } catch (error) {
      // Error is already handled in the context and displayed in the UI
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async (template: ActivityTemplate) => {
    try {
      await updateActivityTemplate(template);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this activity template?')) {
      try {
        await deleteActivityTemplate(id);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleTemplateClick = (template: ActivityTemplate) => {
    setEditingTemplate(template);
    setPreviewMode(false); // Reset preview mode when selecting a new template
  };

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    return icon ? icon.component : Settings;
  };

  const getIconColor = (color: string) => {
    const colorConfig = ICON_COLORS.find(c => c.value === color);
    return colorConfig || ICON_COLORS[0];
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Loading activity templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Activity Templates</h1>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={state.loading}
          className="bg-[#4D3EE0] text-sm text-white px-4 py-2 rounded-xl font-normal hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Create activity</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Templates List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="space-y-3">
            {state.activityTemplates.map((template) => {
              const IconComponent = getIconComponent(template.icon);
              const iconColor = getIconColor(template.iconColor || 'purple');
              
              return (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    editingTemplate?.id === template.id
                      ? 'border-[#4D3EE0] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onClick={() => handleTemplateClick(template)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: iconColor.bg }}
                      >
                        <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{template.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        disabled={state.loading}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-sm">
          {editingTemplate ? (
            <TemplateEditor
              template={editingTemplate}
              onSave={handleUpdateTemplate}
              onCancel={() => setEditingTemplate(null)}
              previewMode={previewMode}
              onTogglePreview={() => setPreviewMode(!previewMode)}
              loading={state.loading}
            />
          ) : (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Template</h3>
              <p className="text-slate-600">Choose a template from the list to edit its configuration</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTemplate}
          loading={state.loading}
        />
      )}
    </div>
  );
}

interface TemplateEditorProps {
  template: ActivityTemplate;
  onSave: (template: ActivityTemplate) => void;
  onCancel: () => void;
  previewMode: boolean;
  onTogglePreview: () => void;
  loading: boolean;
}

function TemplateEditor({ template, onSave, onCancel, previewMode, onTogglePreview, loading }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<ActivityTemplate>(template);

  // Update editedTemplate when template prop changes
  useEffect(() => {
    setEditedTemplate(template);
  }, [template]);

  const addUIElement = () => {
    const newElement: UIElement = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      required: false
    };
    setEditedTemplate({
      ...editedTemplate,
      sidePanelElements: [...editedTemplate.sidePanelElements, newElement]
    });
  };

  const updateUIElement = (elementId: string, updates: Partial<UIElement>) => {
    setEditedTemplate({
      ...editedTemplate,
      sidePanelElements: editedTemplate.sidePanelElements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    });
  };

  const removeUIElement = (elementId: string) => {
    setEditedTemplate({
      ...editedTemplate,
      sidePanelElements: editedTemplate.sidePanelElements.filter(el => el.id !== elementId)
    });
  };

  const moveUIElement = (elementId: string, direction: 'up' | 'down') => {
    const currentIndex = editedTemplate.sidePanelElements.findIndex(el => el.id === elementId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= editedTemplate.sidePanelElements.length) return;

    const newElements = [...editedTemplate.sidePanelElements];
    [newElements[currentIndex], newElements[newIndex]] = [newElements[newIndex], newElements[currentIndex]];

    setEditedTemplate({
      ...editedTemplate,
      sidePanelElements: newElements
    });
  };

  const handleSave = () => {
    onSave(editedTemplate);
  };

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    return icon ? icon.component : Settings;
  };

  const getIconColor = (color: string) => {
    const colorConfig = ICON_COLORS.find(c => c.value === color);
    return colorConfig || ICON_COLORS[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Editing: {editedTemplate.name}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePreview}
            disabled={loading}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              previewMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            {previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900">Preview Mode</h4>
          <DynamicForm elements={editedTemplate.sidePanelElements} />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={editedTemplate.name}
              onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={editedTemplate.category}
              onChange={(e) => setEditedTemplate({ ...editedTemplate, category: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="Workflow">Workflow</option>
              <option value="Communication">Communication</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Side Panel Description</label>
            <textarea
              value={editedTemplate.sidePanelDescription || ''}
              onChange={(e) => setEditedTemplate({ ...editedTemplate, sidePanelDescription: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              rows={2}
              placeholder="Description shown in the side panel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Map Description</label>
            <MapDescriptionInput
              value={editedTemplate.description}
              onChange={(value) => setEditedTemplate({ ...editedTemplate, description: value })}
              uiElements={editedTemplate.sidePanelElements}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((iconOption) => {
                const IconComponent = iconOption.component;
                const isSelected = editedTemplate.icon === iconOption.name;
                const iconColor = getIconColor(editedTemplate.iconColor || 'purple');
                
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setEditedTemplate({ ...editedTemplate, icon: iconOption.name })}
                    disabled={loading}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 ${
                      isSelected
                        ? 'border-[#4D3EE0] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center mx-auto"
                      style={{ backgroundColor: iconColor.bg }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Icon Color</label>
            <div className="flex space-x-3">
              {ICON_COLORS.map((colorOption) => {
                const isSelected = (editedTemplate.iconColor || 'purple') === colorOption.value;
                const IconComponent = getIconComponent(editedTemplate.icon);
                
                return (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setEditedTemplate({ ...editedTemplate, iconColor: colorOption.value })}
                    disabled={loading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 ${
                      isSelected
                        ? 'border-[#4D3EE0] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: colorOption.bg }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: colorOption.iconColor }} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{colorOption.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">UI Elements</label>
              <button
                onClick={addUIElement}
                disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50"
              >
                + Add Element
              </button>
            </div>
            <div className="space-y-3">
              {editedTemplate.sidePanelElements.map((element, index) => (
                <UIElementEditor
                  key={element.id}
                  element={element}
                  onUpdate={(updates) => updateUIElement(element.id, updates)}
                  onRemove={() => removeUIElement(element.id)}
                  onMoveUp={() => moveUIElement(element.id, 'up')}
                  onMoveDown={() => moveUIElement(element.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < editedTemplate.sidePanelElements.length - 1}
                  disabled={loading}
                  allElements={editedTemplate.sidePanelElements}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-[#4D3EE0] text-white rounded-lg hover:bg-[#2927B2]  flex items-center space-x-2 disabled:opacity-50"
        >
          <span>Save changes</span>
        </button>
      </div>
    </div>
  );
}

interface MapDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  uiElements: UIElement[];
  disabled?: boolean;
}

function MapDescriptionInput({ value, onChange, uiElements, disabled }: MapDescriptionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get all available UI elements (including nested conditional follow-up elements)
  const getAllUIElements = (elements: UIElement[]): UIElement[] => {
    const allElements: UIElement[] = [];
    
    const traverse = (els: UIElement[]) => {
      els.forEach(el => {
        // Only include elements that can have user input values
        if (!['section-divider', 'text-block', 'button'].includes(el.type)) {
          allElements.push(el);
        }
        if (el.conditionalFollowUps) {
          el.conditionalFollowUps.forEach(followUp => {
            traverse(followUp.elements);
          });
        }
      });
    };
    
    traverse(elements);
    return allElements;
  };

  const availableElements = getAllUIElements(uiElements);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user typed '#' to show suggestions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      // Show suggestions if we just typed # or if we're still typing after #
      if (textAfterHash === '' || /^[a-zA-Z0-9\s]*$/.test(textAfterHash)) {
        setShowSuggestions(true);
        
        // Calculate position for suggestions dropdown
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const textBeforeHash = textBeforeCursor.substring(0, lastHashIndex);
          const lines = textBeforeHash.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[currentLine].length;
          
          // Approximate position calculation
          const lineHeight = 20;
          const charWidth = 8;
          const top = currentLine * lineHeight + 30;
          const left = charInLine * charWidth + 10;
          
          setSuggestionPosition({ top, left });
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleElementSelect = (element: UIElement) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const beforeHash = textBeforeCursor.substring(0, lastHashIndex);
      const replacement = `#{${element.label}}`;
      const newValue = beforeHash + replacement + textAfterCursor;
      const newCursorPos = beforeHash.length + replacement.length;
      
      onChange(newValue);
      setShowSuggestions(false);
      
      // Set cursor position after the replacement
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        rows={2}
        placeholder="Description shown on the workflow map. Use # to reference UI element values."
      />
      
      {showSuggestions && availableElements.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            minWidth: '200px'
          }}
        >
          <div className="p-2 text-xs text-slate-500 border-b">
            Select a UI element to reference:
          </div>
          {availableElements.map((element) => (
            <button
              key={element.id}
              onClick={() => handleElementSelect(element)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0"
            >
              <div className="font-medium text-slate-900">{element.label}</div>
              <div className="text-xs text-slate-500 capitalize">{element.type}</div>
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-1 text-xs text-slate-500">
        Type <code className="bg-slate-100 px-1 rounded">#</code> to reference UI element values in the description.
      </div>
    </div>
  );
}

interface UIElementEditorProps {
  element: UIElement;
  onUpdate: (updates: Partial<UIElement>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  allElements: UIElement[];
}

function UIElementEditor({ element, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, disabled, allElements }: UIElementEditorProps) {
  const addOption = () => {
    const currentOptions = element.options || [];
    onUpdate({ options: [...currentOptions, ''] });
  };

  const updateOption = (index: number, value: string) => {
    const currentOptions = element.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const currentOptions = element.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    onUpdate({ options: newOptions });
  };

  const addConditionalFollowUp = () => {
    const newFollowUp: ConditionalFollowUp = {
      conditionValue: element.options?.[0] || (element.type === 'toggle' ? true : ''),
      elements: []
    };
    
    const currentFollowUps = element.conditionalFollowUps || [];
    onUpdate({ 
      conditionalFollowUps: [...currentFollowUps, newFollowUp],
      hasConditionalFollowUps: true
    });
  };

  const updateConditionalFollowUp = (index: number, updates: Partial<ConditionalFollowUp>) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).map((followUp, i) =>
      i === index ? { ...followUp, ...updates } : followUp
    );
    onUpdate({ conditionalFollowUps: updatedFollowUps });
  };

  const removeConditionalFollowUp = (index: number) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).filter((_, i) => i !== index);
    onUpdate({ 
      conditionalFollowUps: updatedFollowUps,
      hasConditionalFollowUps: updatedFollowUps.length > 0
    });
  };

  const addElementToConditionalFollowUp = (followUpIndex: number) => {
    const newElement: UIElement = {
      id: Date.now().toString(),
      type: 'text',
      label: 'Follow-up Field',
      required: false
    };
    
    const updatedFollowUps = (element.conditionalFollowUps || []).map((followUp, i) =>
      i === followUpIndex 
        ? { ...followUp, elements: [...followUp.elements, newElement] }
        : followUp
    );
    onUpdate({ conditionalFollowUps: updatedFollowUps });
  };

  const updateElementInConditionalFollowUp = (followUpIndex: number, elementId: string, updates: Partial<UIElement>) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).map((followUp, i) =>
      i === followUpIndex 
        ? {
            ...followUp,
            elements: followUp.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
          }
        : followUp
    );
    onUpdate({ conditionalFollowUps: updatedFollowUps });
  };

  const removeElementFromConditionalFollowUp = (followUpIndex: number, elementId: string) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).map((followUp, i) =>
      i === followUpIndex 
        ? { ...followUp, elements: followUp.elements.filter(el => el.id !== elementId) }
        : followUp
    );
    onUpdate({ conditionalFollowUps: updatedFollowUps });
  };

  const canHaveConditionalFollowUps = ['dropdown', 'toggle', 'radio', 'checkbox'].includes(element.type);

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <select
          value={element.type}
          onChange={(e) => onUpdate({ type: e.target.value as UIElement['type'] })}
          disabled={disabled}
          className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          <option value="text">Text Input</option>
          <option value="textarea">Textarea</option>
          <option value="dropdown">Dropdown</option>
          <option value="radio">Radio Buttons</option>
          <option value="checkbox">Checkbox</option>
          <option value="toggle">Toggle</option>
          <option value="button">Button</option>
          <option value="file-upload">File Upload</option>
          <option value="section-divider">Section Divider</option>
          <option value="text-block">Text Block</option>
        </select>
        <div className="flex items-center space-x-1">
          <button
            onClick={onMoveUp}
            disabled={disabled || !canMoveUp}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={disabled || !canMoveDown}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            disabled={disabled}
            className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            {element.type === 'section-divider' ? 'Section Title' : 
             element.type === 'text-block' ? 'Text Content' : 'Label'}
          </label>
          <input
            type="text"
            value={element.type === 'section-divider' || element.type === 'text-block' ? 
              (element.text || element.label) : element.label}
            onChange={(e) => {
              if (element.type === 'section-divider' || element.type === 'text-block') {
                onUpdate({ text: e.target.value, label: e.target.value });
              } else {
                onUpdate({ label: e.target.value });
              }
            }}
            disabled={disabled}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        {element.type !== 'section-divider' && element.type !== 'text-block' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Placeholder</label>
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              disabled={disabled}
              className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {(element.type === 'dropdown' || element.type === 'radio') && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-slate-600">Options</label>
            <button
              onClick={addOption}
              disabled={disabled}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {(element.options || []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  disabled={disabled}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  onClick={() => removeOption(index)}
                  disabled={disabled}
                  className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!element.options || element.options.length === 0) && (
              <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                No options added yet. Click "Add" to create your first option.
              </div>
            )}
          </div>
        </div>
      )}

      {element.type === 'dropdown' && (
        <div className="mb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`multiselect-${element.id}`}
              checked={element.multiselect || false}
              onChange={(e) => onUpdate({ multiselect: e.target.checked })}
              disabled={disabled}
              className="mr-2 disabled:opacity-50"
            />
            <label htmlFor={`multiselect-${element.id}`} className="text-xs text-slate-600">
              Allow multiple selections
            </label>
          </div>
        </div>
      )}

      {element.type !== 'section-divider' && element.type !== 'text-block' && element.type !== 'button' && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id={`required-${element.id}`}
            checked={element.required || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            disabled={disabled}
            className="mr-2 disabled:opacity-50"
          />
          <label htmlFor={`required-${element.id}`} className="text-xs text-slate-600">
            Required field
          </label>
        </div>
      )}

      {/* Button-specific configurations */}
      {element.type === 'button' && (
        <div className="space-y-3 mb-3">
          {/* Has Icon checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`has-icon-${element.id}`}
              checked={element.hasIcon || false}
              onChange={(e) => onUpdate({ hasIcon: e.target.checked })}
              disabled={disabled}
              className="mr-2 disabled:opacity-50"
            />
            <label htmlFor={`has-icon-${element.id}`} className="text-xs text-slate-600">
              Has icon
            </label>
          </div>

          {/* Icon selection and position */}
          {element.hasIcon && (
            <div className="space-y-3 ml-4 p-3 bg-white rounded border">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((iconOption) => {
                    const IconComponent = iconOption.component;
                    const isSelected = element.icon === iconOption.name;
                    
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => onUpdate({ icon: iconOption.name })}
                        disabled={disabled}
                        className={`p-2 rounded border transition-all duration-200 disabled:opacity-50 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Icon Position</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => onUpdate({ iconPosition: 'left' })}
                    disabled={disabled}
                    className={`px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
                      (element.iconPosition || 'left') === 'left'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ iconPosition: 'right' })}
                    disabled={disabled}
                    className={`px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
                      element.iconPosition === 'right'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Adds Elements checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`adds-elements-${element.id}`}
              checked={element.addsElements || false}
              onChange={(e) => onUpdate({ addsElements: e.target.checked })}
              disabled={disabled}
              className="mr-2 disabled:opacity-50"
            />
            <label htmlFor={`adds-elements-${element.id}`} className="text-xs text-slate-600">
              Adds elements
            </label>
          </div>

          {/* Element Reference input */}
          {element.addsElements && (
            <div className="ml-4 p-3 bg-white rounded border">
              <ElementReferenceInput
                value={element.elementReference || ''}
                onChange={(value) => onUpdate({ elementReference: value })}
                allElements={allElements}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}

      {/* Conditional follow-up elements configuration */}
      {canHaveConditionalFollowUps && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`conditional-followup-${element.id}`}
                checked={element.hasConditionalFollowUps || false}
                onChange={(e) => {
                  onUpdate({ 
                    hasConditionalFollowUps: e.target.checked,
                    conditionalFollowUps: e.target.checked ? (element.conditionalFollowUps || []) : []
                  });
                }}
                disabled={disabled}
                className="mr-2 disabled:opacity-50"
              />
              <label htmlFor={`conditional-followup-${element.id}`} className="text-xs text-slate-600">
                Enable conditional follow-ups
              </label>
            </div>
            {element.hasConditionalFollowUps && (
              <button
                onClick={addConditionalFollowUp}
                disabled={disabled}
                className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                <span>Add Condition</span>
              </button>
            )}
          </div>

          {element.hasConditionalFollowUps && (
            <div className="space-y-4">
              {(element.conditionalFollowUps || []).map((followUp, followUpIndex) => (
                <div key={followUpIndex} className="p-3 border border-slate-300 rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-slate-600">
                        When value is:
                      </label>
                      {element.type === 'toggle' ? (
                        <select
                          value={followUp.conditionValue === true ? 'true' : 'false'}
                          onChange={(e) => updateConditionalFollowUp(followUpIndex, {
                            conditionValue: e.target.value === 'true'
                          })}
                          disabled={disabled}
                          className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        >
                          <option value="true">ON</option>
                          <option value="false">OFF</option>
                        </select>
                      ) : element.type === 'checkbox' ? (
                        <select
                          value={followUp.conditionValue === true ? 'true' : 'false'}
                          onChange={(e) => updateConditionalFollowUp(followUpIndex, {
                            conditionValue: e.target.value === 'true'
                          })}
                          disabled={disabled}
                          className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        >
                          <option value="true">Checked</option>
                          <option value="false">Unchecked</option>
                        </select>
                      ) : (
                        <select
                          value={followUp.conditionValue as string}
                          onChange={(e) => updateConditionalFollowUp(followUpIndex, {
                            conditionValue: e.target.value
                          })}
                          disabled={disabled}
                          className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        >
                          <option value="">Select option...</option>
                          {element.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      onClick={() => removeConditionalFollowUp(followUpIndex)}
                      disabled={disabled}
                      className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-slate-600">Follow-up Elements</label>
                      <button
                        onClick={() => addElementToConditionalFollowUp(followUpIndex)}
                        disabled={disabled}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Element</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {followUp.elements.map((followUpElement, followUpElementIndex) => (
                        <UIElementEditor
                          key={followUpElement.id}
                          element={followUpElement}
                          onUpdate={(updates) => updateElementInConditionalFollowUp(followUpIndex, followUpElement.id, updates)}
                          onRemove={() => removeElementFromConditionalFollowUp(followUpIndex, followUpElement.id)}
                          onMoveUp={() => {
                            if (followUpElementIndex > 0) {
                              const updatedElements = [...followUp.elements];
                              [updatedElements[followUpElementIndex], updatedElements[followUpElementIndex - 1]] = 
                                [updatedElements[followUpElementIndex - 1], updatedElements[followUpElementIndex]];
                              updateConditionalFollowUp(followUpIndex, { elements: updatedElements });
                            }
                          }}
                          onMoveDown={() => {
                            if (followUpElementIndex < followUp.elements.length - 1) {
                              const updatedElements = [...followUp.elements];
                              [updatedElements[followUpElementIndex], updatedElements[followUpElementIndex + 1]] = 
                                [updatedElements[followUpElementIndex + 1], updatedElements[followUpElementIndex]];
                              updateConditionalFollowUp(followUpIndex, { elements: updatedElements });
                            }
                          }}
                          canMoveUp={followUpElementIndex > 0}
                          canMoveDown={followUpElementIndex < followUp.elements.length - 1}
                          disabled={disabled}
                          allElements={allElements}
                        />
                      ))}
                      {followUp.elements.length === 0 && (
                        <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                          No follow-up elements added yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!element.conditionalFollowUps || element.conditionalFollowUps.length === 0) && (
                <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                  No conditional follow-ups configured yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ElementReferenceInputProps {
  value: string;
  onChange: (value: string) => void;
  allElements: UIElement[];
  disabled?: boolean;
}

function ElementReferenceInput({ value, onChange, allElements, disabled }: ElementReferenceInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get all available UI elements (including nested conditional follow-up elements)
  const getAllUIElements = (elements: UIElement[]): UIElement[] => {
    const allElementsList: UIElement[] = [];
    
    const traverse = (els: UIElement[]) => {
      els.forEach(el => {
        // Include all elements for button reference
        allElementsList.push(el);
        if (el.conditionalFollowUps) {
          el.conditionalFollowUps.forEach(followUp => {
            traverse(followUp.elements);
          });
        }
      });
    };
    
    traverse(elements);
    return allElementsList;
  };

  // Add predefined element types that can be created
  const predefinedElements = [
    { id: 'new-text', label: 'Text Input', type: 'text' },
    { id: 'new-textarea', label: 'Textarea', type: 'textarea' },
    { id: 'new-dropdown', label: 'Dropdown', type: 'dropdown' },
    { id: 'new-radio', label: 'Radio Buttons', type: 'radio' },
    { id: 'new-checkbox', label: 'Checkbox', type: 'checkbox' },
    { id: 'new-toggle', label: 'Toggle', type: 'toggle' },
    { id: 'new-file-upload', label: 'File Upload', type: 'file-upload' }
  ];

  const availableElements = [...getAllUIElements(allElements), ...predefinedElements];

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user typed '#' to show suggestions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      // Show suggestions if we just typed # or if we're still typing after #
      if (textAfterHash === '' || /^[a-zA-Z0-9\s]*$/.test(textAfterHash)) {
        setShowSuggestions(true);
        
        // Calculate position for suggestions dropdown
        if (inputRef.current) {
          const input = inputRef.current;
          const rect = input.getBoundingClientRect();
          setSuggestionPosition({ 
            top: rect.height + 5, 
            left: Math.min(lastHashIndex * 8, rect.width - 200) 
          });
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleElementSelect = (element: any) => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const beforeHash = textBeforeCursor.substring(0, lastHashIndex);
      const replacement = `#{${element.label}}`;
      const newValue = beforeHash + replacement + textAfterCursor;
      const newCursorPos = beforeHash.length + replacement.length;
      
      onChange(newValue);
      setShowSuggestions(false);
      
      // Set cursor position after the replacement
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-600 mb-1">
        Element Reference
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        placeholder="Type # to reference elements (e.g., #{Questionnaire})"
      />
      
      {showSuggestions && availableElements.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            minWidth: '250px'
          }}
        >
          <div className="p-2 text-xs text-slate-500 border-b">
            Select an element to reference:
          </div>
          {availableElements.map((element) => (
            <button
              key={element.id}
              onClick={() => handleElementSelect(element)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0"
            >
              <div className="font-medium text-slate-900">{element.label}</div>
              <div className="text-xs text-slate-500 capitalize">
                {element.id.startsWith('new-') ? `Create new ${element.type}` : `Existing ${element.type}`}
              </div>
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-1 text-xs text-slate-500">
        Type <code className="bg-slate-100 px-1 rounded">#</code> to reference existing elements or create new ones.
      </div>
    </div>
  );
}

interface CreateTemplateModalProps {
  onClose: () => void;
  onSave: (template: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  loading: boolean;
}

function CreateTemplateModal({ onClose, onSave, loading }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Workflow');
  const [sidePanelDescription, setSidePanelDescription] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [icon, setIcon] = useState('Settings');
  const [iconColor, setIconColor] = useState('purple');

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name,
        category,
        sidePanelDescription,
        description: mapDescription,
        icon,
        iconColor,
        sidePanelElements: []
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = AVAILABLE_ICONS.find(i => i.name === iconName);
    return iconOption ? iconOption.component : Settings;
  };

  const getIconColor = (color: string) => {
    const colorConfig = ICON_COLORS.find(c => c.value === color);
    return colorConfig || ICON_COLORS[0];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Create Activity Template</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="Workflow">Workflow</option>
              <option value="Communication">Communication</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Side Panel Description</label>
            <textarea
              value={sidePanelDescription}
              onChange={(e) => setSidePanelDescription(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Description shown in the side panel"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Map Description</label>
            <textarea
              value={mapDescription}
              onChange={(e) => setMapDescription(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Description shown on the workflow map"
              rows={2}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((iconOption) => {
                const IconComponent = iconOption.component;
                const isSelected = icon === iconOption.name;
                const selectedIconColor = getIconColor(iconColor);
                
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setIcon(iconOption.name)}
                    disabled={loading}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 ${
                      isSelected
                        ? 'border-[#4D3EE0] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center mx-auto"
                      style={{ backgroundColor: selectedIconColor.bg }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: selectedIconColor.iconColor }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Icon Color</label>
            <div className="flex space-x-3">
              {ICON_COLORS.map((colorOption) => {
                const isSelected = iconColor === colorOption.value;
                const IconComponent = getIconComponent(icon);
                
                return (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setIconColor(colorOption.value)}
                    disabled={loading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 disabled:opacity-50 ${
                      isSelected
                        ? 'border-[#4D3EE0] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: colorOption.bg }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: colorOption.iconColor }} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{colorOption.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="px-4 py-2 bg-[#4D3EE0] text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : null}
            <span>Create</span>
          </button>
        </div>
      </div>
    </div>
  );
}