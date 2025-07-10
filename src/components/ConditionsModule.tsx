import React, { useState } from 'react';
import { Plus, Split, ChevronDown, Trash2 } from 'lucide-react';

const PROPERTY_OPTIONS = [
  { label: 'Job ID', value: 'jobID', values: ['302', '203', '504'] },
  { label: 'Department', value: 'department', values: ['Engineering', 'HR', 'Sales'] },
  { label: 'Country', value: 'country', values: ['US', 'Canada'] },
  { label: 'Profile skills', value: 'profileSkills', values: ['empty', 'less than 5', 'more than 5'] },
  { label: 'City', value: 'city', values: ['Bucharest', 'Oslo'] },
];

const OPERATOR_OPTIONS = [
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

export default function ConditionsModule({ branches: propBranches, onBranchesChange }: {
  branches?: any[];
  onBranchesChange?: (branches: any[]) => void;
} = {}) {
  const [outerLogic, setOuterLogic] = React.useState<string>('or');
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
  const handleAddBranch = () => {
    const newBranches = [
      ...branches,
      { name: `Branch ${branches.length + 1}`, outerLogic: 'or', groups: [
        { lines: [{ property: '', operator: 'is', value: '' }], groupLogic: 'or' }
      ] }
    ];
    updateBranches(newBranches);
  };
  const getPropertyValues = (property: string) => {
    const prop = PROPERTY_OPTIONS.find(p => p.value === property);
    return prop ? prop.values : [];
  };

  return (
    <div className="space-y-4">
      {branches.map((branch, branchIdx) => (
        <div key={branchIdx}>
          {branches.length > 1 && (
            <div className="flex items-center mb-3 group justify-between">
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[#DDF3F6] text-[#2B6476] inline-block">{branch.name}</span>
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
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {branches.length > 1 && <div className="w-full h-px bg-[#D1D5DC] mb-3"></div>}
          <div className="text-slate-700 font-medium mb-1">If</div>
          {branch.groups.map((group: any, groupIdx: number) => (
            <div key={groupIdx}>
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
              {/* Group logic dropdown inside gray card (for additional lines) */}
              <div className="bg-[#F8F9FB] rounded-xl p-4 mb-4">
                <div className="space-y-3 mb-0">
                  <div>
                    <select
                      className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      value={group.lines[0].property}
                      onChange={e => handlePropertyChange(branchIdx, groupIdx, e.target.value)}
                    >
                      <option value="">Select property</option>
                      {PROPERTY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {group.lines[0].property && (
                    <div className="flex gap-3">
                      <select
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        value={group.lines[0].operator}
                        onChange={e => handleOperatorChange(branchIdx, groupIdx, 0, e.target.value)}
                      >
                        {OPERATOR_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <select
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        value={group.lines[0].value}
                        onChange={e => handleValueChange(branchIdx, groupIdx, 0, e.target.value)}
                      >
                        <option value="">Select value</option>
                        {getPropertyValues(group.lines[0].property || PROPERTY_OPTIONS[0].value).map((val: any) => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
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
                      <select
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        value={line.operator}
                        onChange={e => handleOperatorChange(branchIdx, groupIdx, idx + 1, e.target.value)}
                      >
                        {OPERATOR_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <select
                        className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        value={line.value}
                        onChange={e => handleValueChange(branchIdx, groupIdx, idx + 1, e.target.value)}
                      >
                        <option value="">Select value</option>
                        {getPropertyValues(group.lines[0].property || PROPERTY_OPTIONS[0].value).map((val: any) => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {/* Add Line button: only show if property is selected */}
                {group.lines[0].property && (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:underline"
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
              className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:underline"
              onClick={() => handleAddCondition(branchIdx)}
            >
              <Plus className="w-4 h-4 mr-2 transform rotate-90" /> Add Condition
            </button>
            {branchIdx === branches.length - 1 && (
              <button
                type="button"
                className="inline-flex items-center text-[#2927B2] text-sm font-medium hover:underline"
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
