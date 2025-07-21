import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Trash2, X } from 'lucide-react';

const ATTRIBUTE_OPTIONS = [
  { label: 'Job ID', value: 'jobID', values: ['302', '203', '504'] },
  { label: 'City', value: 'city', values: ['Bucharest', 'Oslo'] },
  { label: 'Country', value: 'country', values: ['US', 'Canada'] },
  { label: 'Employee tenure', value: 'employeeTenure', values: ['less than 2 weeks', 'more than 2 weeks'] },
  { label: 'Profile Skills', value: 'profileSkills', values: ['JavaScript', 'Python', 'Design', 'Empty'] },
];

const OPERATOR_OPTIONS = [
  { label: 'is', value: 'is' },
  { label: 'is not', value: 'is_not' },
  { label: 'contains', value: 'contains' },
  { label: 'does not contain', value: 'does_not_contain' },
];

const LOGIC_OPTIONS = [
  { label: 'AND', value: 'and' },
  { label: 'OR', value: 'or' },
];

export default function TriggerConditionsModule({
  conditions: propConditions,
  onConditionsChange,
  value,
  onChange,
  propertyOptions,
  operatorOptions
}: {
  conditions?: any[];
  onConditionsChange?: (conditions: any[]) => void;
  value?: any[];
  onChange?: (conditions: any[]) => void;
  propertyOptions?: { label: string; value: string; values: string[] }[];
  operatorOptions?: { label: string; value: string }[];
} = {}) {
  const [internalConditions, setInternalConditions] = useState<any[]>(propConditions || []);
  const conditions = value !== undefined ? value : internalConditions;
  const setConditions = (newConditions: any[]) => {
    if (onChange) onChange(newConditions);
    else setInternalConditions(newConditions);
    if (onConditionsChange) onConditionsChange(newConditions);
  };
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Use propertyOptions and operatorOptions if provided, otherwise fallback
  const ATTRS = propertyOptions && propertyOptions.length > 0 ? propertyOptions : ATTRIBUTE_OPTIONS;
  const OPS = operatorOptions && operatorOptions.length > 0 ? operatorOptions : OPERATOR_OPTIONS;

  function getAttributeValues(attribute: string) {
    const attr = ATTRS.find(a => a.value === attribute);
    return attr ? attr.values : [];
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        openDropdownIdx !== null &&
        dropdownRefs.current[openDropdownIdx] &&
        !dropdownRefs.current[openDropdownIdx]?.contains(event.target as Node)
      ) {
        setOpenDropdownIdx(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownIdx]);

  const updateConditions = (newConditions: any[]) => {
    setConditions(newConditions);
  };

  const handleAddCondition = () => {
    const sharedLogic = conditions[1]?.logic || 'and';
    setConditions([
      ...conditions,
      { attribute: '', operator: 'is', values: [], logic: sharedLogic },
    ]);
  };

  const handleRemoveCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const handleAttributeChange = (idx: number, attribute: string) => {
    const newConditions = conditions.map((cond, i) =>
      i === idx ? { ...cond, attribute, values: [], operator: 'is' } : cond
    );
    setConditions(newConditions);
  };

  const handleOperatorChange = (idx: number, operator: string) => {
    const newConditions = conditions.map((cond, i) =>
      i === idx ? { ...cond, operator } : cond
    );
    setConditions(newConditions);
  };

  const handleValueChange = (idx: number, value: string) => {
    const cond = conditions[idx];
    let newValues = cond.values || [];
    if (newValues.includes(value)) {
      newValues = newValues.filter((v: string) => v !== value);
    } else {
      newValues = [...newValues, value];
    }
    const newConditions = conditions.map((c, i) =>
      i === idx ? { ...c, values: newValues } : c
    );
    setConditions(newConditions);
  };

  const handleRemoveTag = (idx: number, value: string) => {
    const cond = conditions[idx];
    const newValues = (cond.values || []).filter((v: string) => v !== value);
    const newConditions = conditions.map((c, i) =>
      i === idx ? { ...c, values: newValues } : c
    );
    setConditions(newConditions);
  };

  const handleLogicChange = (_idx: number, logic: string) => {
    const newConditions = conditions.map((cond, i) =>
      i === 0 ? cond : { ...cond, logic }
    );
    setConditions(newConditions);
  };

  const sharedLogic = conditions[1]?.logic || 'and';

  return (
    <div className="space-y-4">
      {conditions.map((cond, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className="mb-2 relative inline-block" style={{ minWidth: 60, maxWidth: 60 }}>
              <select
                className="text-slate-700 font-semibold text-[15px] appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer text-center"
                value={sharedLogic}
                onChange={e => handleLogicChange(idx, e.target.value)}
              >
                {LOGIC_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            </div>
          )}

          <div className="relative group bg-[#F8F9FB] rounded-xl p-4 mb-4">
            {conditions.length > 1 && (
              <button
                onClick={() => handleRemoveCondition(idx)}
                className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-red-100 border border-gray-300 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove condition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="flex gap-3 mb-3">
              <div className="w-1/2">
                <select
                  className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  value={cond.attribute}
                  onChange={e => handleAttributeChange(idx, e.target.value)}
                >
                  <option value="">Attribute</option>
                  {ATTRS.map((opt: { label: string; value: string }) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {cond.attribute && (
                <div className="w-1/2">
                  <select
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    value={cond.operator}
                    onChange={e => handleOperatorChange(idx, e.target.value)}
                  >
                    {OPS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {cond.attribute && (
              <div className="w-full mb-0">
                <div className="relative" ref={el => (dropdownRefs.current[idx] = el)}>
                  <div
                    className="w-full min-h-[2.5rem] px-3 py-2 border border-[#8C95A8] rounded-[10px] bg-white flex flex-wrap gap-1 items-center cursor-pointer"
                    tabIndex={0}
                    onClick={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setOpenDropdownIdx(openDropdownIdx === idx ? null : idx);
                      }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={openDropdownIdx === idx}
                  >
                    {cond.values && cond.values.length > 0 ? (
                      cond.values.map((val: string) => (
                        <span
                          key={val}
                          className="inline-flex items-center px-2 py-1 rounded-2xl text-xs font-medium bg-gray-100 text-gray-800 mr-1"
                        >
                          {val}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleRemoveTag(idx, val); }}
                            className="ml-1 text-gray-600 hover:text-blue-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">Select value</span>
                    )}
                    <ChevronDown className="ml-auto w-4 h-4 text-slate-400" />
                  </div>
                  {openDropdownIdx === idx && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#8C95A8] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {getAttributeValues(cond.attribute).map(option => (
                        <div key={option} className="flex items-center p-2 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            id={`cond-${idx}-val-${option}`}
                            checked={cond.values?.includes(option)}
                            onChange={() => handleValueChange(idx, option)}
                            className="mr-3"
                          />
                          <label htmlFor={`cond-${idx}-val-${option}`} className="text-sm text-slate-700 cursor-pointer flex-1">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:underline"
        onClick={handleAddCondition}
      >
        <Plus className="w-4 h-4 mr-2" /> Add Attribute
      </button>
    </div>
  );
}
