import React, { useState, useRef, useEffect } from 'react';
import { UIElement, ConditionalFollowUp } from '../types';
import { Upload, Minus, X, ChevronDown } from 'lucide-react';
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
  { name: 'Robot', component: Robot }
];

interface DynamicFormProps {
  elements: UIElement[];
  onSubmit?: (values: Record<string, any>) => void;
  values?: Record<string, any>;
  onChange?: (values: Record<string, any>) => void;
  level?: number; // For nested follow-up elements
}

export function DynamicForm({ elements, onSubmit, values = {}, onChange, level = 0 }: DynamicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(values);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [dynamicElements, setDynamicElements] = useState<UIElement[]>([]);
  const dropdownRefs = useRef<Record<string, HTMLDivElement>>({});

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
    // DEBUG: Log the iconName being passed to this function
    console.log('🔍 DynamicForm getIconComponent - iconName received:', iconName);
    console.log('🔍 DynamicForm getIconComponent - iconName type:', typeof iconName);
    console.log('🔍 DynamicForm getIconComponent - Available icons:', AVAILABLE_ICONS.map(i => i.name));
    
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    
    // DEBUG: Log the result of the icon search
    console.log('🔍 DynamicForm getIconComponent - Found icon:', icon ? icon.name : 'NOT FOUND');
    console.log('🔍 DynamicForm getIconComponent - Will return:', icon ? icon.name : 'Settings (default)');
    
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
        
        // Check if it's referencing an existing element
        const allElements = [...elements, ...dynamicElements];
        const existingElement = allElements.find(el => el.label === referencedName);
        
        if (existingElement) {
          // Clone the existing element with a new ID
          const newElement: UIElement = {
            ...existingElement,
            id: `dynamic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: `${existingElement.label} (Added)`
          };
          setDynamicElements(prev => [...prev, newElement]);
        } else {
          // Create a new element based on the reference name
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

  

  const indentClass = level > 0 ? `ml-${level * 4} ` : '';
  const allElements = [...elements, ...dynamicElements];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allElements.map((element, index) => {
        const isDynamic = dynamicElements.some(de => de.id === element.id);
        
        return (
          <div key={element.id} className={indentClass}>
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
                    {element.required && <span className="text-red-500 ml-1">*</span>}
                    {isDynamic && <span className="text-blue-600 text-xs ml-2">(Added)</span>}
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
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleValueChange(element.id, e.target.value)}
                    placeholder={element.placeholder}
                    required={element.required}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}

                {element.type === 'textarea' && (
                  <textarea
                    value={formValues[element.id] || ''}
                    onChange={(e) => handleValueChange(element.id, e.target.value)}
                    placeholder={element.placeholder}
                    required={element.required}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                )}

                {element.type === 'dropdown' && !element.multiselect && (
                  <select
                    value={formValues[element.id] || ''}
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
                  <div className="space-y-2">
                    {element.options?.map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="radio"
                          id={`${element.id}-${option}`}
                          name={element.id}
                          value={option}
                          checked={formValues[element.id] === option}
                          onChange={(e) => handleValueChange(element.id, e.target.value)}
                          required={element.required}
                          className="mr-2"
                        />
                        <label htmlFor={`${element.id}-${option}`} className="text-sm text-slate-700">
                          {option}
                        </label>
                      </div>
                    ))}
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
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-2">
                      {element.placeholder || 'Click to upload or drag and drop'}
                    </p>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleValueChange(element.id, file.name);
                        }
                      }}
                      required={element.required}
                      className="hidden"
                      id={`file-${element.id}`}
                    />
                    <label
                      htmlFor={`file-${element.id}`}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      Choose File
                    </label>
                    {formValues[element.id] && (
                      <p className="text-xs text-slate-500 mt-2">
                        Selected: {formValues[element.id]}
                      </p>
                    )}
                  </div>
                )}
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

            {/* Render conditional follow-up elements */}
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
                    />
                  </div>
                );
              }
              return null;
            })()}
          </div>
        );
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