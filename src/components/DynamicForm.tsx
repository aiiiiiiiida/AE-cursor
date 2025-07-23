import React, { useState, useRef, useEffect } from 'react';
import { UIElement, ConditionalFollowUp } from '../types';
import { Upload, Minus, X, ChevronDown, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Play, Zap, Mail, Globe, Database, FileText, Calendar, Users, Clock, CheckCircle, AlertCircle, Settings, Split, Hourglass, MessageCircle, CheckSquare, Search, User, MessageCircle as Message, Image, Tag, ListChecks as Checklist, Video, ExternalLink, Notebook as Robot } from 'lucide-react';
import ScreeningQuestionsModule from './ScreeningQuestionsModule';
import ConditionsModule from './ConditionsModule';
import TriggerConditionsModule from './TriggerConditionsModule';

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

// Helper to get all branch names from all conditions-module elements
function getAllBranchNamesFromElements(elements: UIElement[], values: Record<string, any>): string[] {
  let names: string[] = [];
  elements.forEach(element => {
    if (element.type === 'conditions-module') {
      const branches = values[element.id]?.branches || [];
      names.push(...branches.map((b: any) => b.name));
    }
    // Check nested conditional follow-ups
    if (element.conditionalFollowUps) {
      element.conditionalFollowUps.forEach(fu => {
        names.push(...getAllBranchNamesFromElements(fu.elements, values));
      });
    }
  });
  return names;
}

export function DynamicForm({ elements, onSubmit, values = {}, onChange, level = 0, originalElements, onBranchRename }: DynamicFormProps & { onBranchRename?: (oldName: string, newName: string) => void }) {
  const [formValues, setFormValues] = useState<Record<string, any>>(values);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  // Instead of keeping all dynamicElements in a flat array, track them per button id. When rendering, insert dynamic elements for a button just before that button.
  // 1. Change dynamicElements to a Record<string, UIElement[]> mapping button id to its added elements.
  // 2. In handleButtonClick, add new elements to dynamicElements[buttonId].
  // 3. In rendering, for each button, render its dynamic elements just before the button.
  const [dynamicElements, setDynamicElements] = useState<Record<string, UIElement[]>>({});
  const [activeTab, setActiveTab] = useState<'Configuration' | 'Advanced' | 'User Interface'>('Configuration');
  const dropdownRefs = useRef<Record<string, HTMLDivElement>>({});

  // Add localFormValues for buffered editing
  const [localFormValues, setLocalFormValues] = useState<Record<string, any>>(formValues);

  // Sync localFormValues with formValues when formValues change
  useEffect(() => {
    setLocalFormValues(formValues);
  }, [formValues]);

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
  console.log('DYNAMICFORM filteredElements', filteredElements);

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
    if (element.addsElements) {
      if (element.addNewElements && element.addedElements && element.addedElements.length > 0) {
        // Add a new set of addedElements above the button
        const timestamp = Date.now();
        const newElements = element.addedElements.map((el, idx) => ({
          ...el,
          id: `dynamic-${timestamp}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
          label: el.label // keep label, but id is unique
        }));
        setDynamicElements(prev => ({
          ...prev,
          [element.id]: [...(prev[element.id] || []), ...newElements]
        }));
        return;
      }
      if (element.elementReference) {
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
            setDynamicElements(prev => ({
              ...prev,
              [element.id]: [...(prev[element.id] || []), newElement]
            }));
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
            setDynamicElements(prev => ({
              ...prev,
              [element.id]: [...(prev[element.id] || []), newElement]
            }));
          }
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
    // This function is primarily for removing elements that were added by a button.
    // It doesn't directly remove from dynamicElements, as dynamic elements are managed per button.
    // If a dynamic element is removed, it should ideally be removed from the specific button's list.
    // For now, we'll just remove it from the form values if it's not a button.
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

  // Keep formValues in sync with values prop (fixes stale state after branch/node deletion)
  useEffect(() => {
    setFormValues(values);
  }, [values]);

  // --- NEW: Sync branches in formValues with values prop for conditions-module elements ---
  useEffect(() => {
    elements.forEach(element => {
      if (element.type === 'conditions-module') {
        const latestBranches = values[element.id]?.branches;
        if (latestBranches && JSON.stringify(formValues[element.id]?.branches) !== JSON.stringify(latestBranches)) {
          setFormValues(prev => ({
            ...prev,
            [element.id]: {
              ...prev[element.id],
              ...values[element.id],
              branches: latestBranches
            }
          }));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, values]);

  // --- FORCE SYNC: For every conditions-module, if branches differ, replace formValues[element.id] with values[element.id] ---
  useEffect(() => {
    elements.forEach(element => {
      if (element.type === 'conditions-module') {
        const latestBranches = values[element.id]?.branches;
        const currentBranches = formValues[element.id]?.branches;
        if (
          latestBranches &&
          (!currentBranches || JSON.stringify(currentBranches) !== JSON.stringify(latestBranches))
        ) {
          setFormValues(prev => ({
            ...prev,
            [element.id]: {
              ...values[element.id]
            }
          }));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, values]);

  // --- DEBUG LOG: Print values prop and formValues for each conditions-module element ---
  useEffect(() => {
    elements.forEach(element => {
      if (element.type === 'conditions-module') {
        console.log('[NEW LOG] [DynamicForm] values for', element.id, values[element.id]);
        console.log('[NEW LOG] [DynamicForm] formValues for', element.id, formValues[element.id]);
      }
    });
  }, [elements, values, formValues]);

  // --- FORCE: Deep compare values and formValues, reset if different ---
  useEffect(() => {
    if (JSON.stringify(values) !== JSON.stringify(formValues)) {
      setFormValues(values);
    }
  }, [values, formValues]);

  const indentClass = level > 0 ? `ml-0 ` : '';
  // In the rendering logic, for each button, render its dynamic elements (dynamicElements[element.id]) immediately before the button.
  // Remove the use of allElements = [...filteredElements, ...Object.values(dynamicElements).flat()];
  // Instead, when rendering each element, if it's a button, render dynamicElements[element.id] above it.

  // Use a counter to track the index among only condition nodes
  let conditionNodeCount = 0;
  const allBranchNames = getAllBranchNamesFromElements(elements, formValues);
  return (
    <>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
      {showTabs && (
  <div className="flex bg-[#F5F7FA] rounded-xl p-0.5 w-full max-w-full mb-4 md:col-span-2">
    {orderedTabs.map((tab, idx) => (
      <button
        key={tab}
        type="button"
        onClick={() => setActiveTab(tab)}
        className={
          `flex-1 py-2 text-[12px] focus:outline-none transition-all duration-150 ` +
          (activeTab === tab
            ? 'bg-white shadow text-slate-700 font-semibold z-10 ' +
              (idx === 0 ? 'rounded-l-xl' : '') +
              (idx === orderedTabs.length - 1 ? ' rounded-r-xl' : '')
            : 'bg-transparent text-slate-500 font-medium hover:text-slate-700 ' +
              (idx === 0 ? 'rounded-l-xl' : '') +
              (idx === orderedTabs.length - 1 ? ' rounded-r-xl' : ''))
        }
      >
        {tab}
      </button>
    ))}
  </div>
)}

      {filteredElements.map((element, index) => {
        if (element.type === 'screening-questions') {
          return (
            <div key={element.id} className="md:col-span-2">
              <ScreeningQuestionsModule
                value={formValues[element.id] || []}
                onChange={val => handleValueChange(element.id, val)}
              />
            </div>
          );
        }
        if (element.type === 'conditions-module') {
          // Always get conditionNodeNumber from form state for this node, or from the element if not present
          const conditionNodeNumber = formValues[element.id]?.conditionNodeNumber || ("conditionNodeNumber" in element ? (element as any).conditionNodeNumber : undefined) || 1;
          console.log('[DynamicForm] Rendering ConditionsModule:', {
            element,
            formValue: formValues[element.id],
            conditionNodeNumber
          });
          // Generate unique branch name for this condition node
          const generateBranchName = (branchIdx: number) => {
            return `Branch ${conditionNodeNumber}.${branchIdx + 1}`;
          };
          // Controlled branches: get from formValues or default
          const branches = formValues[element.id]?.branches || [
            { name: generateBranchName(0), outerLogic: 'or', groups: [
              { lines: [{ property: '', operator: 'is', value: '' }], groupLogic: 'or' }
            ], conditionNodeNumber }
          ];
          const handleBranchesChange = (newBranches: any) => {
            const branchNames = newBranches.map((b: any) => b.name);
            // Detect deleted branches
            const prevBranchNames = (formValues[element.id]?.branches || []).map((b: any) => b.name);
            const deletedBranches = prevBranchNames.filter((name: string) => !branchNames.includes(name));
            // Always preserve conditionNodeNumber in the form state and on every branch
            const branchesWithNumber = newBranches.map((b: any) => ({ ...b, conditionNodeNumber }));
            const newElementValue = { ...formValues[element.id], branches: branchesWithNumber, conditionNodeNumber };
            const newValues = { ...formValues, [element.id]: newElementValue, branches: branchNames };
            if (deletedBranches.length > 0) {
              console.log('DynamicForm: Deleting branches', deletedBranches, 'with values', newValues);
              onChange?.(newValues);
              setFormValues?.(newValues);
            } else {
              onChange?.(newValues);
              setFormValues?.(newValues);
            }
          };
          return (
            <div key={element.id} className="md:col-span-2">
              <ConditionsModule
                branches={branches}
                onBranchesChange={handleBranchesChange}
                propertyOptions={element.propertyOptions}
                operatorOptions={element.operatorOptions}
                conditionNodeNumber={conditionNodeNumber}
                onBranchRename={onBranchRename}
                allBranchNames={allBranchNames}
              />
            </div>
          );
        }
        if (element.type === 'events-module') {
          const events = element.events || [];
          return (
            <div key={element.id} className="md:col-span-2">
              <div className="mb-3 text-sm font-medium text-slate-700">{events.length} events found</div>
              <div className="space-y-3">
                {events.map((event, idx) => (
                  <div key={idx} className="border rounded-xl p-3 bg-white/80 flex flex-col gap-2 border-slate-200">
                    <div className="font-medium text-[#464F5E] text-sm">{event.title}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#464F5E] text-[13px]">{event.subtitle}</span>
                      <span className="bg-[#EAE8FB] text-[#2927B2] text-[11px] font-normal px-2 py-0.5 rounded-md ml-0">{event.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (element.type === 'trigger-conditions-module') {
          return (
            <div key={element.id} className="md:col-span-2">
              <TriggerConditionsModule
                value={formValues[element.id] || []}
                onChange={val => handleValueChange(element.id, val)}
                propertyOptions={element.propertyOptions}
                operatorOptions={element.operatorOptions}
              />
            </div>
          );
        }
        // Minimal working radio rendering block (only one return per element)
        if (element.type === 'radio') {
          // Render radio group with conditional follow-ups and horizontal layout
          return (
            <div key={element.id} className="space-y-2 md:col-span-2">
              <label className="block text-[13px] font-medium text-slate-700 mb-2">{element.label}</label>
              <div className="flex flex-wrap gap-4">
                {element.options?.map((option) => (
                  <label key={option} className="flex items-center space-x-2 text-sm text-slate-700 mb-2">
                    <span className="relative inline-flex items-center">
                      <input
                        type="radio"
                        name={element.id}
                        value={option}
                        checked={formValues[element.id] === option}
                        onChange={() => handleValueChange(element.id, option)}
                        required={element.required}
                        className="appearance-none w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full border border-[#AEB5C2] checked:border-[#4D3EE0] focus:ring-0 outline-none transition-colors duration-150 bg-white"
                      />
                      {formValues[element.id] === option && (
                        <span className="absolute left-1/2 top-1/2 w-2 h-2 bg-[#4D3EE0] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></span>
                      )}
                    </span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {/* Render conditional follow-ups if any */}
              {(() => {
                const conditionalElements = getConditionalFollowUps(element);
                if (conditionalElements.length > 0) {
                  return (
                    <div className="mt-4">
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
            </div>
          );
        }
        // Minimal working checkbox rendering block (multi-select)
        if (element.type === 'checkbox') {
          return (
            <div key={element.id} className="space-y-2 md:col-span-2">
              <label className="block text-[13px] font-medium text-slate-700 mb-2">{element.label}</label>
              {element.options?.map((option) => (
                <label key={option} className="flex items-center space-x-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name={element.id}
                    value={option}
                    checked={Array.isArray(formValues[element.id]) ? formValues[element.id].includes(option) : false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const prev = Array.isArray(formValues[element.id]) ? formValues[element.id] : [];
                      if (checked) {
                        handleValueChange(element.id, [...prev, option]);
                      } else {
                        handleValueChange(element.id, prev.filter((v: any) => v !== option));
                      }
                    }}
                    className="text-[#4D3EE0] focus:ring-0"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );
        }
        // Minimal working multi-select dropdown rendering block
        if (element.type === 'dropdown' && element.multiselect) {
          console.log('MULTISELECT DROPDOWN DEBUG', element);
          return (
            <div key={element.id} className="space-y-2 md:col-span-2">
              <label className="block text-[13px] font-medium text-slate-700 mb-2">{element.label}</label>
              <div className="relative" ref={el => el && (dropdownRefs.current[element.id] = el)}>
                <div
                  onClick={() => toggleDropdown(element.id)}
                  className="w-full min-h-[2.5rem] px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white flex items-center justify-between text-[13px]"
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
                            onClick={e => {
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
                      <span className="text-slate-500 text-sm">{element.placeholder || 'Select options...'}</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openDropdowns.has(element.id) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {openDropdowns.has(element.id) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#8C95A8] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {element.options?.map(option => (
                      <div key={option} className="flex items-center p-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          id={`${element.id}-${option}`}
                          checked={(formValues[element.id] || []).includes(option)}
                          onChange={e => handleMultiselectChange(element.id, option, e.target.checked)}
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
            </div>
          );
        }
        // original rendering logic follows here
        if (element.type === 'button') {
          return (
            <div key={element.id} className={indentClass}>
              <div className="flex items-center justify-between">
                {Object.values(dynamicElements).flat().some(de => de.id === element.id) && (
                  <button
                    type="button"
                    onClick={() => removeDynamicElement(element.id)}
                    className="text-red-600 hover:text-red-700 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Only render button-specific UI here */}
              {element.hasTitle && element.title && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {element.title}
                </label>
              )}
              {/* Render any dynamic elements this button has added AFTER the title and BEFORE the button itself */}
              {dynamicElements[element.id] && Array.isArray(dynamicElements[element.id]) && dynamicElements[element.id].length > 0 && (
                <div className="mb-4">
                  <DynamicForm
                    elements={dynamicElements[element.id]}
                    values={formValues}
                    onChange={onChange}
                    level={level + 1}
                    originalElements={baseElements}
                  />
                </div>
              )}
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
            </div>
          );
        } else {
          // Single element (not a group)
          const isDynamic = Object.values(dynamicElements).flat().some(de => de.id === element.id);
          if (element.type === 'toggle') {
            return (
              <div key={element.id} className="flex items-center justify-between w-full gap-2 md:col-span-2">
                <span className="text-sm text-slate-700">{element.label}</span>
                <button
                  type="button"
                  aria-pressed={!!formValues[element.id]}
                  onClick={() => handleValueChange(element.id, !formValues[element.id])}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                    formValues[element.id] ? 'bg-[#2927B2]' : 'bg-[#AEB5C2]'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      formValues[element.id] ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          }
          // If halfSize, still render with half-size class, but not in a row
          const halfSizeClass = element.halfSize && ['text', 'dropdown', 'date', 'number'].includes(element.type) ? 'md:col-span-1' : 'md:col-span-2';
          return (
            <div key={element.id} className={indentClass + ' ' + halfSizeClass}>
              {element.type === 'section-divider' && (
                ((element.label || element.text) && (element.label || element.text).trim() !== '') ? (
                  <div className="flex items-center space-x-2 my-6">
                    <div className="flex-1 h-px bg-slate-300"></div>
                    <span className="text-xs font-medium text-[#637085] px-2 uppercase tracking-wide">{element.label || element.text}</span>
                    <div className="flex-1 h-px bg-slate-300"></div>
                  </div>
                ) : (
                  <div className="h-px bg-slate-300 my-6 w-full"></div>
                )
              )}

              {element.type === 'text-block' && (
                <div className="py-2">
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    {element.text || element.label}
                  </p>
                </div>
              )}

              {element.type !== 'section-divider' && element.type !== 'text-block' && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="block text-[13px] font-medium text-slate-700 mb-2">
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
                      value={localFormValues[element.id] !== undefined ? localFormValues[element.id] : (typeof element.defaultValue === 'string' ? element.defaultValue : '')}
                      onChange={(e) => setLocalFormValues(prev => ({ ...prev, [element.id]: e.target.value }))}
                      onBlur={() => handleValueChange(element.id, localFormValues[element.id])}
                      placeholder={element.placeholder}
                      required={element.required}
                      readOnly={!!element.disabled}
                      className={`w-full px-3 py-2 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] ${
                        element.disabled ? 'bg-[#F4F6FA] border-0' : 'border border-[#8C95A8]'
                      }`}
                    />
                  )}

                  {element.type === 'textarea' && (
                    <textarea
                      value={localFormValues[element.id] !== undefined ? localFormValues[element.id] : (typeof element.defaultValue === 'string' ? element.defaultValue : '')}
                      onChange={(e) => setLocalFormValues(prev => ({ ...prev, [element.id]: e.target.value }))}
                      onBlur={() => handleValueChange(element.id, localFormValues[element.id])}
                      placeholder={element.placeholder}
                      required={element.required}
                      rows={3}
                      className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px] resize-vertical"
                    />
                  )}

                  {element.type === 'dropdown' && !element.multiselect && (
                    <select
                      value={formValues[element.id] ?? ''}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      required={element.required}
                      className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px]"
                    >
                      <option value="">{element.placeholder || 'Select an option'}</option>
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
                      value={
                        localFormValues[element.id] !== undefined && localFormValues[element.id] !== ''
                          ? localFormValues[element.id]
                          : (typeof element.defaultValue === 'number' || typeof element.defaultValue === 'string')
                            ? element.defaultValue
                            : ''
                      }
                      onChange={(e) => setLocalFormValues(prev => ({ ...prev, [element.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      onBlur={() => handleValueChange(element.id, localFormValues[element.id])}
                      placeholder={element.placeholder}
                      required={element.required}
                      min={element.min}
                      max={element.max}
                      step={element.step}
                      className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px]"
                    />
                  )}

                  {element.type === 'date' && (
                    <input
                      type="date"
                      value={localFormValues[element.id] || ''}
                      onChange={(e) => setLocalFormValues(prev => ({ ...prev, [element.id]: e.target.value }))}
                      onBlur={() => handleValueChange(element.id, localFormValues[element.id])}
                      placeholder={element.placeholder}
                      required={element.required}
                      min={typeof element.min === 'string' ? element.min : undefined}
                      max={typeof element.max === 'string' ? element.max : undefined}
                      step={element.step}
                      className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[13px]"
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

              {/* Button rendering block is handled above, so this check is not needed here. */}
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
    </>
  );
}