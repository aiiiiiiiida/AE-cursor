import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Copy, Trash2, Edit, Play, Calendar, Activity, MoreHorizontal, MoreVertical, Globe, Settings, AlertTriangle, X, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Workflow } from '../types';
import ReactDOM from 'react-dom';

export function WorkflowsTable() {
  const { state, createWorkflow, deleteWorkflow } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  const filteredWorkflows = state.workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-xl font-semibold text-[#353B46]">My workflows</h1>
        </div>
        <div className="flex items-center space-x-3">
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

      <div className="bg-white rounded-xl border border-[#D1D5DC] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D1D5DC]">
              <th
  className="text-left py-2 px-6 w-12 bg-[#F8F9FB]"
  style={{ borderTopLeftRadius: '10px' }}
>
                  <input
                    type="checkbox"
                    checked={selectedWorkflows.length === filteredWorkflows.length && filteredWorkflows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Name</th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Status</th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Channel</th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Version</th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Locale</th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Modified</th>
                <th className="text-left py-2 px-6 text-[13px] font-medium text-[#353B46] bg-[#F8F9FB] border-l border-l-[#D1D5DC]">Set Live</th>
                <th className="w-12 bg-[#F8F9FB] border-l border-l-[#D1D5DC]" style={{ borderTopRightRadius: '10px' }}></th>

              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No workflows found</h3>
                    <p className="text-slate-600">Create your first workflow to get started</p>
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <tr 
                    key={workflow.id} 
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openWorkflowBuilder(workflow)}
                  >
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.includes(workflow.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleWorkflowSelection(workflow.id);
                        }}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-sm text-[#464F5E]">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-sm text-slate-500">{workflow.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                        workflow.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : workflow.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.status === 'published' ? 'Live' : workflow.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {workflow.channel === 'Chatbot' ? (
                          <Bot className="w-4 h-4 text-slate-400" />
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
                    <td className="py-4 px-6">
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
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
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
    </div>
  );
}