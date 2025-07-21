import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ActivityTemplate, UIElement, ConditionalFollowUp } from '../types';
import { DynamicForm } from './DynamicForm';
import { ChevronUp, ChevronDown, X, Plus, Star, Sparkle, UserRoundPlus, ArrowDown10, MousePointer, Text, Calendar as LucideCalendar } from 'lucide-react';
import ScreeningQuestionsModule from './ScreeningQuestionsModule';
import TriggerConditionsModule from './TriggerConditionsModule';
import ReactDOM from 'react-dom';

const AVAILABLE_ICONS = [
  
  { name: 'Zap', component: Lucide.Zap },
  { name: 'Mail', component: Lucide.Mail },
  { name: 'Globe', component: Lucide.Globe },
  { name: 'Database', component: Lucide.Database },
  { name: 'FileText', component: Lucide.FileText },
  { name: 'Calendar', component: Lucide.Calendar },
  { name: 'Users', component: Lucide.Users },
  { name: 'Clock', component: Lucide.Clock },
  { name: 'CheckCircle', component: Lucide.CheckCircle },
  { name: 'Split', component: Lucide.Split },
  { name: 'Plus', component: Lucide.Plus },
  { name: 'Hourglass', component: Lucide.Hourglass },
  { name: 'Search', component: Lucide.Search },
  { name: 'User', component: Lucide.User },
  { name: 'Message', component: Lucide.MessageCircle },
  { name: 'Image', component: Lucide.Image },
  { name: 'Tag', component: Lucide.Tag },
  { name: 'Checklist', component: Lucide.CheckSquare },
  { name: 'Video', component: Lucide.Video },
   { name: 'ExternalLink', component: Lucide.ExternalLink },
  { name: 'Robot', component: Lucide.Bot },
  { name: 'Star', component: Star },
  { name: 'Sparkle', component: Sparkle },
  { name: 'UserRoundPlus', component: UserRoundPlus }
];

const ICON_COLORS = [
  { name: 'Purple', value: 'purple', bg: '#EAE8FB', iconColor: '#4D3EE0' },
  { name: 'Orange', value: 'orange', bg: '#FBEDD5', iconColor: '#DA5C30' },
  { name: 'Teal', value: 'teal', bg: '#D8F4F2', iconColor: '#3C6D68' }
];

// Helper to normalize icon names to match AVAILABLE_ICONS
function normalizeIconName(name: string): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function ActivityConfigurator() {
  const navigate = useNavigate();
  const { state, createActivityTemplate, updateActivityTemplate, deleteActivityTemplate } = useApp();
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [triggerCreated, setTriggerCreated] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ActivityTemplate | null>(null);
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);

  // Ensure only one trigger template exists at all times
  useEffect(() => {
    if (state.loading) return;

    const triggerTemplates = state.activityTemplates.filter(template => 
      template.name.toLowerCase().includes('trigger') || template.icon === 'Zap'
    );

    if (triggerTemplates.length === 0) {
      // No trigger exists, create one
      createActivityTemplate({
        name: 'Trigger',
        icon: 'Zap',
        iconColor: 'teal',
        description: '#{Locale} #{Site type}',
        category: 'Workflow',
        sidePanelDescription: 'Configure when this workflow should start',
        sidePanelElements: [
          { type: 'section-divider', label: 'Setup', id: 'setup-divider' },
          { type: 'dropdown', label: 'Locale', id: 'locale', options: ['en_US', 'en_UK'], multiselect: true, placeholder: 'Select locale', required: false },
          { type: 'dropdown', label: 'Site type', id: 'site-type', options: ['internal', 'external'], multiselect: true, placeholder: 'Select site type', required: false },
          { type: 'section-divider', label: 'Attributes', id: 'attributes-divider' },
          {
            type: 'trigger-conditions-module',
            id: 'trigger-conditions',
            label: 'Trigger Conditions',
            propertyOptions: [
              { label: 'Job ID', value: 'job_id', values: ['302', '304', '306'] },
              { label: 'Country', value: 'country', values: ['US', 'Canada'] },
              { label: 'Employee tenure', value: 'employee_tenure', values: ['less than 2 weeks', 'more than 2 weeks'] },
              { label: 'City', value: 'city', values: ['New York', 'Philadelphia', 'Oslo', 'Bucharest'] }
            ],
            operatorOptions: [
              { label: 'is', value: 'is' },
              { label: 'is not', value: 'is_not' },
              { label: 'contains', value: 'contains' },
              { label: 'does not contain', value: 'does_not_contain' }
            ]
          }
        ]
      });
    } else if (triggerTemplates.length > 1) {
      // More than one trigger exists, delete all but the first
      const duplicateTriggers = triggerTemplates.slice(1);
      duplicateTriggers.forEach(trigger => {
        deleteActivityTemplate(trigger.id);
      });
    }
  }, [state.activityTemplates, state.loading, createActivityTemplate, deleteActivityTemplate]);

  const handleCreateTemplate = async (templateData: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createActivityTemplate(templateData);
    } catch (error) {
      // Error is already handled in the context and displayed in the UI
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateTemplate = async (template: ActivityTemplate) => {
    try {
      if (!template.id || (template.id as any).startsWith?.('tmp-')) {
        const { id: _ignore, createdAt: _c, updatedAt: _u, ...data } = template as any;
        const created = await createActivityTemplate(data);
        setEditingTemplate(created);
      } else {
        await updateActivityTemplate(template);
        setEditingTemplate(null);
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteActivityTemplate(id);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleTemplateClick = (template: ActivityTemplate) => {
    setEditingTemplate(template);
    setPreviewMode(false); // Reset preview mode when selecting a new template
  };

  const getIconComponent = (iconName: string, customSvg?: string) => {
    if (customSvg && iconName === 'Custom') {
      // Return a component rendering the raw SVG
      return () => (
        <span
          className="w-4 h-4 inline-flex"
          dangerouslySetInnerHTML={{ __html: customSvg }}
        />
      );
    }
    const normalized = normalizeIconName(iconName);
    const icon = AVAILABLE_ICONS.find(i => i.name === normalized);
    if (icon) return icon.component;
    return (Lucide as any)[normalized] || Lucide.Settings;
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
            <Lucide.ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Activity Templates</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingTemplate({
              id: `tmp-${Date.now()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              name: '',
              category: 'Workflow',
              sidePanelDescription: '',
              description: '',
              icon: 'Settings',
              iconColor: 'purple',
              sidePanelElements: [],
            });
            setTimeout(() => setShowCreateActivityModal(true), 1000);
          }}
          disabled={state.loading}
          className="bg-[#4D3EE0] text-sm text-white px-4 py-2 rounded-xl font-normal hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lucide.Plus className="w-4 h-4" />
          <span>Create activity</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Templates List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="space-y-2">
            {state.activityTemplates.map((template) => {
              const IconComponent = getIconComponent(template.icon, template.customIconSvg);
              const iconColor = getIconColor(template.iconColor || 'purple');
              const isCondition = template.name.toLowerCase() === 'condition' || template.icon === 'Split';
              
              return (
                <div
                  key={template.id}
                  className={`p-2 border rounded-xl cursor-pointer transition-all duration-200 ${
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
                        <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor, ...(isCondition ? { transform: 'rotate(90deg)' } : {}) }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-[15px] text-slate-900">{template.name}</h3>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === template.id ? null : template.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="More actions"
                      >
                        <Lucide.MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === template.id && (
                        <div className="absolute right-0 top-8 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setTemplateToDelete(template);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Lucide.Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Editor */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-sm">
          {editingTemplate ? (
            <TemplateEditor
              template={editingTemplate}
              onSave={handleUpdateTemplate}
              onCancel={() => setEditingTemplate(null)}
              previewMode={previewMode}
              onTogglePreview={() => setPreviewMode(!previewMode)}
              loading={state.loading}
              activityTemplates={state.activityTemplates} // Pass all templates
            />
          ) : (
            <div className="text-center py-48">
  <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl bg-slate-100">
    <Lucide.Settings className="w-6 h-6 text-slate-500" />
  </div>
  <h3 className="text-lg font-semibold text-slate-700 mb-0.5">Select a Template</h3>
  <p className="text-slate-500 text-md">Choose a template from the list to edit it</p>
</div>

          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {templateToDelete &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 50,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setTemplateToDelete(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-0 flex flex-col"
              style={{ minWidth: 380 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <h2 className="text-lg font-semibold text-[#3A3F4B]">Delete activity template</h2>
                <button
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full focus:outline-none"
                  onClick={() => setTemplateToDelete(null)}
                  aria-label="Close"
                >
                  <Lucide.X className="w-5 h-5" />
                </button>
              </div>
              {/* Divider */}
              <div className="border-t border-slate-200 w-full" />
              {/* Description */}
              <div className="px-6 py-8 text-[#3A3F4B] text-md font-normal">
                Are you sure you want to delete this activity template? The action cannot be reverted.
              </div>
              {/* Divider */}
              <div className="border-t border-slate-200 w-full" />
              {/* Buttons */}
              <div className="flex justify-end space-x-4 px-6 py-4">
                <button
                  className="h-10 px-4 rounded-xl border border-[#8C95A8] text-[#2927B2] text-sm font-medium bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4D3EE0]"
                  style={{ fontSize: 14 }}
                  onClick={() => setTemplateToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="h-10 px-4 rounded-xl bg-[#C40F24] text-white text-sm font-medium hover:bg-[#B71C1C] focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  style={{ fontSize: 14 }}
                  onClick={async () => {
                    await handleDeleteTemplate(templateToDelete.id);
                    setTemplateToDelete(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Create Activity Tutorial Modal */}
      {showCreateActivityModal &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 50,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowCreateActivityModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-0 flex flex-col"
              style={{ minWidth: 520 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <h2 className="text-lg font-semibold text-[#3A3F4B]">Use new activities in existing workflows</h2>
                <button
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full focus:outline-none"
                  onClick={() => setShowCreateActivityModal(false)}
                  aria-label="Close"
                >
                  <Lucide.X className="w-5 h-5" />
                </button>
              </div>
              {/* Divider */}
              <div className="border-t border-slate-200 w-full" />
              {/* GIF and Description */}
              <div className="px-6 pt-4 flex flex-col">
              <div className="text-[#3A3F4B] text-sm font-normal mb-4">
                  To add newly created activities to your existing workflows, enable them from the Avalable Activities list at the workflow level.
                </div>
                
                <img
                  src="/tutorial.gif"
                  alt="Tutorial GIF"
                  className="w-full h-auto rounded-lg mb-4 border border-slate-100 shadow"
                  style={{  objectFit: 'contain' }}
                />
                <div className="text-[#3A3F4B] text-sm font-normal mb-4">
                  New workflows will automatically have all created activities enabled.
                </div>
              </div>
              {/* Divider */}
              <div className="border-t border-slate-200 w-full" />
              {/* Buttons */}
              <div className="flex justify-end space-x-4 px-6 py-3">
                
                <button
                  className="h-10 px-4 rounded-xl bg-[#4D3EE0] text-white text-sm font-medium hover:bg-[#2927B2] focus:outline-none focus:ring-2 focus:ring-[#4D3EE0]"
                  style={{ fontSize: 14 }}
                  onClick={() => {
                    setShowCreateActivityModal(false);
                    setEditingTemplate({
                      id: `tmp-${Date.now()}`,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      name: '',
                      category: 'Workflow',
                      sidePanelDescription: '',
                      description: '',
                      icon: 'Settings',
                      iconColor: 'purple',
                      sidePanelElements: [],
                    });
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
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
  activityTemplates: ActivityTemplate[]; // New prop
}

function TemplateEditor({ template, onSave, onCancel, previewMode, onTogglePreview, loading, activityTemplates }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<ActivityTemplate>(template);
  const [activeTab, setActiveTab] = useState<'Configuration' | 'Advanced' | 'User Interface'>('Configuration');
  // Track all categories used in this session
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState<string>(template.category || 'Workflow');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSvgInput, setShowSvgInput] = useState(false);
  const [svgDraft, setSvgDraft] = useState<string>('');
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Update categories from all activity templates
  useEffect(() => {
    const allCategories = activityTemplates
      .map(t => t.category?.trim())
      .filter(Boolean) as string[];
    const uniqueCategories = Array.from(new Set([...(allCategories), 'Workflow', 'Communication']));
    setCategories(uniqueCategories);
  }, [activityTemplates]);

  // Update categories if a new one is entered (keep this for typed-in new ones)
  useEffect(() => {
    if (categoryInput && !categories.some(cat => cat.toLowerCase() === categoryInput.toLowerCase())) {
      setCategories(prev => [...prev, categoryInput]);
    }
  }, [categoryInput]);

  // Update editedTemplate when template prop changes
  useEffect(() => {
    setEditedTemplate(template);
    setCategoryInput(template.category || 'Workflow');
  }, [template]);

  // Determine which tabs are present
  const tabSet = new Set(
    editedTemplate.sidePanelElements.map(el => el.tab || 'Configuration')
  );
  const tabs = Array.from(tabSet) as ('Configuration' | 'Advanced' | 'User Interface')[];
  // Always show in order: Configuration, Advanced, User Interface
  const orderedTabs = ['Configuration', 'Advanced', 'User Interface'].filter(tab => tabs.includes(tab as any)) as ('Configuration' | 'Advanced' | 'User Interface')[];
  // Always allow all 3 tabs to be selectable for editing
  const allTabs = ['Configuration', 'Advanced', 'User Interface'] as const;
  const showTabs = allTabs.length > 1;

  // Only show elements for the active tab
  const filteredElements = editedTemplate.sidePanelElements.filter(el => (el.tab || 'Configuration') === activeTab);

  const addUIElement = () => {
    const newElement: UIElement = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      required: false,
      tab: activeTab
    };
    setEditedTemplate({
      ...editedTemplate,
      sidePanelElements: [...editedTemplate.sidePanelElements, newElement]
    });
  };

  const updateUIElement = (elementId: string, updates: Partial<UIElement>) => {
    setEditedTemplate({
      ...editedTemplate,
      sidePanelElements: editedTemplate.sidePanelElements.map(el => {
        // If changing type to 'file-upload', pre-fill label
        if (el.id === elementId && updates.type === 'file-upload') {
          return { ...el, ...updates, label: 'Upload file' };
        }
        return el.id === elementId ? { ...el, ...updates } : el;
      })
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

  const getIconComponent = (iconName: string, customSvg?: string) => {
    if (customSvg && iconName === 'Custom') {
      // Return a component rendering the raw SVG
      return () => (
        <span
          className="w-4 h-4 inline-flex"
          dangerouslySetInnerHTML={{ __html: customSvg }}
        />
      );
    }
    const normalized = normalizeIconName(iconName);
    const icon = AVAILABLE_ICONS.find(i => i.name === normalized);
    if (icon) return icon.component;
    return (Lucide as any)[normalized] || Lucide.Settings;
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
          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {previewMode ? (
        <>
          <Lucide.Pencil className="w-3.5 h-3.5 inline mr-1" />
          Edit
        </>
      ) : (
        <>
          <Lucide.Eye className="w-4 h-4 inline mr-1" />
          Preview
        </>
      )}
    </button>
  </div>
</div>

      {previewMode ? (
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900">Preview Mode</h4>
          {(() => {
            // Build values with defaultValue for radio and dropdown if not already set
            const defaultedValues = { ...previewValues };
            editedTemplate.sidePanelElements.forEach(el => {
              if ((el.type === 'radio' || el.type === 'dropdown') && typeof el.defaultValue === 'string' && el.defaultValue !== '' && defaultedValues[el.id] === undefined) {
                defaultedValues[el.id] = el.defaultValue;
              }
            });
            return (
              <DynamicForm
                elements={editedTemplate.sidePanelElements}
                values={defaultedValues}
                onChange={setPreviewValues}
              />
            );
          })()}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show meta fields only in edit mode */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={editedTemplate.name}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                disabled={loading}
                placeholder="Activity name"
                className="w-full px-3 py-1 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value)}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
                disabled={loading}
                className="w-full px-3 py-1 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Enter or select a category"
                autoComplete="off"
              />
              {showCategoryDropdown && (
                <div className="absolute z-10 bg-white border border-slate-200 rounded shadow w-full mt-1 max-h-40 overflow-y-auto">
                  {(() => {
                    // Only show unique, full categories from templates
                    const lowerInput = categoryInput.trim().toLowerCase();
                    const uniqueCategories = Array.from(new Set(
                      activityTemplates
                        .map(t => t.category?.trim())
                        .filter(Boolean)
                    ));
                    const hasExactMatch = uniqueCategories.some(cat => cat.toLowerCase() === lowerInput);
                    const dropdownItems = [];
                    if (categoryInput && !hasExactMatch) {
                      dropdownItems.push(
                        <button
                          key="add-new"
                          type="button"
                          className="w-full text-left px-3 py-1 hover:bg-blue-50 text-sm font-medium text-[#2927B2] border-b border-slate-100"
                          onMouseDown={() => {
                            setCategoryInput(categoryInput);
                            setEditedTemplate({ ...editedTemplate, category: categoryInput });
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {`+ Add "${categoryInput}"`}
                        </button>
                      );
                    }
                    dropdownItems.push(
                      ...uniqueCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          className={`w-full text-left px-3 py-1 hover:bg-slate-100 text-sm ${cat === categoryInput ? 'bg-blue-50 font-semibold' : ''}`}
                          onMouseDown={() => {
                            setCategoryInput(cat);
                            setEditedTemplate({ ...editedTemplate, category: cat });
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {cat}
                        </button>
                      ))
                    );
                    return dropdownItems;
                  })()}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Side Panel Description</label>
              <textarea
                value={editedTemplate.sidePanelDescription || ''}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, sidePanelDescription: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-1 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
            {/* Hide icon section for trigger template */}
            {!(editedTemplate.name.toLowerCase().includes('trigger') || editedTemplate.icon === 'Zap') && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Icon</label>
                  <div className="flex items-center">
                    <div className="flex rounded-xl bg-white border border-slate-200 p-0.5">
                      {["purple", "orange"].map((color) => {
                        const colorConfig = ICON_COLORS.find(c => c.value === color);
                        const isSelected = (editedTemplate.iconColor || 'purple') === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditedTemplate({ ...editedTemplate, iconColor: color })}
                            className={`flex flex-row items-center gap-1 px-2 py-1 rounded-lg focus:outline-none transition-all duration-200 ${
                              isSelected ? 'bg-white border border-[#4D3EE0] shadow-sm' : 'bg-transparent border border-transparent'
                            }`}
                            style={{ minWidth: 40 }}
                            aria-label={colorConfig?.name}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: colorConfig?.iconColor }}
                            />
                            <span
                              className="text-[10px] font-medium text-slate-600"
                            >
                              {colorConfig?.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {AVAILABLE_ICONS.map((iconOption) => {
                    const IconComponent = getIconComponent(iconOption.name, editedTemplate.customIconSvg);
                    const isSelected = editedTemplate.icon === iconOption.name;
                    const iconColor = ICON_COLORS.find(c => c.value === (editedTemplate.iconColor || 'purple')) || ICON_COLORS[0];
                    const isCondition = iconOption.name === 'Split';
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => setEditedTemplate({ ...editedTemplate, icon: normalizeIconName(iconOption.name) })}
                        disabled={loading}
                        className={`p-0.5 rounded-lg border transition-all duration-200 disabled:opacity-50 ${
                          isSelected
                            ? 'border-[#4D3EE0] bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center mx-auto"
                          style={{ backgroundColor: iconColor.bg }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor, ...(isCondition ? { transform: 'rotate(90deg)' } : {}) }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {showSvgInput && (
                  <div className="w-full mt-2 space-y-2">
                    <textarea
                      value={svgDraft}
                      onChange={e => setSvgDraft(e.target.value)}
                      rows={4}
                      placeholder="Paste SVG markup here"
                      className="w-full px-2 py-1 border text-xs font-mono border-slate-300 rounded"
                    />
                    {svgDraft.trim() !== '' && (
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditedTemplate({ ...editedTemplate, icon: 'Custom', customIconSvg: svgDraft });
                            setShowSvgInput(false);
                            setSvgDraft('');
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save SVG
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowSvgInput(false); setSvgDraft(''); }}
                          className="px-3 py-1 border text-xs rounded hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        {/* preview */}
                        <span
                          className="w-6 h-6 inline-flex border border-slate-200 rounded"
                          dangerouslySetInnerHTML={{ __html: svgDraft }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tab Bar for switching between Configuration, Advanced, User Interface */}
          {!(editedTemplate.name.toLowerCase().includes('trigger') || editedTemplate.icon === 'Zap' || editedTemplate.name.toLowerCase() === 'condition' || editedTemplate.icon === 'Split') && (
          <div className="flex bg-[#F5F7FA] rounded-xl p-0.5 w-full max-w-full mb-4">
            {allTabs.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  `flex-1 py-2 text-[12px] font-semibold focus:outline-none transition-all duration-150 ` +
                  (activeTab === tab
                    ? 'bg-white shadow text-slate-700 z-10 ' +
                      (idx === 0 ? 'rounded-l-xl' : '') +
                      (idx === allTabs.length - 1 ? ' rounded-r-xl' : '')
                    : 'bg-transparent text-slate-500 hover:text-slate-700 ' +
                      (idx === 0 ? 'rounded-l-xl' : '') +
                      (idx === allTabs.length - 1 ? ' rounded-r-xl' : ''))
                }
                style={{ minWidth: 0 }}
                disabled={loading}
              >
                {tab}
              </button>
            ))}
          </div>
          )}
          {/* Add UI Element Button for Active Tab */}
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
            {filteredElements.map((element, index) => (
              <UIElementEditor
                key={element.id}
                element={element}
                onUpdate={(updates) => updateUIElement(element.id, updates)}
                onRemove={() => removeUIElement(element.id)}
                onMoveUp={() => moveUIElement(element.id, 'up')}
                onMoveDown={() => moveUIElement(element.id, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < filteredElements.length - 1}
                disabled={loading}
                allElements={editedTemplate.sidePanelElements}
                tabSelector
                onTabChange={tab => updateUIElement(element.id, { tab })}
              />
            ))}
            {filteredElements.length === 0 && (
              <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                No elements in this tab yet. Click "+ Add Element" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-slate-600 text-sm hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-1 bg-[#4D3EE0] text-white text-sm rounded-xl hover:bg-[#2927B2]  flex items-center space-x-2 disabled:opacity-50"
        >
          <span>Save template changes</span>
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

// --- Custom Dropdown for Element Suggestions with Previews ---
function ElementSuggestionDropdown({
  elements,
  onSelect,
  position,
  onClose,
  getIconComponent
}: {
  elements: any[];
  onSelect: (element: any) => void;
  position: { top: number; left: number };
  onClose?: () => void;
  getIconComponent?: (type: string) => React.ComponentType<any>;
}) {
  return (
    <div
      className="absolute z-50 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-[250px]"
      style={{ top: position.top, left: position.left }}
      tabIndex={-1}
    >
      <div className="p-2 text-xs text-slate-500 border-b">
        Select an element to reference:
      </div>
      {elements.map((element) => (
        <button
          key={element.id}
          onClick={() => { onSelect(element); if (onClose) onClose(); }}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0 flex items-center gap-3"
        >
          {/* Preview icon or type visual */}
         
          <span className="flex flex-col items-start">
            <span className="font-medium text-slate-900">{element.label}</span>
            <span className="text-xs text-slate-500 capitalize">
              {element.id?.startsWith('new-') ? `Create new ${element.type}` : `${element.type}`}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

// --- Refactor MapDescriptionInput to use ElementSuggestionDropdown ---
function MapDescriptionInput({ value, onChange, uiElements, disabled }: MapDescriptionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const getAllUIElements = (elements: UIElement[]): UIElement[] => {
    const allElements: UIElement[] = [];
    const traverse = (els: UIElement[]) => {
      els.forEach(el => {
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
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      if (textAfterHash === '' || /^[a-zA-Z0-9\s]*$/.test(textAfterHash)) {
        setShowSuggestions(true);
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const textBeforeHash = textBeforeCursor.substring(0, lastHashIndex);
          const lines = textBeforeHash.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[currentLine].length;
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
        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        rows={2}
        placeholder="Description shown on the workflow map. Use # to reference UI element values."
      />
      {showSuggestions && availableElements.length > 0 && (
        <ElementSuggestionDropdown
          elements={availableElements}
          onSelect={handleElementSelect}
          position={suggestionPosition}
          onClose={() => setShowSuggestions(false)}
        />
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
  tabSelector?: boolean;
  onTabChange?: (tab: 'Configuration' | 'Advanced' | 'User Interface') => void;
}

function UIElementEditor({ element, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown, disabled, allElements, tabSelector, onTabChange }: UIElementEditorProps) {
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

  // --- Conditions Module Options Editor ---
  // Helper to generate a unique value from label
  function generateUniqueValue(label: string, existing: string[], base?: string): string {
    let val = (base || label).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let unique = val;
    let i = 1;
    while (existing.includes(unique)) {
      unique = val + '_' + i;
      i++;
    }
    return unique;
  }

  const handleAddPropertyOption = () => {
    const current = element.propertyOptions || [];
    onUpdate({ propertyOptions: [...current, { label: '', value: '', values: ['', ''] }] });
  };
  const handleUpdatePropertyOption = (idx: number, updates: Partial<{ label: string; value: string; values: string[] }>) => {
    const current = element.propertyOptions || [];
    let updated = current.map((opt, i) => {
      if (i !== idx) return opt;
      let newLabel = updates.label !== undefined ? updates.label : opt.label;
      let newValue = updates.value !== undefined ? updates.value : opt.value;
      if (updates.label !== undefined && updates.value === undefined) {
        // Generate unique value from label if value not explicitly set
        const others = current.filter((_, j) => j !== idx).map(o => o.value);
        newValue = generateUniqueValue(newLabel, others);
      }
      return { ...opt, ...updates, label: newLabel, value: newValue };
    });
    onUpdate({ propertyOptions: updated });
  };
  const handleRemovePropertyOption = (idx: number) => {
    const current = element.propertyOptions || [];
    const updated = current.filter((_, i) => i !== idx);
    onUpdate({ propertyOptions: updated });
  };
  const handleAddOperatorOption = () => {
    const current = element.operatorOptions || [];
    onUpdate({ operatorOptions: [...current, { label: '', value: '' }] });
  };
  const handleUpdateOperatorOption = (idx: number, updates: Partial<{ label: string }>) => {
    const current = element.operatorOptions || [];
    let updated = current.map((opt, i) => {
      if (i !== idx) return opt;
      let newLabel = updates.label !== undefined ? updates.label : opt.label;
      let newValue = opt.value;
      if (updates.label !== undefined) {
        // Generate unique value from label
        const others = current.filter((_, j) => j !== idx).map(o => o.value);
        newValue = generateUniqueValue(newLabel, others);
      }
      return { ...opt, ...updates, value: newValue };
    });
    onUpdate({ operatorOptions: updated });
  };
  const handleRemoveOperatorOption = (idx: number) => {
    const current = element.operatorOptions || [];
    const updated = current.filter((_, i) => i !== idx);
    onUpdate({ operatorOptions: updated });
  };

  const handleUpdatePropertyOptionValue = (propIdx: number, valueIdx: number, newValue: string) => {
    const current = element.propertyOptions || [];
    const prop = current[propIdx];
    const newValues = [...(prop.values || [])];
    newValues[valueIdx] = newValue;
    handleUpdatePropertyOption(propIdx, { values: newValues });
  };
  const handleAddPropertyOptionValue = (propIdx: number) => {
    const current = element.propertyOptions || [];
    const prop = current[propIdx];
    const newValues = [...(prop.values || []), ''];
    handleUpdatePropertyOption(propIdx, { values: newValues });
  };
  const handleRemovePropertyOptionValue = (propIdx: number, valueIdx: number) => {
    const current = element.propertyOptions || [];
    const prop = current[propIdx];
    const newValues = (prop.values || []).filter((_, i) => i !== valueIdx);
    handleUpdatePropertyOption(propIdx, { values: newValues });
  };

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
      {/* Tab Selector Dropdown */}
      {/* {tabSelector && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Tab</label>
          <select
            value={element.tab || 'Configuration'}
            onChange={e => {
              const tab = e.target.value as 'Configuration' | 'Advanced' | 'User Interface';
              if (onTabChange) {
                onTabChange(tab);
              } else {
                onUpdate({ tab });
              }
            }}
            disabled={disabled}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="Configuration">Configuration</option>
            <option value="Advanced">Advanced</option>
            <option value="User Interface">User Interface</option>
          </select>
        </div>
      )} */}
      <div className="flex items-center justify-between mb-3">
        <UIElementTypeDropdown
          value={element.type}
          onChange={(newType) => {
            const castType = newType as UIElement['type'];
            if (castType === 'events-module' && (!element.events || element.events.length === 0)) {
              onUpdate({
                type: castType,
                events: [
                  { title: 'The Dream Career Conference', subtitle: 'High Volume Hiring', tag: 'Upcoming' },
                  { title: 'Technical Professionals Meetup', subtitle: 'High Volume Hiring', tag: 'Upcoming' },
                  { title: 'How Phenom keeps employees happy', subtitle: 'High Volume Hiring', tag: 'Upcoming' }
                ],
                label: ''
              });
            } else {
              onUpdate({ type: castType });
            }
          }}
          disabled={disabled}
        />
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
        {element.type === 'text-block' ? (
          <div className="col-span-2 mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Text Content</label>
            <textarea
              value={element.text || element.label}
              onChange={e => onUpdate({ text: e.target.value, label: e.target.value })}
              disabled={disabled}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              rows={4}
              placeholder="Enter text content..."
            />
          </div>
        ) : element.type !== 'section-divider' && element.type !== 'screening-questions' && element.type !== 'conditions-module' && element.type !== 'events-module' && element.type !== 'trigger-conditions-module' && (
          <div className={element.type === 'toggle' ? 'col-span-2' : ''}>
            <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
            <input
              type="text"
              value={element.label}
              onChange={e => onUpdate({ label: e.target.value })}
              disabled={disabled}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
        )}
        {element.type !== 'section-divider' && element.type !== 'screening-questions' && element.type !== 'conditions-module' && element.type !== 'events-module' && element.type !== 'checkbox' && element.type !== 'button' && element.type !== 'trigger-conditions-module' && element.type !== 'toggle' && element.type !== 'file-upload' && element.type !== 'radio' && element.type !== 'text-block' && element.type !== 'date' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Placeholder</label>
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              disabled={disabled}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="Placeholder"
            />
          </div>
        )}
        {element.type === 'date' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Placeholder</label>
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              disabled={disabled}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="e.g. Select a date"
            />
          </div>
        )}
      </div>
     
      {/* Default text for text and textarea */}
      {['text', 'textarea'].includes(element.type) && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Default Text</label>
          <input
            type="text"
            value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
            onChange={e => onUpdate({ defaultValue: e.target.value })}
            disabled={disabled}
            className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="Optional default text"
          />
        </div>
      )}
       {/* Half-size input checkbox for text, dropdown, date, number */}
       {['text', 'dropdown', 'date', 'number'].includes(element.type) && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id={`half-size-${element.id}`}
            checked={element.halfSize || false}
            onChange={e => onUpdate({ halfSize: e.target.checked })}
            disabled={disabled}
            className="mr-2 disabled:opacity-50"
          />
          <label htmlFor={`half-size-${element.id}`} className="text-xs text-slate-600">
            Half-size input
          </label>
        </div>
      )}

      {(element.type === 'dropdown' || element.type === 'radio' || element.type === 'checkbox') && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-slate-600">Options</label>
            <button
              onClick={addOption}
              disabled={disabled}
              className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {(element.options || []).map((option, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  disabled={disabled}
                  className="w-full pr-8 px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={disabled}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 focus:outline-none"
                  tabIndex={-1}
                  aria-label="Remove option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!element.options || element.options.length === 0) && (
              <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                No options added yet. Click "Add" to create your first option.
              </div>
            )}
          </div>
          {/* Default option selector */}
          {(element.type === 'dropdown' || element.type === 'radio') && (
           <div className="mt-2">
           <label className="block text-xs font-medium text-slate-600 mb-1">Default Selected Option</label>
           
           <div className="relative">
             <select
               value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
               onChange={e => onUpdate({ defaultValue: e.target.value || undefined })}
               disabled={disabled || !element.options || element.options.length === 0}
               className="w-full appearance-none px-2 pr-8 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
             >
               <option value="">None</option>
               {element.options && element.options.map((option, idx) => (
                 <option key={idx} value={option}>{option}</option>
               ))}
             </select>
         
             <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
               <svg
                 className="w-4 h-4 text-[#8C95A8]"
                 xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 20 20"
                 fill="currentColor"
               >
                 <path
                   fillRule="evenodd"
                   d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                   clipRule="evenodd"
                 />
               </svg>
             </div>
           </div>
         </div>
         
          )}
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

      {/* {element.type !== 'section-divider' && element.type !== 'text-block' && element.type !== 'button' && (
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
      )} */}

      {/* Button-specific configurations */}
      {element.type === 'button' && (
        <div className="space-y-3 mb-3">
          {/* Has title checkbox */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`has-title-${element.id}`}
              checked={!!element.hasTitle}
              onChange={e => onUpdate({ hasTitle: e.target.checked })}
              disabled={disabled}
              className="mr-2 disabled:opacity-50"
            />
            <label htmlFor={`has-title-${element.id}`} className="text-xs text-slate-600">
              Has title
            </label>
          </div>
          {/* Title input */}
          {element.hasTitle && (
            <div className="mb-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input
                type="text"
                value={element.title || ''}
                onChange={e => onUpdate({ title: e.target.value })}
                disabled={disabled}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Button title"
              />
            </div>
          )}
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
            <div className="space-y-3 ml-4  rounded-lg">
              <div>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_ICONS.map((iconOption) => {
                    const IconComponent = iconOption.component;
                    const isSelected = element.icon === iconOption.name;
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => onUpdate({ icon: normalizeIconName(iconOption.name) })}
                        disabled={disabled}
                        className={`p-1 rounded border bg-white transition-all duration-200 disabled:opacity-50 ${
                          isSelected
                            ? 'border-[#4D3EE0] bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mx-auto" style={{ color: '#4D3EE0' }} />
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
                    className={`px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50 ${
                      (element.iconPosition || 'left') === 'left'
                        ? 'bg-blue-50 text-slate-800  border border-[#4D3EE0]'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ iconPosition: 'right' })}
                    disabled={disabled}
                    className={`px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50 ${
                      element.iconPosition === 'right'
                        ? 'bg-blue-50 text-slate-800 border border-[#4D3EE0]'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
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

          {/* Add New Elements checkbox (only if addsElements is checked) */}
          {element.addsElements && (
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id={`add-new-elements-${element.id}`}
                checked={!!element.addNewElements}
                onChange={e => onUpdate({ addNewElements: e.target.checked })}
                disabled={disabled}
                className="mr-2 disabled:opacity-50"
              />
              <label htmlFor={`add-new-elements-${element.id}`} className="text-xs text-slate-600">
                Add new elements
              </label>
            </div>
          )}

          {/* Configure added elements or reference input */}
          {element.addsElements && element.addNewElements && (
            <div className="ml-4 p-3 bg-white rounded border">
              <label className="block text-xs font-medium text-slate-600 mb-2">Elements to Add (appear above button)</label>
              <div className="space-y-2">
                {(element.addedElements || []).map((addedEl, idx) => (
                  <UIElementEditor
                    key={addedEl.id}
                    element={addedEl}
                    onUpdate={updates => {
                      const newAdded = [...(element.addedElements || [])];
                      newAdded[idx] = { ...addedEl, ...updates };
                      onUpdate({ addedElements: newAdded });
                    }}
                    onRemove={() => {
                      const newAdded = [...(element.addedElements || [])];
                      newAdded.splice(idx, 1);
                      onUpdate({ addedElements: newAdded });
                    }}
                    onMoveUp={() => {
                      if (idx > 0) {
                        const newAdded = [...(element.addedElements || [])];
                        [newAdded[idx - 1], newAdded[idx]] = [newAdded[idx], newAdded[idx - 1]];
                        onUpdate({ addedElements: newAdded });
                      }
                    }}
                    onMoveDown={() => {
                      if (idx < (element.addedElements?.length || 0) - 1) {
                        const newAdded = [...(element.addedElements || [])];
                        [newAdded[idx + 1], newAdded[idx]] = [newAdded[idx], newAdded[idx + 1]];
                        onUpdate({ addedElements: newAdded });
                      }
                    }}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < (element.addedElements?.length || 0) - 1}
                    disabled={disabled}
                    allElements={allElements}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newAdded = [
                      ...((element.addedElements as UIElement[]) || []),
                      {
                        id: Date.now().toString(),
                        type: 'dropdown',
                        label: 'New Dropdown',
                        required: false,
                        options: ['Option 1', 'Option 2'],
                        tab: element.tab
                      } as UIElement
                    ];
                    onUpdate({ addedElements: newAdded });
                  }}
                  className="text-xs text-blue-700 hover:underline mt-2"
                  disabled={disabled}
                >
                  + Add Element
                </button>
              </div>
            </div>
          )}
          {element.addsElements && !element.addNewElements && (
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
                Has follow-up elements
              </label>
            </div>
            {element.hasConditionalFollowUps && (
              <button
                onClick={addConditionalFollowUp}
                disabled={disabled}
                className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                <span>Add condition</span>
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
                          className="px-2 py-1 border border-[#8C95A8] rounded-[10px] text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                          className="px-2 py-1 border border-[#8C95A8] rounded-[10px] text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                          className="px-2 py-1 border border-[#8C95A8] rounded-[10px] text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                        className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2]transition-colors disabled:opacity-50"
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

      {element.type === 'number' && (
        <>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Default Value</label>
            <input
              type="number"
              value={(typeof element.defaultValue === 'number' || typeof element.defaultValue === 'string') ? element.defaultValue : ''}
              onChange={e => onUpdate({ defaultValue: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Default value"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min</label>
              <input
                type="number"
                value={element.min ?? ''}
                onChange={e => onUpdate({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max</label>
              <input
                type="number"
                value={element.max ?? ''}
                onChange={e => onUpdate({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Step</label>
              <input
                type="number"
                value={element.step ?? ''}
                onChange={e => onUpdate({ step: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Step"
              />
            </div>
          </div>
        </>
      )}

      {element.type === 'date' && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Default Value</label>
            <input
              type="date"
              value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
              onChange={e => onUpdate({ defaultValue: e.target.value })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Min</label>
            <input
              type="date"
              value={typeof element.min === 'string' ? element.min : ''}
              onChange={e => onUpdate({ min: e.target.value })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Max</label>
            <input
              type="date"
              value={typeof element.max === 'string' ? element.max : ''}
              onChange={e => onUpdate({ max: e.target.value })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Step (days)</label>
            <input
              type="number"
              value={element.step ?? ''}
              onChange={e => onUpdate({ step: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Step"
            />
          </div>
        </div>
      )}
      {element.type === 'text' && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id={`disabled-${element.id}`}
            checked={!!element.disabled}
            onChange={e => onUpdate({ disabled: e.target.checked })}
            disabled={disabled}
            className="mr-2 disabled:opacity-50"
          />
          <label htmlFor={`disabled-${element.id}`} className="text-xs text-slate-600">
            Is disabled
          </label>
        </div>
      )}
      {element.type === 'section-divider' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Section Title</label>
          <input
            type="text"
            value={element.text || element.label}
            onChange={e => onUpdate({ text: e.target.value, label: e.target.value })}
            disabled={disabled}
            className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            placeholder="Section title (optional)"
          />
          <div className="text-xs text-slate-500 mt-1">Leave empty if you just want a divider line</div>
        </div>
      )}
      {/* Events Module Editor */}
      {element.type === 'events-module' && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Events</label>
          <div className="space-y-3">
            {(element.events || []).map((event, idx) => (
              <div key={idx} className="border rounded-lg p-3 bg-slate-50 flex flex-col gap-0 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                  onClick={() => {
                    const newEvents = [...(element.events || [])];
                    newEvents.splice(idx, 1);
                    onUpdate({ events: newEvents });
                  }}
                  tabIndex={-1}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mb-2">
  <label className="block text-xs font-medium text-gray-700 mb-1">Event title</label>
  <input
    type="text"
    className="w-full px-2 py-1 border border-[#8C95A8] rounded-lg text-sm mb-1"
    placeholder="Event title"
    value={event.title}
    onChange={e => {
      const newEvents = [...(element.events || [])];
      newEvents[idx] = { ...event, title: e.target.value };
      onUpdate({ events: newEvents });
    }}
  />
</div>

<div className="mb-2">
  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
  <input
    type="text"
    className="w-full px-2 py-1 border border-[#8C95A8] rounded-lg text-sm mb-1"
    placeholder="Event description"
    value={event.subtitle}
    onChange={e => {
      const newEvents = [...(element.events || [])];
      newEvents[idx] = { ...event, subtitle: e.target.value };
      onUpdate({ events: newEvents });
    }}
  />
</div>

<div className="mb-2">
  <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
  <input
    type="text"
    className="w-full px-2 py-1 border border-[#8C95A8] rounded-lg text-sm"
    placeholder="Event tag"
    value={event.tag}
    onChange={e => {
      const newEvents = [...(element.events || [])];
      newEvents[idx] = { ...event, tag: e.target.value };
      onUpdate({ events: newEvents });
    }}
  />
</div>

              </div>
            ))}
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2]"
              onClick={() => {
                const newEvents = [...(element.events || []), { title: '', subtitle: '', tag: '' }];
                onUpdate({ events: newEvents });
              }}
            >
              + Add Event
            </button>
          </div>
        </div>
      )}
      {/* --- Conditions Module Configurable Options --- */}
      {element.type === 'conditions-module' && (
        <div className="mb-4">
          <div className="mb-2 font-semibold text-xs text-slate-700">Property Options</div>
          <div className="space-y-4 mb-2">
            {(element.propertyOptions || []).map((opt, idx) => (
              <div key={idx} className="flex flex-col gap-1 border border-slate-200 rounded-lg p-2 bg-slate-50">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    className="px-3 py-2 border border-[#8C95A8] rounded-lg text-xs w-full pr-8"
                    placeholder="Label"
                    value={opt.label}
                    onChange={e => handleUpdatePropertyOption(idx, { label: e.target.value })}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                    onClick={() => handleRemovePropertyOption(idx)}
                    disabled={disabled}
                    aria-label="Remove property option"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="ml-0 mt-1">
                  <div className="text-[10px] text-slate-500 mb-1">Possible Values</div>
                  <div className="flex flex-col gap-1 items-start w-full">
                    {(opt.values || []).map((val, vIdx) => (
                      <div key={vIdx} className="relative flex items-center w-full">
                        <input
                          type="text"
                          className="px-3 py-2 border border-[#8C95A8] rounded-lg text-xs w-full pr-8"
                          placeholder={`Value ${vIdx + 1}`}
                          value={val}
                          onChange={e => handleUpdatePropertyOptionValue(idx, vIdx, e.target.value)}
                          disabled={disabled}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                          onClick={() => handleRemovePropertyOptionValue(idx, vIdx)}
                          disabled={disabled}
                          aria-label="Remove value"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
                      onClick={() => handleAddPropertyOptionValue(idx)}
                      disabled={disabled}
                    >+ Add Value</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
            onClick={handleAddPropertyOption}
            disabled={disabled}
          >+ Add Property Option</button>

          <div className="mt-4 mb-2 font-semibold text-xs text-slate-700">Operator Options</div>
          <div className="space-y-2 mb-2">
            {(element.operatorOptions || []).map((opt, idx) => (
              <div key={idx} className="relative flex items-center">
                <input
                  type="text"
                  className="px-3 py-2 border border-[#8C95A8] rounded-lg text-xs w-full pr-8"
                  placeholder="Label"
                  value={opt.label}
                  onChange={e => handleUpdateOperatorOption(idx, { label: e.target.value })}
                  disabled={disabled}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                  onClick={() => handleRemoveOperatorOption(idx)}
                  disabled={disabled}
                  aria-label="Remove operator option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
            onClick={handleAddOperatorOption}
            disabled={disabled}
          >+ Add Operator Option</button>
        </div>
      )}
      {/* Trigger Conditions Module: Attribute and Operator Options */}
      {element.type === 'trigger-conditions-module' && (
        <>
          <div className="mt-4 mb-2 font-semibold text-xs text-slate-700">Attribute options</div>
          <div className="space-y-2 mb-2">
            {(element.propertyOptions || []).map((opt, idx) => (
              <div key={idx} className="relative flex flex-col gap-1">
                <div className="text-xs font-medium text-slate-600">Attribute</div>
                <div className="flex items-start gap-2">
                  <div className="relative w-full">
                    <input
                      type="text"
                      className="px-3 py-2 border border-[#8C95A8] rounded-lg text-xs w-full pr-8"
                      placeholder="Label"
                      value={opt.label}
                      onChange={e => {
                        // Generate value from label (spaces to underscores, unique)
                        const label = e.target.value;
                        const baseValue = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        const others = (element.propertyOptions || []).filter((_, j) => j !== idx).map(o => o.value);
                        let uniqueValue = baseValue;
                        let i = 1;
                        while (others.includes(uniqueValue)) {
                          uniqueValue = baseValue + '_' + i;
                          i++;
                        }
                        handleUpdatePropertyOption(idx, { label, value: uniqueValue });
                      }}
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                      onClick={() => handleRemovePropertyOption(idx)}
                      disabled={disabled}
                      aria-label="Remove property option"
                      style={{ lineHeight: 0 }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Values for this attribute, underneath the label */}
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-medium text-slate-600">Values</div>
                  {(opt.values || []).map((val, vIdx) => (
                    <div key={vIdx} className="relative flex items-start gap-1 w-full">
                      <input
                        type="text"
                        className="px-2 py-1 border border-[#8C95A8] rounded-lg text-xs w-full pr-8"
                        placeholder={`Value ${vIdx + 1}`}
                        value={val}
                        onChange={e => handleUpdatePropertyOptionValue(idx, vIdx, e.target.value)}
                        disabled={disabled}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                        onClick={() => handleRemovePropertyOptionValue(idx, vIdx)}
                        disabled={disabled}
                        aria-label="Remove value"
                        style={{ lineHeight: 0 }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="self-start text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
                    onClick={() => handleAddPropertyOptionValue(idx)}
                    disabled={disabled}
                  >+ Add Value</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
              onClick={handleAddPropertyOption}
              disabled={disabled}
            >+ Add Attribute Option</button>
          </div>

          <div className="mt-4 mb-2 font-semibold text-xs text-slate-700">Operator options</div>
          <div className="space-y-2 mb-2">
            {(element.operatorOptions || []).map((opt, idx) => (
              <div key={idx} className="relative flex items-center">
                <input
                  type="text"
                  className="px-3 py-2 border border-[#8C95A8] rounded-lg text-xs w-full pr-8"
                  placeholder="Label"
                  value={opt.label}
                  onChange={e => handleUpdateOperatorOption(idx, { label: e.target.value })}
                  disabled={disabled}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1"
                  onClick={() => handleRemoveOperatorOption(idx)}
                  disabled={disabled}
                  aria-label="Remove operator option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
              onClick={handleAddOperatorOption}
              disabled={disabled}
            >+ Add Operator Option</button>
          </div>
        </>
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

// --- Refactor ElementReferenceInput to use ElementSuggestionDropdown ---
function ElementReferenceInput({ value, onChange, allElements, disabled }: ElementReferenceInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const getAllUIElements = (elements: UIElement[]): UIElement[] => {
    const allElementsList: UIElement[] = [];
    const traverse = (els: UIElement[]) => {
      els.forEach(el => {
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
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      if (textAfterHash === '' || /^[a-zA-Z0-9\s]*$/.test(textAfterHash)) {
        setShowSuggestions(true);
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
        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        placeholder="Type # to reference elements (e.g., #{Questionnaire})"
      />
      {showSuggestions && availableElements.length > 0 && (
        <ElementSuggestionDropdown
          elements={availableElements}
          onSelect={handleElementSelect}
          position={suggestionPosition}
          onClose={() => setShowSuggestions(false)}
        />
      )}
      <div className="mt-1 text-xs text-slate-500">
        Type <code className="bg-slate-100 px-1 rounded">#</code> to reference existing elements or create new ones.
      </div>
    </div>
  );
}

// --- UI Element Type Dropdown with Previews ---
const UI_ELEMENT_TYPES = [
  // User inputs
  { value: 'text', label: 'Text Input', icon: Lucide.Type, category: 'User inputs' },
  { value: 'textarea', label: 'Textarea', icon: Lucide.AlignLeft, category: 'User inputs' },
  { value: 'dropdown', label: 'Dropdown', icon: Lucide.ChevronDownSquare, category: 'User inputs' },
  { value: 'radio', label: 'Radio Buttons', icon: Lucide.CircleDot, category: 'User inputs' },
  { value: 'checkbox', label: 'Checkbox', icon: Lucide.CheckSquare, category: 'User inputs' },
  { value: 'toggle', label: 'Toggle', icon: Lucide.ToggleLeft, category: 'User inputs' },
  { value: 'file-upload', label: 'File Upload', icon: Lucide.UploadCloud, category: 'User inputs' },
  { value: 'number', label: 'Numerical Input', icon: ArrowDown10, category: 'User inputs' },
  { value: 'date', label: 'Date Picker', icon: LucideCalendar, category: 'User inputs' },
  { value: 'button', label: 'Button', icon: MousePointer, category: 'User inputs' },
  // Layout
  { value: 'section-divider', label: 'Section Divider', icon: Lucide.Minus, category: 'Layout' },
  { value: 'text-block', label: 'Text Block', icon: Text, category: 'Layout' },
  // Special activities
  { value: 'screening-questions', label: 'Screening Questions Module', icon: Lucide.ListChecks, category: 'Special activities' },
  { value: 'conditions-module', label: 'Conditions Module', icon: Lucide.GitBranch, category: 'Special activities' },
  { value: 'events-module', label: 'Events Module', icon: LucideCalendar, category: 'Special activities' },
  { value: 'trigger-conditions-module', label: 'Trigger Conditions Module', icon: Lucide.Zap, category: 'Special activities' },
];

function UIElementTypeDropdown({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
  const selected = UI_ELEMENT_TYPES.find(t => t.value === value);
  // Group by category
  const grouped = UI_ELEMENT_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof UI_ELEMENT_TYPES>);
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`flex items-center gap-2 px-3 py-1 border border-[#8C95A8] rounded-[10px] text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${open ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        {selected ? <selected.icon className="w-4 h-4 text-slate-500" /> : <Lucide.HelpCircle className="w-4 h-4 text-slate-400" />}
        <span>{selected ? selected.label : 'Select type'}</span>
        <Lucide.ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 mt-2 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[320px] max-h-72 overflow-y-auto"
        >
          {Object.entries(grouped).map(([category, types]) => (
            <div key={category} className="mb-1">
              <div className="text-[10px] font-semibold text-[#8C95A8] uppercase tracking-wider px-3 py-1 bg-[#F5F7FA] rounded mb-1">{category}</div>
              <div className="flex flex-col gap-0">
                {types.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left text-[#464F5E] text-sm hover:bg-gray-50 ${value === type.value ? 'bg-[#F5F4FF] font-medium' : ''}`}
                    onClick={() => { onChange(type.value); setOpen(false); }}
                    disabled={disabled}
                  >
                    <type.icon className="w-4 h-4 text-slate-500" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}