import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Copy, Trash2, Edit, Play, Calendar, Activity, MoreHorizontal, Globe, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Workflow } from '../types';

export function WorkflowsTable() {
  const { state, createWorkflow, deleteWorkflow } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleDeleteWorkflow = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow(id);
    }
    setOpenMenuId(null);
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

  // Dummy data generators
  const getRandomChannel = () => {
    const channels = ['Web', 'Mobile', 'API', 'Email'];
    return channels[Math.floor(Math.random() * channels.length)];
  };

  const getRandomVersion = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const getRandomLocale = () => {
    const locales = ['en_US', 'en_GB', 'fr_FR', 'de_DE', 'es_ES'];
    return locales[Math.floor(Math.random() * locales.length)];
  };

  const getRandomCreator = () => {
    const creators = ['Hannah Belle', 'Matthew Stone', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson'];
    return creators[Math.floor(Math.random() * creators.length)];
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
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Configure Activity Templates"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleCreateWorkflow}
            disabled={isCreating}
            className="bg-[#4D3EE0] text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-[#2927B2] transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-6 w-12">
                  <input
                    type="checkbox"
                    checked={selectedWorkflows.length === filteredWorkflows.length && filteredWorkflows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Name</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Channel</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Version</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Locale</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Modified</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-slate-600">Set Live</th>
                <th className="w-12"></th>
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
                        <div className="font-medium text-slate-900">{workflow.name}</div>
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
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">{getRandomChannel()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">{getRandomVersion()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">{getRandomLocale()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm text-slate-900">{workflow.updatedAt.toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">by {getRandomCreator()}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-sm text-slate-900">{workflow.createdAt.toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">by {getRandomCreator()}</div>
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
                          <MoreHorizontal className="w-4 h-4" />
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
                                handleDeleteWorkflow(workflow.id);
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

      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
}