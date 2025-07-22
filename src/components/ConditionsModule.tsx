import React, { useState, useRef, useEffect } from 'react';
import { Plus, Split, ChevronDown, Trash2, X } from 'lucide-react';

export default function ConditionsModule({ branches: propBranches, onBranchesChange, propertyOptions, operatorOptions, conditionNodeNumber, onBranchRename }: {
  branches?: any[];
  onBranchesChange?: (branches: any[]) => void;
  propertyOptions?: Array<{ label: string; value: string; values: string[] }>;
  operatorOptions?: Array<{ label: string; value: string }>;
  conditionNodeNumber?: number;
  onBranchRename?: (oldName: string, newName: string) => void;
} = {}) {
  console.log('[ConditionsModule] Received props:', { conditionNodeNumber, branches: propBranches });
  const [outerLogic, setOuterLogic] = React.useState<string>('or');
  const [editingBranchIdx, setEditingBranchIdx] = useState<number | null>(null);
  const [editingBranchValue, setEditingBranchValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const branches = propBranches || [
    { name: 'Branch 1', outerLogic: 'or', groups: [
      { lines: [{ property: '', operator: 'is', value: '' }], groupLogic: 'or' }
    ] }
  ];
  // All handlers now call onBranchesChange if provided
  const updateBranches = (newBranches: any[]) => {
    if (onBranchesChange) onBranchesChange(newBranches);
  };
  const handlePropertyChange = (branchIdx: number, groupIdx: number, property: string) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx
        ? {
            ...branch,
            groups: branch.groups.map((group: any, gi: number) =>
              gi === groupIdx
                ? { ...group, lines: group.lines.map((line: any, li: number) => li === 0 ? { ...line, property, value: '' } : line) }
                : group
            )
          }
        : branch
    );
    updateBranches(newBranches);
  };
  const handleOperatorChange = (branchIdx: number, groupIdx: number, lineIdx: number, operator: string) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx
        ? { ...branch, groups: branch.groups.map((group: any, gi: number) =>
            gi === groupIdx
              ? { ...group, lines: group.lines.map((line: any, li: number) => li === lineIdx ? { ...line, operator } : line) }
              : group
          ) }
        : branch
    );
    updateBranches(newBranches);
  };
  const handleValueChange = (branchIdx: number, groupIdx: number, lineIdx: number, value: string) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx
        ? { ...branch, groups: branch.groups.map((group: any, gi: number) =>
            gi === groupIdx
              ? { ...group, lines: group.lines.map((line: any, li: number) => li === lineIdx ? { ...line, value } : line) }
              : group
          ) }
        : branch
    );
    updateBranches(newBranches);
  };
  const handleGroupLogicSync = (branchIdx: number, groupIdx: number, logic: string) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx
        ? {
          ...branch,
          groups: branch.groups.map((group: any, gi: number) =>
            gi === groupIdx
              ? {
                  ...group,
                  groupLogic: logic,
                  lines: group.lines.map((line: any) => ({ ...line, logic }))
                }
              : group
          )
        }
        : branch
    );
    updateBranches(newBranches);
  };
  const handleAddLine = (branchIdx: number, groupIdx: number) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx
        ? { ...branch, groups: branch.groups.map((group: any, gi: number) =>
            gi === groupIdx
              ? { ...group, lines: [...group.lines, { property: '', operator: 'is', value: '', logic: 'or' }] }
              : group
          ) }
        : branch
    );
    updateBranches(newBranches);
  };
  const handleAddCondition = (branchIdx: number) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx
        ? { ...branch, groups: [...branch.groups, { lines: [{ property: '', operator: 'is', value: '' }], groupLogic: 'or' }] }
        : branch
    );
    updateBranches(newBranches);
  };
  const handleOuterLogicChange = (branchIdx: number, logic: string) => {
    const newBranches = branches.map((branch: any, bi: number) =>
      bi === branchIdx ? { ...branch, outerLogic: logic } : branch
    );
    updateBranches(newBranches);
  };

  // Always use the conditionNodeNumber prop for branch naming
  const nodeNumber = typeof conditionNodeNumber === 'number' ? conditionNodeNumber : 1;

  function generateBranchName(branchIdx: number) {
    return `Branch ${nodeNumber}.${branchIdx + 1}`;
  }

  // Ensure all branch names use the correct condition node number from the prop
  React.useEffect(() => {
    const updated = branches.map((b, idx) => {
      // Only auto-update if the name matches the pattern 'Branch X.Y'
      const match = b.name && b.name.match(/^Branch (\d+)\.(\d+)$/);
      if (match && Number(match[1]) !== nodeNumber) {
        return { ...b, name: generateBranchName(idx), conditionNodeNumber: nodeNumber };
      }
      // Always ensure conditionNodeNumber is present in each branch and matches the prop
      if (b.conditionNodeNumber !== nodeNumber) {
        return { ...b, conditionNodeNumber: nodeNumber };
      }
      return b;
    });
    // Only update if something changed
    const changed = updated.some((b, i) => b.name !== branches[i].name || b.conditionNodeNumber !== branches[i].conditionNodeNumber);
    if (changed) updateBranches(updated);
    // eslint-disable-next-line
  }, [nodeNumber, branches.length]);

  // When adding a new branch, use the unique name and always set conditionNodeNumber from the prop
  const handleAddBranch = () => {
    const newBranchIdx = branches.length;
    const newBranch = {
      name: generateBranchName(newBranchIdx),
      outerLogic: 'or',
      groups: [
        { lines: [{ property: '', operator: 'is', value: '' }], groupLogic: 'or' }
      ],
      conditionNodeNumber: nodeNumber
    };
    updateBranches([...branches, newBranch]);
  };

  // When resetting or initializing branches, use the unique naming as well
  useEffect(() => {
    if (branches.length === 0) {
      updateBranches([
        { name: generateBranchName(0), outerLogic: 'or', groups: [
          { lines: [{ property: '', operator: 'is', value: '' }], groupLogic: 'or' }
        ], conditionNodeNumber: nodeNumber }
      ]);
    }
    // Don't automatically rename existing branches - let the parent component handle that
    // eslint-disable-next-line
  }, [conditionNodeNumber]);

  const getPropertyValues = (property: string) => {
    const prop = PROPERTY_OPTIONS.find(p => p.value === property);
    return prop ? prop.values : [];
  };

  // Use configurable options if provided, otherwise fallback to defaults
  const PROPERTY_OPTIONS = propertyOptions || [
    { label: 'Job ID', value: 'jobID', values: ['302', '203', '504'] },
    { label: 'Department', value: 'department', values: ['Engineering', 'HR', 'Sales'] },
    { label: 'Country', value: 'country', values: ['US', 'Canada'] },
    { label: 'Profile skills', value: 'profileSkills', values: ['empty', 'less than 5', 'more than 5'] },
    { label: 'City', value: 'city', values: ['Bucharest', 'Oslo'] },
  ];

  const OPERATOR_OPTIONS = operatorOptions || [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'is_not' },
    { label: 'contains', value: 'contains' },
  ];

  const LOGIC_OPTIONS = [
    { label: 'OR', value: 'or' },
    { label: 'AND', value: 'and' },
  ];

  type ConditionLine = {
    property?: string;
    operator: string;
    value: string;
    logic?: string;
  };

  type ConditionGroup = {
    lines: ConditionLine[];
    groupLogic?: string;
  };

  return (
    <div className="space-y-4">
      {branches.map((branch, branchIdx) => (
        <div key={branchIdx}>
          {branches.length > 1 && (
            <div className="flex items-center mb-3 group justify-between">
              {editingBranchIdx === branchIdx ? (
                <input
                  ref={inputRef}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-[#DDF3F6] text-[#2B6476] outline-none border border-[#2B6476]"
                  value={editingBranchValue}
                  onChange={e => setEditingBranchValue(e.target.value)}
                  onBlur={() => {
                    if (editingBranchValue && editingBranchValue !== branch.name) {
                      const newBranches = branches.map((b, i) => i === branchIdx ? { ...b, name: editingBranchValue } : b);
                      updateBranches(newBranches);
                      if (onBranchRename) onBranchRename(branch.name, editingBranchValue);
                    }
                    setEditingBranchIdx(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (editingBranchValue && editingBranchValue !== branch.name) {
                        const newBranches = branches.map((b, i) => i === branchIdx ? { ...b, name: editingBranchValue } : b);
                        updateBranches(newBranches);
                        if (onBranchRename) onBranchRename(branch.name, editingBranchValue);
                      }
                      setEditingBranchIdx(null);
                    } else if (e.key === 'Escape') {
                      setEditingBranchIdx(null);
                    }
                  }}
                  autoFocus
                  style={{ minWidth: 60 }}
                />
              ) : (
                <span
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-[#DDF3F6] text-[#2B6476] inline-block cursor-pointer hover:ring-2 hover:ring-[#2B6476]"
                  onClick={() => {
                    setEditingBranchIdx(branchIdx);
                    setEditingBranchValue(branch.name);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                  title="Click to rename branch"
                >
                  {branch.name}
                </span>
              )}
              <button
                type="button"
                className="ml-2 p-1 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete branch"
                onClick={() => {
                  const newBranches = branches.filter((_, i) => i !== branchIdx);
                  updateBranches(newBranches);
                }}
                disabled={branches.length <= 1}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {branches.length > 1 && <div className="w-full h-px bg-[#D1D5DC] mb-3"></div>}
          <div className="text-slate-700 font-medium mb-1">If</div>
          {branch.groups.map((group: any, groupIdx: number) => (
            <div key={groupIdx} className="relative group">
              {/* Render AND/OR between groups if not the first group */}
              {groupIdx > 0 && (
                <div className="mb-2 relative inline-block" style={{ minWidth: 60, maxWidth: 60 }}>
                  <select
                    className="text-slate-700 font-semibold text-[15px] appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer text-center"
                    style={{ minWidth: 60, maxWidth: 60 }}
                    value={branch.outerLogic || 'or'}
                    onChange={e => handleOuterLogicChange(branchIdx, e.target.value)}
                  >
                    {LOGIC_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
              )}
              {/* Delete Condition (Group) X icon, appears on hover above the gray card */}
              {branch.groups.length > 1 && (
                <button
                  type="button"
                  className="absolute -top-0 right-0 p-1 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="Delete condition"
                  onClick={() => {
                    const newBranches = branches.map((b, bi) =>
                      bi === branchIdx
                        ? { ...b, groups: b.groups.filter((_: any, gi: number) => gi !== groupIdx) }
                        : b
                    );
                    updateBranches(newBranches);
                  }}
                  style={{ background: 'none', border: 'none' }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Group logic dropdown inside gray card (for additional lines) */}
              <div className="bg-[#F8F9FB] rounded-xl p-4 mb-4">
                <div className="space-y-3 mb-0">
                <div className="relative">
  <select
    className="w-full appearance-none px-3 pr-8 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
    value={group.lines[0].property}
    onChange={e => handlePropertyChange(branchIdx, groupIdx, e.target.value)}
  >
    <option value="">Select property</option>
    {PROPERTY_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>

  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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

                  {group.lines[0].property && (
                   <div className="flex gap-3">
                   {/* Operator Select */}
                   <div className="relative w-full">
                     <select
                       className="w-full appearance-none px-3 pr-8 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                       value={group.lines[0].operator}
                       onChange={e => handleOperatorChange(branchIdx, groupIdx, 0, e.target.value)}
                     >
                       {OPERATOR_OPTIONS.map(opt => (
                         <option key={opt.value} value={opt.value}>
                           {opt.label}
                         </option>
                       ))}
                     </select>
                     <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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
                 
                   {/* Value Select */}
                   <div className="relative w-full">
                     <select
                       className="w-full appearance-none px-3 pr-8 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                       value={group.lines[0].value}
                       onChange={e => handleValueChange(branchIdx, groupIdx, 0, e.target.value)}
                     >
                       <option value="">Select value</option>
                       {getPropertyValues(group.lines[0].property || PROPERTY_OPTIONS[0].value).map((val: any) => (
                         <option key={val} value={val}>
                           {val}
                         </option>
                       ))}
                     </select>
                     <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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
                {/* Additional lines */}
                {group.lines.slice(1).map((line: any, idx: number) => (
                  <div key={idx + 1} className="space-y-3 mb-4">
                    <div className="relative inline-block mb-1 mt-2" style={{ minWidth: 60, maxWidth: 60 }}>
                      <select
                        className="text-slate-700 font-semibold text-[15px] appearance-none bg-transparent pr-6 focus:outline-none cursor-pointer text-center"
                        style={{ minWidth: 60, maxWidth: 60 }}
                        value={group.groupLogic || 'or'}
                        onChange={e => handleGroupLogicSync(branchIdx, groupIdx, e.target.value)}
                      >
                        {LOGIC_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                    </div>
                    <div className="flex gap-3">
  {/* Operator Select */}
  <div className="relative w-full">
    <select
      className="w-full appearance-none px-3 pr-8 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      value={line.operator}
      onChange={e => handleOperatorChange(branchIdx, groupIdx, idx + 1, e.target.value)}
    >
      {OPERATOR_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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

  {/* Value Select */}
  <div className="relative w-full">
    <select
      className="w-full appearance-none px-3 pr-8 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      value={line.value}
      onChange={e => handleValueChange(branchIdx, groupIdx, idx + 1, e.target.value)}
    >
      <option value="">Select value</option>
      {getPropertyValues(group.lines[0].property || PROPERTY_OPTIONS[0].value).map((val: any) => (
        <option key={val} value={val}>
          {val}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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

                  </div>
                ))}
                {/* Add Line button: only show if property is selected */}
                {group.lines[0].property && (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:text-[#1C1876]"
                      onClick={() => handleAddLine(branchIdx, groupIdx)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Line
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Add Condition and Add Branch buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:text-[#1C1876]"
              onClick={() => handleAddCondition(branchIdx)}
            >
              <Plus className="w-4 h-4 mr-2 transform rotate-90" /> Add Condition
            </button>
            {branchIdx === branches.length - 1 && (
              <button
                type="button"
                className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:text-[#1C1876]"
                onClick={handleAddBranch}
              >
                <Split className="w-4 h-4 mr-2 transform rotate-90" /> Add Branch
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
