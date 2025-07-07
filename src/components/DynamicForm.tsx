import React, { useState, useRef, useEffect } from 'react';
import { UIElement, ConditionalFollowUp } from '../types';
import { Upload, Minus, X, ChevronDown, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Play, Zap, Mail, Globe, Database, FileText, Calendar, Users, Clock, CheckCircle, AlertCircle, Settings, Split, Hourglass, MessageCircle, CheckSquare, Search, User, MessageCircle as Message, Image, Tag, ListChecks as Checklist, Video, ExternalLink, Notebook as Robot } from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'Play', component: Play },
  { name: 'Zap', component: Zap },
  { name: 'Mail', component: Mail },
  { name: 'Globe', component: Globe },
  { name: 'Database', component: Database },
  { name: 'FileText', component: FileText },
  { name: 'Calendar', component: Calendar },
  { name: 'Users', component: Users },
  { name: 'Clock', component: Clock },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'AlertCircle', component: AlertCircle },
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
  { name: 'Robot', component: Robot },
  { name: 'Plus', component: Plus },
];

interface DynamicFormProps {
  elements: UIElement[];
  onSubmit?: (values: Record<string, any>) => void;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  level?: number; // For nested follow-up elements
  originalElements?: UIElement[]; // New prop for original elements
}

// Add helper to normalize icon names
function normalizeIconName(name: string): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Helper to recursively find an element by label in a list of UIElements (including nested conditional follow-ups)
function findElementByLabel(elements: UIElement[], label: string): UIElement | undefined {
  for (const el of elements) {
    if (el.label === label) return el;
    if (el.conditionalFollowUps) {
      for (const followUp of el.conditionalFollowUps) {
        const found = findElementByLabel(followUp.elements, label);
        if (found) return found;
      }
    }
  }
  return undefined;
}

// Helper to group consecutive half-size elements
function groupElements(elements: UIElement[]): (UIElement | UIElement[])[] {
  const groups: (UIElement | UIElement[])[] = [];
  let buffer: UIElement[] = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.halfSize && ['text', 'dropdown', 'date', 'number'].includes(el.type)) {
      buffer.push(el);
    } else {
      if (buffer.length > 0) {
        groups.push([...buffer]);
        buffer = [];
      }
      groups.push(el);
    }
  }
  if (buffer.length > 0) {
    groups.push([...buffer]);
  }
  return groups;
}

export function DynamicForm({ elements, onSubmit, values = {}, onChange, level = 0, originalElements }: DynamicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(values);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [dynamicElements, setDynamicElements] = useState<UIElement[]>([]);
  const [activeTab, setActiveTab] = useState<'Configuration' | 'Advanced' | 'User Interface'>('Configuration');
  const dropdownRefs = useRef<Record<string, HTMLDivElement>>({});

  // Determine which tabs are present
  const tabSet = new Set(
    elements.map(el => el.tab || 'Configuration')
  );
  const tabs = Array.from(tabSet) as ('Configuration' | 'Advanced' | 'User Interface')[];
  // Always show in order: Configuration, Advanced, User Interface
  const orderedTabs = ['Configuration', 'Advanced', 'User Interface'].filter(tab => tabs.includes(tab as any)) as ('Configuration' | 'Advanced' | 'User Interface')[];

  // Only show tab bar if more than one tab is present
  const showTabs = orderedTabs.length > 1;

  // Only show elements for the active tab
  const filteredElements = elements.filter(el => (el.tab || 'Configuration') === activeTab);

  // Use the top-level elements as the source of truth for cloning
  const baseElements = originalElements || elements;

  const handleValueChange = (elementId: string, value: any) => {
    const newValues = { ...formValues, [elementId]: value };
    setFormValues(newValues);
    onChange?.(newValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formValues);
  };

  const handleMultiselectChange = (elementId: string, optionValue: string, checked: boolean) => {
    const currentValues = formValues[elementId] || [];
    let newValues;
    
    if (checked) {
      newValues = [...currentValues, optionValue];
    } else {
      newValues = currentValues.filter((value: string) => value !== optionValue);
    }
    
    handleValueChange(elementId, newValues);
  };

  const removeMultiselectTag = (elementId: string, valueToRemove: string) => {
    const currentValues = formValues[elementId] || [];
    const newValues = currentValues.filter((value: string) => value !== valueToRemove);
    handleValueChange(elementId, newValues);
  };

  const toggleDropdown = (elementId: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  const closeDropdown = (elementId: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      newSet.delete(elementId);
      return newSet;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([elementId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          closeDropdown(elementId);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getConditionalFollowUps = (element: UIElement): UIElement[] => {
    if (!element.hasConditionalFollowUps || !element.conditionalFollowUps) {
      return [];
    }

    const currentValue = formValues[element.id];
    
    // Find the conditional follow-up that matches the current value
    const matchingFollowUp = element.conditionalFollowUps.find(followUp => {
      if (element.type === 'toggle' || element.type === 'checkbox') {
        return currentValue === followUp.conditionValue;
      } else {
        return currentValue === followUp.conditionValue;
      }
    });

    return matchingFollowUp ? matchingFollowUp.elements : [];
  };

  const getIconComponent = (iconName: string) => {
    const normalized = normalizeIconName(iconName);
    const icon = AVAILABLE_ICONS.find(i => i.name === normalized);
    return icon ? icon.component : Settings;
  };

  const handleButtonClick = (element: UIElement) => {
    // Mark button as clicked
    handleValueChange(element.id, true);

    // Handle adds elements functionality
    if (element.addsElements && element.elementReference) {
      const reference = element.elementReference.trim();
      // Parse the reference (e.g., "#{Questionnaire}" or "#{Text Input}")
      const match = reference.match(/^#\{(.+)\}$/);
      if (match) {
        const referencedName = match[1];
        // Recursively find the referenced element from the original (top-level) elements
        const originalElement = findElementByLabel(baseElements, referencedName);
        if (originalElement) {
          // Clone the original element exactly, with a new id and label
          const newElement: UIElement = {
            ...originalElement,
            id: `dynamic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: `${originalElement.label}`
          };
          setDynamicElements(prev => [...prev, newElement]);
        } else {
          // Fallback to previous logic (create by type)
          const elementType = getElementTypeFromName(referencedName);
          const newElement: UIElement = {
            id: `dynamic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: elementType,
            label: referencedName,
            required: false,
            ...(elementType === 'dropdown' && { options: ['Option 1', 'Option 2', 'Option 3'] })
          };
          setDynamicElements(prev => [...prev, newElement]);
        }
      }
    }
  };

  const getElementTypeFromName = (name: string): UIElement['type'] => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('questionnaire') || lowerName.includes('dropdown') || lowerName.includes('select')) {
      return 'dropdown';
    } else if (lowerName.includes('textarea') || lowerName.includes('description') || lowerName.includes('comment')) {
      return 'textarea';
    } else if (lowerName.includes('checkbox') || lowerName.includes('check')) {
      return 'checkbox';
    } else if (lowerName.includes('radio') || lowerName.includes('choice')) {
      return 'radio';
    } else if (lowerName.includes('toggle') || lowerName.includes('switch')) {
      return 'toggle';
    } else if (lowerName.includes('file') || lowerName.includes('upload')) {
      return 'file-upload';
    } else if (lowerName.includes('number')) {
      return 'number';
    } else if (lowerName.includes('date')) {
      return 'date';
    } else {
      return 'text';
    }
  };

  const removeDynamicElement = (elementId: string) => {
    setDynamicElements(prev => prev.filter(el => el.id !== elementId));
    // Also remove its value from form values
    const newValues = { ...formValues };
    delete newValues[elementId];
    setFormValues(newValues);
    onChange?.(newValues);
  };

  // Initialize default values for number inputs
  useEffect(() => {
    setFormValues(prev => {
      const updated = { ...prev };
      const setDefaults = (els: UIElement[]) => {
        els.forEach(el => {
          if (el.type === 'number' && (updated[el.id] === undefined || updated[el.id] === '')) {
            if (typeof el.defaultValue === 'number') {
              updated[el.id] = el.defaultValue;
            }
          }
          if ((el.type === 'dropdown' || el.type === 'radio') && (updated[el.id] === undefined || updated[el.id] === '')) {
            if (typeof el.defaultValue === 'string' && el.defaultValue !== '') {
              updated[el.id] = el.defaultValue;
            }
          }
          if (el.conditionalFollowUps) {
            el.conditionalFollowUps.forEach(fu => setDefaults(fu.elements));
          }
        });
      };
      setDefaults(elements);
      return updated;
    });
  }, [elements]);

  const indentClass = level > 0 ? `ml-0 ` : '';
  const allElements = [...filteredElements, ...dynamicElements];
  const groupedElements = groupElements(allElements);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showTabs && (
        <div className="flex bg-[#F5F7FA] rounded-2xl p-1 w-full max-w-full mb-4">
          {orderedTabs.map((tab, idx) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                `px-8 py-3 text-base font-semibold focus:outline-none transition-all duration-150 ` +
                (activeTab === tab
                  ? 'bg-white shadow text-slate-700 z-10 ' +
                    (idx === 0 ? 'rounded-l-2xl' : '') +
                    (idx === orderedTabs.length - 1 ? ' rounded-r-2xl' : '')
                  : 'bg-transparent text-slate-500 hover:text-slate-700 ' +
                    (idx === 0 ? 'rounded-l-2xl' : '') +
                    (idx === orderedTabs.length - 1 ? ' rounded-r-2xl' : ''))
              }
              style={{ minWidth: 160 }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      {groupedElements.map((group, groupIdx) => {
        if (Array.isArray(group)) {
          // Render consecutive half-size elements in a flex row
          return (
            <div key={group.map(e => e.id).join('-')} className="flex gap-4">
              {group.map((element, index) => {
                const isDynamic = dynamicElements.some(de => de.id === element.id);
                return (
                  <div key={element.id} className="flex-1 min-w-0" style={{maxWidth: '50%'}}>
                    {element.type === 'section-divider' && (
                      <div className="flex items-center space-x-4 my-6">
                        <div className="flex-1 h-px bg-slate-300"></div>
                        {element.text && (
                          <span className="text-sm font-medium text-slate-600 px-3">
                            {element.text}
                          </span>
                        )}
                        <div className="flex-1 h-px bg-slate-300"></div>
                      </div>
                    )}

                    {element.type === 'text-block' && (
                      <div className="py-2">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {element.text || element.label}
                        </p>
                      </div>
                    )}

                    {element.type !== 'section-divider' && element.type !== 'text-block' && element.type !== 'button' && (
                      <>
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            {element.label}
                          </label>
                          {isDynamic && (
                            <button
                              type="button"
                              onClick={() => removeDynamicElement(element.id)}
                              className="text-red-600 hover:text-red-700 text-xs"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {element.type === 'text' && (
                          <input
                            type="text"
                            value={formValues[element.id] !== undefined ? formValues[element.id] : (typeof element.defaultValue === 'string' ? element.defaultValue : '')}
                            onChange={(e) => handleValueChange(element.id, e.target.value)}
                            placeholder={element.placeholder}
                            required={element.required}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}

                        {element.type === 'textarea' && (
                          <textarea
                            value={formValues[element.id] !== undefined ? formValues[element.id] : (typeof element.defaultValue === 'string' ? element.defaultValue : '')}
                            onChange={(e) => handleValueChange(element.id, e.target.value)}
                            placeholder={element.placeholder}
                            required={element.required}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                          />
                        )}

                        {element.type === 'dropdown' && !element.multiselect && (
                          <select
                            value={formValues[element.id] ?? ''}
                            onChange={(e) => handleValueChange(element.id, e.target.value)}
                            required={element.required}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select an option</option>
                            {element.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}

                        {element.type === 'dropdown' && element.multiselect && (
                          <div className="relative" ref={el => el && (dropdownRefs.current[element.id] = el)}>
                            {/* Dropdown input with tags */}
                            <div
                              onClick={() => toggleDropdown(element.id)}
                              className="w-full min-h-[2.5rem] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white flex items-center justify-between"
                            >
                              <div className="flex-1 flex flex-wrap gap-1 items-center">
                                {formValues[element.id] && formValues[element.id].length > 0 ? (
                                  formValues[element.id].map((selectedValue: string) => (
                                    <span
                                      key={selectedValue}
                                      className="inline-flex items-center px-2 py-1 rounded-2xl text-xs font-medium bg-gray-100 text-gray-800"
                                    >
                                      {selectedValue}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeMultiselectTag(element.id, selectedValue);
                                        }}
                                        className="ml-1 text-gray-600 hover:text-blue-800"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-500 text-sm">Select options...</span>
                                )}
                              </div>
                              <ChevronDown 
                                className={`w-4 h-4 text-slate-400 transition-transform ${
                                  openDropdowns.has(element.id) ? 'rotate-180' : ''
                                }`} 
                              />
                            </div>
                            
                            {/* Dropdown options */}
                            {openDropdowns.has(element.id) && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {element.options?.map((option) => (
                                  <div key={option} className="flex items-center p-2 hover:bg-slate-50">
                                    <input
                                      type="checkbox"
                                      id={`${element.id}-${option}`}
                                      checked={(formValues[element.id] || []).includes(option)}
                                      onChange={(e) => handleMultiselectChange(element.id, option, e.target.checked)}
                                      className="mr-3"
                                    />
                                    <label htmlFor={`${element.id}-${option}`} className="text-sm text-slate-700 cursor-pointer flex-1">
                                      {option}
                                    </label>
                                  </div>
                                ))}
                                {(!element.options || element.options.length === 0) && (
                                  <div className="p-4 text-center text-sm text-slate-500">
                                    No options available
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {element.type === 'radio' && (
                          <div className="flex flex-wrap gap-2">
                            {element.options?.map((option) => {
                              const selected = formValues[element.id] === option;
                              return (
                                <label
                                  key={option}
                                  htmlFor={`${element.id}-${option}`}
                                  className={`flex items-center cursor-pointer px-0 py-0 rounded-xl transition-all text-[14px] font-medium
                                    ${selected ? '  text-[#464F5E]' : '  text-[#464F5E]'}
                                  `}
                                  style={{ minWidth: '120px' }}
                                >
                                  <span className="relative flex items-center mr-2">
                                    <span
                                      className={`inline-block w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${selected ? 'border-[#2927B2] bg-white' : 'border-[#AEB5C2] bg-white'}`}
                                    >
                                      {selected && (
                                        <span className="block w-2.5 h-2.5 rounded-full bg-[#2927B2]" />
                                      )}
                                    </span>
                                  </span>
                                  <input
                                    type="radio"
                                    id={`${element.id}-${option}`}
                                    name={element.id}
                                    value={option}
                                    checked={selected}
                                    onChange={(e) => handleValueChange(element.id, e.target.value)}
                                    required={element.required}
                                    className="sr-only"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {element.type === 'checkbox' && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={element.id}
                              checked={formValues[element.id] || false}
                              onChange={(e) => handleValueChange(element.id, e.target.checked)}
                              required={element.required}
                              className="mr-2"
                            />
                            <label htmlFor={element.id} className="text-sm text-slate-700">
                              {element.placeholder || 'Check this option'}
                            </label>
                          </div>
                        )}

                        {element.type === 'toggle' && (
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={() => handleValueChange(element.id, !formValues[element.id])}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                formValues[element.id] ? 'bg-blue-600' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formValues[element.id] ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="ml-3 text-sm text-slate-700">
                              {formValues[element.id] ? 'On' : 'Off'}
                            </span>
                          </div>
                        )}

                        {element.type === 'file-upload' && (
                          (() => {
                            const fileValue = formValues[element.id];
                            // If a file is uploaded, show preview
                            if (fileValue && typeof fileValue === 'object' && fileValue instanceof File) {
                              const isImage = fileValue.type.startsWith('image/');
                              const fileUrl = isImage ? URL.createObjectURL(fileValue) : null;
                              return (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#C3C7D1] rounded-2xl px-6 py-10 text-center min-h-[180px] relative">
                                  {isImage ? (
                                    <img src={fileUrl!} alt={fileValue.name} className="max-h-96 max-w-full rounded-xl object-contain mb-4" style={{background: '#F4F5FA'}} onLoad={() => URL.revokeObjectURL(fileUrl!)} />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center mb-4">
                                      <Upload className="w-12 h-12 text-[#AEB5C2] mb-2" />
                                    </div>
                                  )}
                                  <div className="text-sm text-[#464F5E] font-medium mb-2">
                                    {isImage ? `Image: ${fileValue.name}` : `File: ${fileValue.name}`}
                                  </div>
                                  <div className="flex gap-4 mt-2">
                                    {/* Re-upload button */}
                                    <label htmlFor={`file-${element.id}`} className="cursor-pointer text-[#2927B2] hover:text-[#1C1876]">
                                      <span className="sr-only">Re-upload</span>
                                      <RotateCcw className="w-5 h-5" />
                                    </label>
                                    {/* Delete button */}
                                    <button type="button" className="text-[#C40F24] hover:text-[#B71C1C]" onClick={() => handleValueChange(element.id, undefined)}>
                                      <span className="sr-only">Delete</span>
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleValueChange(element.id, file);
                                      }
                                    }}
                                    required={element.required}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    id={`file-${element.id}`}
                                    tabIndex={-1}
                                    style={{display: 'none'}}
                                  />
                                </div>
                              );
                            }
                            // Otherwise, show uploader
                            return (
                              <div
                                className="relative flex flex-col items-center justify-center border-2 border-dashed border-[#C3C7D1] rounded-2xl px-6 py-10 text-center min-h-[180px] cursor-pointer transition-colors hover:border-[#AEB5C2] focus-within:border-[#2927B2]"
                                tabIndex={0}
                              >
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleValueChange(element.id, file);
                                    }
                                  }}
                                  required={element.required}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  id={`file-${element.id}`}
                                  tabIndex={-1}
                                />
                                <div className="flex flex-col items-center justify-center pointer-events-none select-none">
                                  <div className="w-6 h-6 rounded-full bg-[#F4F5FA] flex items-center justify-center mb-6">
                                    <Upload className="w-4 h-4 text-[#AEB5C2]" />
                                  </div>
                                  <div className="mb-2 text-sm text-[#464F5E] font-medium">
                                    Drop file here or{' '}
                                    <label
                                      htmlFor={`file-${element.id}`}
                                      className="text-[#2927B2] font-bold underline cursor-pointer hover:text-[#1C1876] focus:text-[#1C1876] pointer-events-auto"
                                      tabIndex={0}
                                    >
                                      select a file to upload
                                    </label>
                                  </div>
                                  <div className="text-xs text-[#8C95A8] mt-1 font-normal">
                                    All <span className="font-medium">.png, .jpg, .mov, .mp4</span> types are supported, up to 10MB
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {element.type === 'number' && (
                          <input
                            type="number"
                            value={formValues[element.id] ?? ''}
                            onChange={(e) => handleValueChange(element.id, e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder={element.placeholder}
                            required={element.required}
                            min={element.min}
                            max={element.max}
                            step={element.step}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}

                        {element.type === 'date' && (
                          <input
                            type="date"
                            value={formValues[element.id] || ''}
                            onChange={(e) => handleValueChange(element.id, e.target.value)}
                            placeholder={element.placeholder}
                            required={element.required}
                            min={typeof element.min === 'string' ? element.min : undefined}
                            max={typeof element.max === 'string' ? element.max : undefined}
                            step={element.step}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}

                        {/* Render conditional follow-ups if any */}
                        {(() => {
                          const conditionalElements = getConditionalFollowUps(element);
                          if (conditionalElements.length > 0) {
                            return (
                              <div className="mt-4 ">
                                <DynamicForm
                                  elements={conditionalElements}
                                  values={formValues}
                                  onChange={onChange}
                                  level={level + 1}
                                  originalElements={baseElements}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}

                    {element.type === 'button' && (
                      <button
                        type="button"
                        onClick={() => handleButtonClick(element)}
                        className="inline-flex items-center text-[#2927B2] font-medium text-sm hover:text-[#1C1876] transition-colors"
                      >
                        {element.hasIcon && element.icon && element.iconPosition !== 'right' && (
                          <span className="mr-2">
                            {React.createElement(getIconComponent(element.icon), { className: "w-4 h-4" })}
                          </span>
                        )}
                        {element.label}
                        {element.hasIcon && element.icon && element.iconPosition === 'right' && (
                          <span className="ml-2">
                            {React.createElement(getIconComponent(element.icon), { className: "w-4 h-4" })}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        } else {
          // Single element (not a group)
          const element = group;
          const isDynamic = dynamicElements.some(de => de.id === element.id);
          // If halfSize, still render with half-size class, but not in a row
          const halfSizeClass = element.halfSize && ['text', 'dropdown', 'date', 'number'].includes(element.type) ? 'max-w-[50%]' : '';
          return (
            <div key={element.id} className={indentClass + ' ' + halfSizeClass}>
              {element.type === 'section-divider' && (
                <div className="flex items-center space-x-4 my-6">
                  <div className="flex-1 h-px bg-slate-300"></div>
                  {element.text && (
                    <span className="text-sm font-medium text-slate-600 px-3">
                      {element.text}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-slate-300"></div>
                </div>
              )}

              {element.type === 'text-block' && (
                <div className="py-2">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {element.text || element.label}
                  </p>
                </div>
              )}

              {element.type !== 'section-divider' && element.type !== 'text-block' && element.type !== 'button' && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {element.label}
                    </label>
                    {isDynamic && (
                      <button
                        type="button"
                        onClick={() => removeDynamicElement(element.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {element.type === 'text' && (
                    <input
                      type="text"
                      value={formValues[element.id] !== undefined ? formValues[element.id] : (typeof element.defaultValue === 'string' ? element.defaultValue : '')}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      placeholder={element.placeholder}
                      required={element.required}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {element.type === 'textarea' && (
                    <textarea
                      value={formValues[element.id] !== undefined ? formValues[element.id] : (typeof element.defaultValue === 'string' ? element.defaultValue : '')}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      placeholder={element.placeholder}
                      required={element.required}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    />
                  )}

                  {element.type === 'dropdown' && !element.multiselect && (
                    <select
                      value={formValues[element.id] ?? ''}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      required={element.required}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select an option</option>
                      {element.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {element.type === 'number' && (
                    <input
                      type="number"
                      value={formValues[element.id] ?? ''}
                      onChange={(e) => handleValueChange(element.id, e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={element.placeholder}
                      required={element.required}
                      min={element.min}
                      max={element.max}
                      step={element.step}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {element.type === 'date' && (
                    <input
                      type="date"
                      value={formValues[element.id] || ''}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      placeholder={element.placeholder}
                      required={element.required}
                      min={typeof element.min === 'string' ? element.min : undefined}
                      max={typeof element.max === 'string' ? element.max : undefined}
                      step={element.step}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {element.type === 'file-upload' && (
                    (() => {
                      const fileValue = formValues[element.id];
                      // If a file is uploaded, show preview
                      if (fileValue && typeof fileValue === 'object' && fileValue instanceof File) {
                        const isImage = fileValue.type.startsWith('image/');
                        const fileUrl = isImage ? URL.createObjectURL(fileValue) : null;
                        return (
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#C3C7D1] rounded-2xl px-6 py-10 text-center min-h-[180px] relative">
                            {isImage ? (
                              <img src={fileUrl!} alt={fileValue.name} className="max-h-96 max-w-full rounded-xl object-contain mb-4" style={{background: '#F4F5FA'}} onLoad={() => URL.revokeObjectURL(fileUrl!)} />
                            ) : (
                              <div className="flex flex-col items-center justify-center mb-4">
                                <Upload className="w-12 h-12 text-[#AEB5C2] mb-2" />
                              </div>
                            )}
                            <div className="text-sm text-[#464F5E] font-medium mb-2">
                              {isImage ? `Image: ${fileValue.name}` : `File: ${fileValue.name}`}
                            </div>
                            <div className="flex gap-4 mt-2">
                              {/* Re-upload button */}
                              <label htmlFor={`file-${element.id}`} className="cursor-pointer text-[#2927B2] hover:text-[#1C1876]">
                                <span className="sr-only">Re-upload</span>
                                <RotateCcw className="w-5 h-5" />
                              </label>
                              {/* Delete button */}
                              <button type="button" className="text-[#C40F24] hover:text-[#B71C1C]" onClick={() => handleValueChange(element.id, undefined)}>
                                <span className="sr-only">Delete</span>
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleValueChange(element.id, file);
                                }
                              }}
                              required={element.required}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              id={`file-${element.id}`}
                              tabIndex={-1}
                              style={{display: 'none'}}
                            />
                          </div>
                        );
                      }
                      // Otherwise, show uploader
                      return (
                        <div
                          className="relative flex flex-col items-center justify-center border-2 border-dashed border-[#C3C7D1] rounded-2xl px-4 py-4 text-center min-h-[160px] cursor-pointer transition-colors hover:border-[#AEB5C2] focus-within:border-[#2927B2]"
                          tabIndex={0}
                        >
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleValueChange(element.id, file);
                              }
                            }}
                            required={element.required}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            id={`file-${element.id}`}
                            tabIndex={-1}
                          />
                          <div className="flex flex-col items-center justify-center pointer-events-none select-none">
                            <div className="w-8 h-8 rounded-full bg-[#F4F5FA] flex items-center justify-center mb-6">
                              <Upload className="w-4 h-4 text-[#AEB5C2]" />
                            </div>
                            <div className="mb-2 text-sm text-[#464F5E] font-medium">
                              Drop file here or{' '}
                              <label
                                htmlFor={`file-${element.id}`}
                                className="text-[#2927B2] font-semibold cursor-pointer hover:text-[#1C1876] focus:text-[#1C1876] pointer-events-auto"
                                tabIndex={0}
                              >
                                select a file to upload
                              </label>
                            </div>
                            <div className="text-xs text-[#8C95A8] mt-1 font-normal">
                              All <span className="font-medium">.png, .jpg, .mov, .mp4</span> types are supported, up to 10MB
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Render conditional follow-ups if any */}
                  {(() => {
                    const conditionalElements = getConditionalFollowUps(element);
                    if (conditionalElements.length > 0) {
                      return (
                        <div className="mt-4 ">
                          <DynamicForm
                            elements={conditionalElements}
                            values={formValues}
                            onChange={onChange}
                            level={level + 1}
                            originalElements={baseElements}
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}

              {element.type === 'button' && (
                <button
                  type="button"
                  onClick={() => handleButtonClick(element)}
                  className="inline-flex items-center text-[#2927B2] font-medium text-sm hover:text-[#1C1876] transition-colors"
                >
                  {element.hasIcon && element.icon && element.iconPosition !== 'right' && (
                    <span className="mr-2">
                      {React.createElement(getIconComponent(element.icon), { className: "w-4 h-4" })}
                    </span>
                  )}
                  {element.label}
                  {element.hasIcon && element.icon && element.iconPosition === 'right' && (
                    <span className="ml-2">
                      {React.createElement(getIconComponent(element.icon), { className: "w-4 h-4" })}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        }
      })}

      {onSubmit && (
        <div className="pt-4 border-t">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      )}
    </form>
  );
}