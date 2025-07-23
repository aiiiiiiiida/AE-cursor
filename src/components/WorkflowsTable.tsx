import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Copy, Trash2, Edit, Play, Calendar, Activity, Network,MoreHorizontal, MoreVertical, Globe, Settings, AlertTriangle, X, Bot, Workflow as WorkflowIcon, FilePenLine, Rows3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Workflow } from '../types';
import ReactDOM from 'react-dom';
import { useMemo } from 'react';

export function WorkflowsTable() {
  const { state, createWorkflow, deleteWorkflow, updateWorkflow, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [workflowDetailsModal, setWorkflowDetailsModal] = useState<{ open: boolean; workflow: Workflow | null }>({ open: false, workflow: null });
  const [detailsForm, setDetailsForm] = useState({
    status: 'draft' as 'draft' | 'published',
    creator: '',
    channel: '',
    version: 1,
    locale: '',
    category: '',
  });
  const CATEGORY_OPTIONS = [
    'High-Volume Hiring',
    'Job Application',
    'Job Search',
    'Onboarding',
    'Employee Experience',
  ];
  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);
  const [categoryInput, setCategoryInput] = useState(detailsForm.category || '');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Compute unique categories and counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    state.workflows.forEach(wf => {
      const cat = wf.category || '';
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [state.workflows]);
  const totalWorkflows = state.workflows.length;
  const categoryTabs = [
    { key: 'all', label: `All workflows`, count: totalWorkflows },
    ...Object.entries(categoryCounts).map(([cat, count]) => ({ key: cat, label: cat, count }))
  ];

  const filteredWorkflows = state.workflows.filter(workflow => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      workflow.name.toLowerCase().includes(term) ||
      (workflow.description?.toLowerCase().includes(term) ?? false) ||
      (workflow.channel?.toLowerCase().includes(term) ?? false) ||
      (workflow.status?.toLowerCase().includes(term) ?? false) ||
      (workflow.locale?.toLowerCase().includes(term) ?? false) ||
      (workflow.creator?.toLowerCase().includes(term) ?? false)
    );
    const matchesCategory = selectedCategory === 'all' || (workflow.category || '') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateWorkflow = async () => {
    try {
      setIsCreating(true);
      const newWorkflow = {
        name: 'New Workflow',
        description: '',
        nodes: [],
        connections: [],
        status: 'draft' as const
      };
      
      const createdWorkflow = await createWorkflow(newWorkflow);
      
      // Navigate to the newly created workflow
      if (createdWorkflow) {
        navigate(`/workflow/${createdWorkflow.id}`);
      }
    } catch (error) {
      console.error('Failed to create workflow:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (workflowToDelete) {
      await deleteWorkflow(workflowToDelete.id);
      setWorkflowToDelete(null);
    }
  };

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    await createWorkflow({
      name: `${workflow.name} (Copy)`,
      description: workflow.description,
      nodes: workflow.nodes,
      connections: workflow.connections,
      status: 'draft'
    });
    setOpenMenuId(null);
  };

  const openWorkflowBuilder = (workflow: Workflow) => {
    navigate(`/workflow/${workflow.id}`);
  };

  const openActivityConfigurator = () => {
    navigate('/activities');
  };

  const toggleWorkflowSelection = (workflowId: string) => {
    setSelectedWorkflows(prev => 
      prev.includes(workflowId) 
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWorkflows.length === filteredWorkflows.length) {
      setSelectedWorkflows([]);
    } else {
      setSelectedWorkflows(filteredWorkflows.map(w => w.id));
    }
  };

  // When opening modal, sync form state
  const openWorkflowDetailsModal = (workflow: Workflow) => {
    setDetailsForm({
      status: workflow.status || 'draft',
      creator: workflow.creator || '',
      channel: workflow.channel || '',
      version: workflow.version || 1,
      locale: workflow.locale || '',
      category: workflow.category || '',
    });
    setCategoryInput(workflow.category || '');
    setShowCategoryDropdown(false); // Close dropdown when opening modal
    setWorkflowDetailsModal({ open: true, workflow });
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-[#353B46]">Workflows</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative mr-0">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-[#8C95A8]  text-slate-700 placeholder-slate-500 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4D3EE0] w-48"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          </div>
          <button
            onClick={openActivityConfigurator}
            className="flex items-center text-sm space-x-2  font-medium pl-3 pr-4 py-2 rounded-xl border border-[#8C95A8] text-[#2927B2] hover:bg-slate-200 transition-colors"
            title="Activities"
          >
            <Settings className="w-4 h-4" />
            <span>Activities</span>
          </button>
          <button
            onClick={handleCreateWorkflow}
            disabled={isCreating}
            className="bg-[#4D3EE0] text-white text-sm pl-3 pr-4 py-2 rounded-xl font-medium hover:bg-[#2927B2] transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add the category tabs above the table: */}
      {/* Replace the full-width flex container for the tabs with a left-aligned, inline-flex container that hugs the tabs: */}
      <div>
      <div className="flex gap-2 p-4 border-t border-l border-r  border-[#D1D5DC] rounded-t-lg w-full">
  {categoryTabs.map((tab) => {
    const isSelected = selectedCategory === tab.key;
    return (
      <button
        key={tab.key}
        onClick={() => setSelectedCategory(tab.key)}
        className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] border text-sm font-normal transition 
          ${isSelected 
            ? 'bg-[#EAE8FB] text-[#353B46] border-transparent  font-[500]' 
            : 'bg-white text-[#637085] border-[#D1D5DC] hover:bg-[#F8F9FB]'
          }
        `}
      >
        <span>{tab.label}</span>
        <span
    className={`
      ${isSelected ? 'bg-white text-[#353B46]' : 'bg-[#F1F3F7] text-[#637085]'}
      text-xs font-medium px-2 py-0.5 rounded-[6px]
    `}
  >
    {tab.count}
  </span>
      </button>
    );
  })}
</div>

        <div className="bg-white rounded-xl border border-[#D1D5DC] shadow-sm rounded-t-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D1D5DC]">
                {/* <th
  className="text-left py-2 px-6 w-12 bg-[#F8F9FB]"
  style={{ borderTopLeftRadius: '10px' }}
>
                    <input
                      type="checkbox"
                      checked={selectedWorkflows.length === filteredWorkflows.length && filteredWorkflows.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300"
                    />
                  </th> */}
                  <th className="text-left py-2 px-5 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] ">Name</th>
                  <th className="text-left py-2 px-5 text-[13px] font-medium text-[#353B46] border-l border-l-[#D1D5DC] bg-[#F8F9FB] ">Category</th>
                  <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Status</th>
                  <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Channel</th>
                  <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Version</th>
                  <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Locale</th>
                  <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Modified</th>
                  <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Created</th>
                  <th className="w-8 bg-[#F8F9FB] border-l border-l-[#D1D5DC]" style={{ borderTopRightRadius: '10px' }}></th>

                </tr>
              </thead>
              <tbody>
                {filteredWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <WorkflowIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-md font-medium text-slate-700 mb-2">No workflows found</h3>
                     
                    </td>
                  </tr>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <tr 
                      key={workflow.id} 
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => openWorkflowBuilder(workflow)}
                    >
                      {/* <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedWorkflows.includes(workflow.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleWorkflowSelection(workflow.id);
                          }}
                          className="rounded border-slate-300"
                        />
                      </td> */}
                      {/* Name */}
                      <td className="py-4 px-5">
                        <div>
                          <div className="font-medium text-sm text-[#464F5E]">{workflow.name}</div>
                          {workflow.description && (
                            <div className="text-sm text-slate-500">{workflow.description}</div>
                          )}
                        </div>
                      </td>
                      {/* Category */}
                      <td className="py-4 px-5">
                        <span className="text-sm text-slate-600">{workflow.category ? workflow.category : '-'}</span>
                      </td>
                      <td className="py-4 px-6">
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
      workflow.status === 'published'
        ? 'bg-[#D8F4F2] text-[#3C6D68]'
        : 'bg-gray-100 text-gray-800'
    }`}
  >
    {workflow.status === 'published'
      ? 'Live'
      : workflow.status === 'draft'
      ? 'Draft'
      : workflow.status}
  </span>
</td>

                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {workflow.channel === 'Chatbot' ? (
                            <Bot className="w-4 h-4 text-slate-400" />
                          ) : workflow.channel === 'Multichannel' ? (
                            <Rows3 className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Globe className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-sm text-slate-600">{workflow.channel}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-600">{workflow.version}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-600">{workflow.locale}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm text-slate-900">{workflow.updatedAt.toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500">by {workflow.creator}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-sm text-slate-900">{workflow.createdAt.toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500">by {workflow.creator}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === workflow.id ? null : workflow.id);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openMenuId === workflow.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWorkflowBuilder(workflow);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                              >
                                <Network className="w-4 h-4" />
                                <span>Edit workflow</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWorkflowDetailsModal(workflow);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                              >
                                <FilePenLine className="w-4 h-4" />
                                <span>Edit details</span>
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateWorkflow(workflow);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Duplicate</span>
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWorkflowToDelete(workflow);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {workflowToDelete &&
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
            onClick={() => setWorkflowToDelete(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-0 flex flex-col"
              style={{ minWidth: 380 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <h2 className="text-lg font-semibold text-[#3A3F4B]">Delete workflow</h2>
                <button
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full focus:outline-none"
                  onClick={() => setWorkflowToDelete(null)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Divider */}
              <div className="border-t border-slate-200 w-full" />
              {/* Description */}
              <div className="px-6 py-8 text-[#3A3F4B] text-md font-normal">
                Are you sure you want to delete this workflow? The action can not be reverted.
              </div>
              {/* Divider */}
              <div className="border-t border-slate-200 w-full" />
              {/* Buttons */}
              <div className="flex justify-end space-x-4 px-6 py-4">
                <button
                  className="h-10 px-4 rounded-xl border border-[#8C95A8] text-[#2927B2] text-sm font-medium bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4D3EE0]"
                  style={{ fontSize: 14 }}
                  onClick={() => setWorkflowToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="h-10 px-4 rounded-xl bg-[#C40F24] text-white text-sm font-medium hover:bg-[#B71C1C] focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  style={{ fontSize: 14 }}
                  onClick={handleDeleteWorkflow}
                >
                  Delete workflow
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
      {workflowDetailsModal.open && workflowDetailsModal.workflow && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" onClick={() => setWorkflowDetailsModal({ open: false, workflow: null })}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-0 flex flex-col"
            style={{ minWidth: 380 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-[#3A3F4B]">Workflow details</h2>
              <button
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full focus:outline-none"
                onClick={() => setWorkflowDetailsModal({ open: false, workflow: null })}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Divider */}
            <div className="border-t border-slate-200 w-full" />
            {/* Form */}
            <form
              className="px-6 py-6 flex flex-col gap-4"
              onSubmit={async e => {
                e.preventDefault();
                const updatedWorkflow = {
                  ...workflowDetailsModal.workflow!,
                  status: detailsForm.status,
                  creator: detailsForm.creator,
                  channel: detailsForm.channel,
                  version: Number(detailsForm.version),
                  locale: detailsForm.locale,
                  category: categoryInput, // always use the input value, even if empty
                };
                dispatch({ type: 'UPDATE_WORKFLOW', payload: updatedWorkflow });
                await updateWorkflow(updatedWorkflow);
                setWorkflowDetailsModal({ open: false, workflow: null });
              }}
            >
              {/* Row 1: Status + Channel */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <div className="relative w-full">
                    <select
                      className="w-full appearance-none px-3 pr-10 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={detailsForm.status}
                      onChange={e => setDetailsForm(f => ({ ...f, status: e.target.value as 'draft' | 'published' }))}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg
                        className="w-4 h-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Channel</label>
                  <div className="relative w-full">
                    <select
                      className="w-full appearance-none px-3 pr-10 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={detailsForm.channel}
                      onChange={e => setDetailsForm(f => ({ ...f, channel: e.target.value }))}
                    >
                      <option value="">Select channel</option>
                      <option value="Web">Web</option>
                      <option value="Chatbot">Chatbot</option>
                      <option value="Multichannel">Multichannel</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg
                        className="w-4 h-4 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Row 2: Version + Locale */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
                  <input
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="number"
                    min={1}
                    value={detailsForm.version}
                    onChange={e => setDetailsForm(f => ({ ...f, version: Number(e.target.value) || 1 }))}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Locale</label>
                  <input
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="text"
                    value={detailsForm.locale}
                    onChange={e => setDetailsForm(f => ({ ...f, locale: e.target.value }))}
                  />
                </div>
              </div>
              {/* Row 3: Creator and Category */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Creator</label>
                  <input
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="text"
                    value={detailsForm.creator}
                    onChange={e => setDetailsForm(f => ({ ...f, creator: e.target.value }))}
                  />
                </div>
                <div className="w-1/2 relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    type="text"
                    placeholder="Type or select category"
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
                    autoComplete="off"
                  />
                  {showCategoryDropdown && (
                    <div className="absolute z-10 bg-white border border-slate-200 rounded-lg shadow w-full mt-1 max-h-40 overflow-y-auto">
                      {(() => {
                        const lowerInput = categoryInput.trim().toLowerCase();
                        const uniqueCategories = Array.from(new Set([...categoryOptions, detailsForm.category].filter(Boolean)));
                        const filtered = uniqueCategories.filter(cat => cat.toLowerCase().includes(lowerInput));
                        const hasExactMatch = uniqueCategories.some(cat => cat.toLowerCase() === lowerInput);
                        const dropdownItems: React.ReactNode[] = [];
                        if (categoryInput && !hasExactMatch) {
                          dropdownItems.push(
                            <button
                              key="add-new"
                              type="button"
                              className="w-full text-left px-3 py-1 hover:bg-[#F4F6FA] text-sm font-medium text-[#2927B2] border-b border-slate-100"
                              onMouseDown={() => {
                                setCategoryInput(categoryInput);
                                setDetailsForm(f => ({ ...f, category: categoryInput }));
                                setCategoryOptions(prev => [...prev, categoryInput]);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              {`+ Add "${categoryInput}"`}
                            </button>
                          );
                        }
                        dropdownItems.push(
                          ...filtered.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              className={`w-full text-left px-3 py-1 hover:bg-slate-100 text-sm ${cat === categoryInput ? 'bg-[#F4F6FA] font-medium' : ''}`}
                              onMouseDown={() => {
                                setCategoryInput(cat);
                                setDetailsForm(f => ({ ...f, category: cat }));
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
              </div>
              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-[#8C95A8] text-[#2927B2] text-sm font-medium bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4D3EE0]"
                  style={{ fontSize: 14 }}
                  onClick={() => setWorkflowDetailsModal({ open: false, workflow: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-[#4D3EE0] text-white text-sm font-medium hover:bg-[#2927B2] focus:outline-none focus:ring-2 focus:ring-[#4D3EE0]"
                  style={{ fontSize: 14 }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}