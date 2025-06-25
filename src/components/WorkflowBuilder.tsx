import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Save, Eye, Settings, Trash2, Search, X, Edit2, Check, ZoomIn, ZoomOut, Maximize2, Minus, Scan, Mail, Globe, Database, FileText, Calendar, Users, Zap, Clock, CheckCircle, AlertCircle, Split, Image, Bot, Hourglass, User, MessageCircle, Tag, ListChecks, Video, ExternalLink, GitBranch } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkflowNode, ActivityTemplate, UIElement, ConditionalFollowUp } from '../types';
import { DynamicForm } from './DynamicForm';

const AVAILABLE_ICONS = [
  { name: 'Mail', component: Mail },
  { name: 'Globe', component: Globe },
  { name: 'Database', component: Database },
  { name: 'FileText', component: FileText },
  { name: 'Calendar', component: Calendar },
  { name: 'Users', component: Users },
  { name: 'Zap', component: Zap },
  { name: 'Clock', component: Clock },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'AlertCircle', component: AlertCircle },
    { name: 'Image', component: Image },
   { name: 'Split', component: Split },
  { name: 'Hourglass', component: Hourglass },
  { name: 'Search', component: Search },
  { name: 'User', component: User },
  { name: 'Message', component: MessageCircle },
 
  { name: 'Tag', component: Tag },
  { name: 'Checklist', component: ListChecks },
  { name: 'Video', component: Video },
  { name: 'ExternalLink', component: ExternalLink },
  { name: 'Robot', component: Bot}
];

const ICON_COLORS = [
  { name: 'Purple', value: 'purple', bg: '#EAE8FB', iconColor: '#4D3EE0' },
  { name: 'Orange', value: 'orange', bg: '#FBEDD5', iconColor: '#DA5C30' },
  { name: 'Teal', value: 'teal', bg: '#D8F4F2', iconColor: '#3C6D68' }
];

export function WorkflowBuilder() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, updateWorkflow } = useApp();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [insertBranch, setInsertBranch] = useState<string>('main');
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingElements, setIsEditingElements] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  // Add a ref for the scrollable content
  const contentRef = useRef<HTMLDivElement>(null);

  const workflow = state.workflows.find(w => w.id === workflowId);
  const selectedNode = state.selectedNode;

  // Find the trigger template
  const triggerTemplate = state.activityTemplates.find(template => 
    template.name.toLowerCase().includes('trigger') || template.icon === 'Zap'
  );

  // Memoize centerCanvas function to prevent initialization issues
  const centerCanvas = useCallback(() => {
    if (!canvasRef.current || !contentRef.current) return;
    // Use setTimeout to ensure DOM is updated before measuring
    setTimeout(() => {
      if (!canvasRef.current || !contentRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const canvasWidth = canvasRect.width;
      const canvasHeight = canvasRect.height;
      const contentWidth = contentRect.width;
      const contentHeight = contentRect.height;
      const centerX = (canvasWidth - contentWidth * zoom) / 2;
      const centerY = (canvasHeight - contentHeight * zoom) / 2;
      setPan({ x: centerX, y: centerY });
      setZoom(1);
    }, 0);
  }, [zoom]);

  // Center canvas when workflow loads or side panel opens/closes
  useEffect(() => {
    centerCanvas();
  }, [workflow?.id, selectedNode, centerCanvas]); // Re-center when workflow changes or side panel opens/closes

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Workflow not found</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Return to workflows
        </button>
      </div>
    );
  }

  const handleSaveWorkflow = async () => {
    try {
      setIsSaving(true);
      await updateWorkflow(workflow);
      // Show success feedback briefly
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setIsSaving(false);
    }
  };

  const handleTitleEdit = () => {
    setEditedTitle(workflow.name);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (editedTitle.trim()) {
      const updatedWorkflow = {
        ...workflow,
        name: editedTitle.trim()
      };
      
      dispatch({
        type: 'UPDATE_WORKFLOW',
        payload: updatedWorkflow
      });
      
      // Auto-save the workflow
      try {
        await updateWorkflow(updatedWorkflow);
      } catch (error) {
        console.error('Failed to save workflow title:', error);
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle('');
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleAddActivity = (position: number, branch: string = 'main') => {
    setInsertPosition(position);
    setInsertBranch(branch);
    setShowActivityModal(true);
  };

  const handleSelectActivity = async (activity: ActivityTemplate) => {
    if (insertPosition === null) return;

    const newNode: Omit<WorkflowNode, 'id'> = {
      activityTemplateId: activity.id,
      position: { x: 0, y: 0 }, // Position will be calculated based on order
      userAssignedName: activity.name,
      // Initialize with a copy of the template's elements for this specific node
      localSidePanelElements: [...activity.sidePanelElements],
      metadata: { branch: insertBranch }
    };

    // Get nodes for the specific branch
    const branchNodes = workflow.nodes.filter(node => 
      (node.metadata?.branch || 'main') === insertBranch
    );
    
    // Insert the node at the specified position within the branch
    const updatedBranchNodes = [...branchNodes];
    const newNodeWithId = {
      ...newNode,
      id: Date.now().toString()
    };
    updatedBranchNodes.splice(insertPosition, 0, newNodeWithId);

    // Get nodes from other branches
    const otherBranchNodes = workflow.nodes.filter(node => 
      (node.metadata?.branch || 'main') !== insertBranch
    );

    // Combine all nodes
    const updatedNodes = [...otherBranchNodes, ...updatedBranchNodes];

    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes
    };

    dispatch({
      type: 'UPDATE_WORKFLOW',
      payload: updatedWorkflow
    });

    // Auto-save the workflow
    try {
      await updateWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Failed to save workflow after adding activity:', error);
    }

    setShowActivityModal(false);
    setInsertPosition(null);
  };

  const handleNodeClick = (node: WorkflowNode) => {
    dispatch({ type: 'SELECT_NODE', payload: node });
  };

  const handleTriggerClick = () => {
    if (triggerTemplate) {
      // Create a virtual trigger node for configuration
      const triggerNode: WorkflowNode = {
        id: 'trigger',
        activityTemplateId: triggerTemplate.id,
        position: { x: 0, y: 0 },
        userAssignedName: 'Trigger',
        localSidePanelElements: [...triggerTemplate.sidePanelElements],
        metadata: workflow.triggerMetadata || {}
      };
      dispatch({ type: 'SELECT_NODE', payload: triggerNode });
    }
  };

  const handleNodeDelete = async (nodeId: string) => {
    const updatedNodes = workflow.nodes.filter(n => n.id !== nodeId);
    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes
    };

    dispatch({
      type: 'UPDATE_WORKFLOW',
      payload: updatedWorkflow
    });

    // Auto-save the workflow
    try {
      await updateWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Failed to save workflow after deleting node:', error);
    }

    if (selectedNode?.id === nodeId) {
      dispatch({ type: 'SELECT_NODE', payload: null as any });
    }
  };

  const handleNodeUpdate = async (nodeId: string, updates: Partial<WorkflowNode>) => {
    // Handle trigger updates separately
    if (nodeId === 'trigger') {
      const updatedWorkflow = {
        ...workflow,
        triggerMetadata: updates.metadata || {}
      };

      dispatch({
        type: 'UPDATE_WORKFLOW',
        payload: updatedWorkflow
      });

      // Update the selected trigger node
      if (selectedNode?.id === 'trigger' && triggerTemplate) {
        const updatedTriggerNode: WorkflowNode = {
          ...selectedNode,
          ...updates,
          metadata: updates.metadata || {}
        };
        dispatch({ type: 'SELECT_NODE', payload: updatedTriggerNode });
      }

      // Auto-save the workflow
      try {
        await updateWorkflow(updatedWorkflow);
      } catch (error) {
        console.error('Failed to save workflow after updating trigger:', error);
      }
      return;
    }

    const updatedWorkflow = {
      ...workflow,
      nodes: workflow.nodes.map(n => 
        n.id === nodeId ? { ...n, ...updates } : n
      )
    };

    dispatch({
      type: 'UPDATE_WORKFLOW',
      payload: updatedWorkflow
    });

    // Update the selected node if it's the one being updated
    if (selectedNode?.id === nodeId) {
      const updatedNode = updatedWorkflow.nodes.find(n => n.id === nodeId);
      if (updatedNode) {
        dispatch({ type: 'SELECT_NODE', payload: updatedNode });
      }
    }

    // Auto-save the workflow
    try {
      await updateWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Failed to save workflow after updating node:', error);
    }
  };

  // Canvas controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleCenterCanvas = () => {
    centerCanvas();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getActivityTemplate = (templateId: string) => {
    return state.activityTemplates.find(t => t.id === templateId);
  };

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    return icon ? icon.component : Settings;
  };

  const getIconColor = (color: string) => {
    const colorConfig = ICON_COLORS.find(c => c.value === color);
    return colorConfig || ICON_COLORS[0];
  };

  // Helper function to get all UI elements including nested ones
  const getAllUIElements = (elements: UIElement[]): UIElement[] => {
    const allElements: UIElement[] = [];
    
    const traverse = (els: UIElement[]) => {
      els.forEach(el => {
        allElements.push(el);
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

  // Function to check if all referenced UI elements have values
  const hasAllReferencedValues = (description: string, node: WorkflowNode): boolean => {
    if (!description) return false;

    // Find all #{ElementLabel} references in the description
    const references = description.match(/#{([^}]+)}/g);
    if (!references || references.length === 0) return true; // No references, so description can be shown

    // Check if all referenced elements have values
    const allElements = getAllUIElements(node.localSidePanelElements || []);
    
    return references.every(ref => {
      const elementLabel = ref.slice(2, -1); // Remove #{ and }
      const element = allElements.find(el => el.label === elementLabel);
      
      if (!element) return false; // Element not found
      
      const value = node.metadata?.[element.id];
      
      // Check if the value exists and is not empty
      if (value === undefined || value === null || value === '') return false;
      
      // For boolean values (toggle, checkbox), they should be explicitly set
      if (typeof value === 'boolean') return true;
      
      return true;
    });
  };

  // Function to process map description and replace UI element references
  const processMapDescription = (description: string, node: WorkflowNode): string => {
    if (!description) return '';

    // Check if all referenced values are available
    if (!hasAllReferencedValues(description, node)) {
      return ''; // Return empty string to hide description
    }

    // Replace #{ElementLabel} with actual values
    return description.replace(/#{([^}]+)}/g, (match, elementLabel) => {
      // Find the element by label in the node's local elements
      const allElements = getAllUIElements(node.localSidePanelElements || []);
      const element = allElements.find(el => el.label === elementLabel);
      
      if (element && node.metadata && node.metadata[element.id] !== undefined) {
        const value = node.metadata[element.id];
        
        // Format the value based on element type
        if (element.type === 'toggle') {
          return value ? 'ON' : 'OFF';
        } else if (element.type === 'checkbox') {
          return value ? 'checked' : 'unchecked';
        } else if (element.type === 'file-upload') {
          return value || 'No file selected';
        } else {
          return String(value || '');
        }
      }
      
      // If no value found, return the placeholder (this shouldn't happen due to hasAllReferencedValues check)
      return `[${elementLabel}]`;
    });
  };

  const filteredActivities = state.activityTemplates.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    // Simple categorization based on activity type
    let category = 'WORKFLOW';
    if (activity.name.toLowerCase().includes('message') || activity.name.toLowerCase().includes('email')) {
      category = 'COMMUNICATION';
    } else if (activity.name.toLowerCase().includes('job') || activity.name.toLowerCase().includes('search')) {
      category = 'JOB SEARCH';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(activity);
    return groups;
  }, {} as Record<string, ActivityTemplate[]>);

  // Get the selected node's template for the side panel title
  const selectedTemplate = selectedNode ? getActivityTemplate(selectedNode.activityTemplateId) : null;

  // Get all unique branches from workflow nodes
  const getAllBranches = () => {
    const branches = new Set<string>();
    workflow.nodes.forEach(node => {
      const branch = node.metadata?.branch || 'main';
      branches.add(branch);
    });
    return Array.from(branches).sort();
  };

  // Get nodes for a specific branch
  const getNodesForBranch = (branch: string) => {
    return workflow.nodes.filter(node => 
      (node.metadata?.branch || 'main') === branch
    );
  };

  // Check if a node is a condition node
  const isConditionNode = (node: WorkflowNode) => {
    const template = getActivityTemplate(node.activityTemplateId);
    return template?.name.toLowerCase().includes('condition') || 
           template?.description.toLowerCase().includes('condition');
  };

  // Find condition nodes that should have branches
  const getConditionNodes = () => {
    return workflow.nodes.filter(node => isConditionNode(node));
  };

  // Render a single branch
  const renderBranch = (branch: string, branchIndex: number, parentConditionId?: string) => {
    // Prevent duplicate rendering: if this branch is being rendered as a child of a Condition node, do not render it again at the top level
    if (parentConditionId && branchIndex === 0) return null;
    const branchNodes = getNodesForBranch(branch);
    const isMainBranch = branch === 'main';
    
    // Determine if this is the first node after a Condition node in this branch
    let isFirstNodeAfterCondition = false;
    if (branchIndex === 0) {
      // Find the node in workflow.nodes that is a Condition and is the immediate parent for this branch
      const parentConditionNode = workflow.nodes.find(n => {
        const t = getActivityTemplate(n.activityTemplateId);
        return t && t.name === 'Condition' && n.metadata?.branches && n.metadata.branches.includes(branch);
      });
      if (parentConditionNode) {
        isFirstNodeAfterCondition = true;
      }
    }

    return (
      <div key={branch} className={`flex flex-col items-center space-y-0 ${!isMainBranch ? 'ml-8' : ''}`}>
        {/* Branch label for non-main branches */}
        {!isMainBranch && (
          <div className="mb-4">
           
          </div>
        )}

        {/* Branch Nodes */}
        {branchNodes.map((node, index) => {
          const template = getActivityTemplate(node.activityTemplateId);
          if (!template) return null;
          const isCondition = template.name === 'Condition';

          const IconComponent = getIconComponent(template.icon);
          const iconColor = getIconColor(template.iconColor || 'purple');
          const displayDescription = processMapDescription(
            node.mapDescription || template.description, 
            node
          );

          return (
            <React.Fragment key={node.id}>
              {/* Plus button above (except first node, and not for first node after a Condition node) */}
              {index === 0 && branchNodes.length > 0 && !isFirstNodeAfterCondition && (
                <div className="flex justify-center mb-0">
                  <button
                    onClick={() => handleAddActivity(index, branch)}
                    className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center hover:bg-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* Always render separator line after plus button, before node card */}
              <div className="flex justify-center mb-0">
                <div className="w-0.5 h-6 bg-slate-300"></div>
              </div>
              {/* Node rendering (Condition or not) */}
              {isCondition ? (
                (() => {
                  const branches = node.metadata?.branches || ['Branch 1', 'Branch 2'];
                  const branchCount = branches.length;
                  const columnWidth = 264; // width of activity card
                  const gap = 40;
                  const svgHeight = 32;
                  const svgWidth = branchCount > 1 ? (branchCount - 1) * (columnWidth + gap) : 0;
                  const startX = svgWidth / 2;
                  const branchXs = branches.map((_, idx) => idx * (columnWidth + gap));
                  return (
                    <div className="flex flex-col items-center w-full">
                      {/* Condition Node Card */}
                      <div
                        className={`w-[264px] bg-white rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 relative group
                          ${selectedNode?.id === node.id 
                            ? 'border-2 border-[#4D3EE0] shadow-sm' 
                            : 'border border-slate-200'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeClick(node);
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNodeDelete(node.id);
                          }}
                          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: iconColor.bg }}
                          >
                            <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[#353B46] text-sm mb-0">
                              {node.userAssignedName || template.name}
                            </h3>
                            {displayDescription && (
                              <p className="text-xs text-[#637085] leading-relaxed">
                                {displayDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-0.5 h-4 bg-slate-300" />
                      {/* SVG for horizontal + rounded lines */}
                      {branchCount > 1 && (
                        <svg width={svgWidth} height={svgHeight} className="block" style={{ marginTop: -1 }}>
                          {/* Horizontal line */}
                          <line x1={branchXs[0]} y1={svgHeight/2} x2={branchXs[branchCount-1]} y2={svgHeight/2} stroke="#CBD5E1" strokeWidth="2" />
                          {/* Rounded corners and verticals */}
                          {branchXs.map((x: number, idx: number) => (
                            <React.Fragment key={idx}>
                              {/* Rounded corner */}
                              <path
                                d={`M${x},${svgHeight/2} Q${x},${svgHeight/2+8} ${x},${svgHeight}`}
                                stroke="#CBD5E1"
                                strokeWidth="2"
                                fill="none"
                              />
                            </React.Fragment>
                          ))}
                        </svg>
                      )}
                      {/* Branch columns */}
                      <div className="flex flex-row justify-between w-full" style={{ gap: `${gap}px`, marginTop: branchCount > 1 ? -8 : 0 }}>
                        {branches.map((branchName: string, branchIdx: number) => (
                          <div key={branchName} className="flex flex-col items-center w-[264px]">
                            {/* Vertical line from horizontal SVG to tag */}
                            <div className="w-0.5 h-4 bg-slate-300" />
                            {/* Green branch tag */}
                            <div className="bg-[#C6F2F2] text-[#2B4C4C] px-2 py-1 rounded-lg mb-0 text-xs font-normal">{branchName}</div>
                            {/* Vertical line, plus, vertical line, then activities */}
                            <div className="w-0.5 h-4 bg-slate-300" />
                            {/* Only show plus button if branch is empty */}
                            {getNodesForBranch(branchName).length === 0 && (
                              <button
                                onClick={() => handleAddActivity(0, branchName)}
                                className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center mt-0 hover:bg-gray-500 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                            <div className="w-0.5 h-4 bg-slate-300" />
                            {/* Render activities for this branch directly under the tag and plus button */}
                            {renderBranch(branchName, branchIdx + 1, node.id)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mb-0 flex justify-center">
                  <div
                    className={`w-[264px] bg-white rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 relative group
                      ${selectedNode?.id === node.id 
                        ? 'border-2 border-[#4D3EE0] shadow-sm' 
                        : 'border border-slate-200'
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(node);
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeDelete(node.id);
                      }}
                      className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: iconColor.bg }}
                      >
                        <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#353B46] text-sm mb-0">
                          {node.userAssignedName || template.name}
                        </h3>
                        {displayDescription && (
                          <p className="text-xs text-[#637085] leading-relaxed">
                            {displayDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Connection Line */}
              {(!isCondition) && (
                <div className="flex justify-center mb-0">
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                </div>
              )}
              {/* Plus button after (except for Condition node) */}
              {!isCondition && (
                <div className="flex justify-center mb-0">
                  <button
                    onClick={() => handleAddActivity(index + 1, branch)}
                    className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center hover:bg-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Find the main branch nodes before rendering the plus button after the Trigger node
  const mainBranchNodes = getNodesForBranch('main');

  // At the top of WorkflowBuilder, before the return statement:
  const branchesRenderedAsChildren = new Set<string>();
  state.workflows.forEach(wf => {
    wf.nodes.forEach(node => {
      const template = getActivityTemplate(node.activityTemplateId);
      if (template && template.name === 'Condition' && node.metadata?.branches) {
        node.metadata.branches.forEach((b: string) => branchesRenderedAsChildren.add(b));
      }
    });
  });

  return (
    <div className="flex h-screen bg-white">
      {/* Header - Fixed at top, full width */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyPress}
                    onBlur={handleTitleSave}
                    className="text-lg font-semibold text-[#353B46] bg-transparent focus:outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2 group">
                  <h2 className="text-lg font-semibold text-[#353B46]">{workflow.name}</h2>
                  <button
                    onClick={handleTitleEdit}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                previewMode
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Simulate</span>
            </button>
            <button 
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-[#4D3EE0] text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Adjusted for header and side panel */}
      <div className={`flex-1 pt-[73px] ${selectedNode ? 'pr-80' : ''} transition-all duration-300`}>
        {/* Workflow Canvas */}
        <div 
          ref={canvasRef}
          className="h-full overflow-hidden relative cursor-grab active:cursor-grabbing bg-[#F8F9FB]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Static Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #D1D5DC 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0'
            }}
          />
          
          {/* Scrollable Content */}
          <div 
            ref={contentRef}
            className="absolute"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <div className="flex flex-col items-center space-y-0">
              {/* Start Trigger */}
              <div className="mb-0 flex justify-center">
                <div 
                  className={`w-[264px] bg-white rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${
                    selectedNode?.id === 'trigger' 
                      ? 'border-2 border-[#4D3EE0] shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerClick();
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#D8F4F2] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-[#3C6D68]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 text-sm mb-1">Trigger</h3>
                      <p className="text-xs text-slate-600">Workflow starts here</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mb-0">
                <div className="w-0.5 h-6 bg-slate-300"></div>
              </div>
              {/* Add Activity Button after Trigger */}
              {mainBranchNodes.length === 0 && (
                <div className="flex justify-center mb-0">
                  <button
                    onClick={() => handleAddActivity(0, 'main')}
                    className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center hover:bg-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Main Branch */}
              {renderBranch('main', 0)}

              {/* Other Branches */}
              <div className="flex space-x-8 mt-8">
                {getAllBranches()
                  .filter(branch => branch !== 'main' && !branchesRenderedAsChildren.has(branch))
                  .map((branch, index) => renderBranch(branch, index + 1))}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbox */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            className="pb-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="pb-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterCanvas}
            className="p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Center Canvas"
          >
            <Scan className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Configuration Panel - Fixed Position under header */}
      {selectedNode && (
        <div className="fixed top-[73px] right-0 w-[420px] h-[calc(100vh-73px)] bg-white border-l border-slate-200 flex flex-col z-10 transition-transform duration-300">
          {/* Side Panel Header */}
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {selectedNode.id === 'trigger' ? 'Trigger' : (selectedNode.userAssignedName || selectedTemplate?.name || 'Configuration')}
              </h3>
              {(selectedNode.sidePanelDescription || selectedTemplate?.sidePanelDescription) && (
                <p className="text-xs text-slate-600 mt-1">
                  {selectedNode.sidePanelDescription || selectedTemplate?.sidePanelDescription}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {selectedNode.id !== 'trigger' && (
                <button
                  onClick={() => setIsEditingElements(!isEditingElements)}
                  className={`p-2 rounded-lg transition-colors ${
                    isEditingElements
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Edit side panel elements"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => dispatch({ type: 'SELECT_NODE', payload: null as any })}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ActivityNodeConfiguration
              node={selectedNode}
              onUpdate={(updates) => handleNodeUpdate(selectedNode.id, updates)}
              previewMode={previewMode}
              isEditingElements={isEditingElements}
              workflow={workflow}
            />
          </div>
        </div>
      )}

      {/* Activity Selection Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Add Activity</h2>
                  {insertBranch !== 'main' && (
                    <p className="text-sm text-slate-600">Adding to {insertBranch} branch</p>
                  )}
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedActivities).map(([category, activities]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {activities.map((activity) => {
                      const IconComponent = getIconComponent(activity.icon);
                      const iconColor = getIconColor(activity.iconColor || 'purple');
                      
                      return (
                        <button
                          key={activity.id}
                          onClick={() => handleSelectActivity(activity)}
                          className="w-full p-4 text-left border border-slate-200 rounded-xl hover:border-[#4D3EE0] hover:bg-blue-50 transition-all duration-200 group"
                        >
                          <div className="flex flex-col items-start space-y-2">
                            {/* Row: Icon + Title */}
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:${iconColor.hover} transition-all"
                                style={{ backgroundColor: iconColor.bg }}
                              >
                                <IconComponent className="w-5 h-5" style={{ color: iconColor.iconColor }} />
                              </div>
                              <h4 className="font-semibold text-base text-slate-900">
                                {activity.name}
                              </h4>
                            </div>

                            
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActivityNodeConfigurationProps {
  node: WorkflowNode;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
  previewMode: boolean;
  isEditingElements: boolean;
  workflow: any;
}

function ActivityNodeConfiguration({ node, onUpdate, previewMode, isEditingElements, workflow }: ActivityNodeConfigurationProps) {
  const { state } = useApp();
  const template = state.activityTemplates.find(t => t.id === node.activityTemplateId);

  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [editingBranchName, setEditingBranchName] = useState<string>('');

  if (!template) {
    return <div className="text-slate-500">Template not found</div>;
  }

  // Use node's local elements if they exist, otherwise fall back to template elements
  const currentElements = node.localSidePanelElements || [...template.sidePanelElements];

  // Check if this is a condition node
  const isConditionNode = template.name.toLowerCase().includes('condition') || 
                         template.description.toLowerCase().includes('condition');

  const addUIElement = () => {
    const newElement: UIElement = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      required: false
    };
    
    // Create a copy of current elements and add the new one
    const updatedElements = [...currentElements, newElement];
    onUpdate({ localSidePanelElements: updatedElements });
  };

  const updateUIElement = (elementId: string, updates: Partial<UIElement>) => {
    const updatedElements = currentElements.map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    onUpdate({ localSidePanelElements: updatedElements });
  };

  const removeUIElement = (elementId: string) => {
    const updatedElements = currentElements.filter(el => el.id !== elementId);
    onUpdate({ localSidePanelElements: updatedElements });
  };

  // Get all unique branches from workflow nodes
  const getAllBranches = () => {
    const branches = new Set<string>();
    workflow.nodes.forEach((workflowNode: WorkflowNode) => {
      const branch = workflowNode.metadata?.branch || 'main';
      branches.add(branch);
    });
    return Array.from(branches).sort();
  };

  // Add a new branch
  const addBranch = () => {
    const existingBranches = getAllBranches();
    const branchNumber = existingBranches.filter(b => b.startsWith('Branch')).length + 1;
    const newBranchName = `Branch ${branchNumber}`;
    
    // Update the node's metadata to include the new branch in its configuration
    const updatedMetadata = {
      ...node.metadata,
      branches: [...(node.metadata?.branches || []), newBranchName]
    };
    
    onUpdate({ metadata: updatedMetadata });
  };

  // Add a condition line to a branch
  const addConditionLine = (branchIndex: number) => {
    const branches = node.metadata?.branches || [];
    const updatedBranches = [...branches];
    
    // Add a new condition line to the branch (this is just for UI, actual logic would be more complex)
    const branchConditions = node.metadata?.branchConditions || {};
    const branchName = `Branch ${branchIndex + 1}`;
    const currentConditions = branchConditions[branchName] || [];
    
    const updatedBranchConditions = {
      ...branchConditions,
      [branchName]: [...currentConditions, { field: '', operator: 'is', value: '' }]
    };
    
    const updatedMetadata = {
      ...node.metadata,
      branchConditions: updatedBranchConditions
    };
    
    onUpdate({ metadata: updatedMetadata });
  };

  // Update condition line
  const updateConditionLine = (branchIndex: number, conditionIndex: number, field: string, value: any) => {
    const branchConditions = node.metadata?.branchConditions || {};
    const branchName = `Branch ${branchIndex + 1}`;
    const currentConditions = branchConditions[branchName] || [];
    
    const updatedConditions = [...currentConditions];
    updatedConditions[conditionIndex] = { ...updatedConditions[conditionIndex], [field]: value };
    
    const updatedBranchConditions = {
      ...branchConditions,
      [branchName]: updatedConditions
    };
    
    const updatedMetadata = {
      ...node.metadata,
      branchConditions: updatedBranchConditions
    };
    
    onUpdate({ metadata: updatedMetadata });
  };

  return (
    <div className="space-y-4">
      {isEditingElements && node.id !== 'trigger' ? (
        <div className="space-y-4">
          {/* Activity Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Activity Name
            </label>
            <input
              type="text"
              value={node.userAssignedName || template.name}
              onChange={(e) => onUpdate({ userAssignedName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter activity name"
            />
          </div>

          {/* Side Panel Description Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Side Panel Description
            </label>
            <textarea
              value={node.sidePanelDescription || template.sidePanelDescription || ''}
              onChange={(e) => onUpdate({ sidePanelDescription: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Description shown in the side panel"
            />
          </div>

          {/* Map Description Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Map Description
            </label>
            <MapDescriptionInput
              value={node.mapDescription || template.description || ''}
              onChange={(value) => onUpdate({ mapDescription: value })}
              uiElements={currentElements}
            />
          </div>

          {/* Side Panel Elements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-slate-700">Side Panel Elements</h5>
              <button
                onClick={addUIElement}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
            
            {currentElements.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-300 rounded-lg">
                <Settings className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No elements configured</p>
                <p className="text-xs text-slate-500">Click "Add" to create your first element</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentElements.map((element) => (
                  <WorkflowUIElementEditor
                    key={element.id}
                    element={element}
                    onUpdate={updateUIElement}
                    onRemove={removeUIElement}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Regular form elements */}
          <DynamicForm
            elements={currentElements}
            values={node.metadata || {}}
            onChange={(values) => onUpdate({ metadata: values })}
          />

          {/* Condition-specific branch configuration */}
          {isConditionNode && (
            <div className="border-t pt-4 mt-6">
              <h4 className="text-sm font-medium text-slate-700 mb-4">Branch Configuration</h4>
              
              {/* Existing branches */}
              {(node.metadata?.branches || ['Branch 1', 'Branch 2']).map((branchName: string, branchIndex: number) => (
                <div key={branchName} className="mb-6 p-4 bg-slate-50 rounded-lg flex flex-col rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {editingBranchIndex === branchIndex ? (
                        <input
                          type="text"
                          value={editingBranchName}
                          autoFocus
                          onChange={e => setEditingBranchName(e.target.value)}
                          onBlur={() => {
                            if (editingBranchName.trim()) {
                              const newBranches = [...(node.metadata?.branches || [])];
                              newBranches[branchIndex] = editingBranchName.trim();
                              onUpdate({ metadata: { ...node.metadata, branches: newBranches } });
                            }
                            setEditingBranchIndex(null);
                            setEditingBranchName('');
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (editingBranchName.trim()) {
                                const newBranches = [...(node.metadata?.branches || [])];
                                newBranches[branchIndex] = editingBranchName.trim();
                                onUpdate({ metadata: { ...node.metadata, branches: newBranches } });
                              }
                              setEditingBranchIndex(null);
                              setEditingBranchName('');
                            } else if (e.key === 'Escape') {
                              setEditingBranchIndex(null);
                              setEditingBranchName('');
                            }
                          }}
                          className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ minWidth: 80 }}
                        />
                      ) : (
                        <button
                          className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full hover:bg-teal-200 transition-colors"
                          onClick={() => {
                            setEditingBranchIndex(branchIndex);
                            setEditingBranchName(branchName);
                          }}
                        >
                          {branchName}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const currentBranches = node.metadata?.branches || ['Branch 1', 'Branch 2'];
                        if (currentBranches.length > 2) {
                          const newBranches = currentBranches.filter((_: string, i: number) => i !== branchIndex);
                          onUpdate({ metadata: { ...node.metadata, branches: newBranches } });
                        }
                      }}
                      className={`ml-2 p-1 rounded hover:bg-red-100 ${((node.metadata?.branches || ['Branch 1', 'Branch 2']).length <= 2) ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                      disabled={(node.metadata?.branches || ['Branch 1', 'Branch 2']).length <= 2}
                      title={((node.metadata?.branches || ['Branch 1', 'Branch 2']).length <= 2) ? 'At least two branches required' : 'Delete branch'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Condition lines for this branch */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-600 mb-2">If</label>
                    {(node.metadata?.branchConditions?.[branchName] || [{ field: '', operator: 'is', value: '' }]).map((condition: any, conditionIndex: number) => (
                      <div key={conditionIndex} className="flex space-x-2 mb-2">
                        <select
                          value={condition.field || ''}
                          onChange={(e) => updateConditionLine(branchIndex, conditionIndex, 'field', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select field...</option>
                          <option value="Location">Location</option>
                          <option value="Status">Status</option>
                          <option value="Priority">Priority</option>
                        </select>
                        <select
                          value={condition.operator || 'is'}
                          onChange={(e) => updateConditionLine(branchIndex, conditionIndex, 'operator', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="is">is</option>
                          <option value="is not">is not</option>
                          <option value="contains">contains</option>
                        </select>
                        <select
                          value={condition.value || ''}
                          onChange={(e) => updateConditionLine(branchIndex, conditionIndex, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select value...</option>
                          <option value="Bucharest">Bucharest</option>
                          <option value="Oslo">Oslo</option>
                          <option value="London">London</option>
                          <option value="Paris">Paris</option>
                        </select>
                      </div>
                    ))}
                    <button
                      onClick={() => addConditionLine(branchIndex)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Line</span>
                    </button>
                  </div>
                </div>
              ))}
              {/* Add Branch Button */}
              <button
                onClick={() => {
                  const currentBranches = node.metadata?.branches || ['Branch 1', 'Branch 2'];
                  const nextNum = currentBranches.length + 1;
                  const newBranches = [...currentBranches, `Branch ${nextNum}`];
                  onUpdate({ metadata: { ...node.metadata, branches: newBranches } });
                }}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MapDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  uiElements: UIElement[];
}

function MapDescriptionInput({ value, onChange, uiElements }: MapDescriptionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get all available UI elements (including nested conditional follow-up elements)
  const getAllUIElements = (elements: UIElement[]): UIElement[] => {
    const allElements: UIElement[] = [];
    
    const traverse = (els: UIElement[]) => {
      els.forEach(el => {
        // Only include elements that can have user input values
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

    // Check if user typed '#' to show suggestions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
      // Show suggestions if we just typed # or if we're still typing after #
      if (textAfterHash === '' || /^[a-zA-Z0-9\s]*$/.test(textAfterHash)) {
        setShowSuggestions(true);
        
        // Calculate position for suggestions dropdown
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const textBeforeHash = textBeforeCursor.substring(0, lastHashIndex);
          const lines = textBeforeHash.split('\n');
          const currentLine = lines.length - 1;
          const charInLine = lines[currentLine].length;
          
          // Approximate position calculation
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
      
      // Set cursor position after the replacement
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

  // Close suggestions when clicking outside
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
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={2}
        placeholder="Description shown on the workflow map. Use # to reference UI element values."
      />
      
      {showSuggestions && availableElements.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            minWidth: '200px'
          }}
        >
          <div className="p-2 text-xs text-slate-500 border-b">
            Select a UI element to reference:
          </div>
          {availableElements.map((element) => (
            <button
              key={element.id}
              onClick={() => handleElementSelect(element)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0"
            >
              <div className="font-medium text-slate-900">{element.label}</div>
              <div className="text-xs text-slate-500 capitalize">{element.type}</div>
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-1 text-xs text-slate-500">
        Type <code className="bg-slate-100 px-1 rounded">#</code> to reference UI element values in the description.
      </div>
    </div>
  );
}

interface WorkflowUIElementEditorProps {
  element: UIElement;
  onUpdate: (elementId: string, updates: Partial<UIElement>) => void;
  onRemove: (elementId: string) => void;
}

function WorkflowUIElementEditor({ element, onUpdate, onRemove }: WorkflowUIElementEditorProps) {
  const addConditionalFollowUp = () => {
    const newFollowUp: ConditionalFollowUp = {
      conditionValue: element.options?.[0] || (element.type === 'toggle' ? true : ''),
      elements: []
    };
    
    const currentFollowUps = element.conditionalFollowUps || [];
    onUpdate(element.id, { 
      conditionalFollowUps: [...currentFollowUps, newFollowUp],
      hasConditionalFollowUps: true
    });
  };

  const updateConditionalFollowUp = (index: number, updates: Partial<ConditionalFollowUp>) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).map((followUp, i) =>
      i === index ? { ...followUp, ...updates } : followUp
    );
    onUpdate(element.id, { conditionalFollowUps: updatedFollowUps });
  };

  const removeConditionalFollowUp = (index: number) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).filter((_, i) => i !== index);
    onUpdate(element.id, { 
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
    onUpdate(element.id, { conditionalFollowUps: updatedFollowUps });
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
    onUpdate(element.id, { conditionalFollowUps: updatedFollowUps });
  };

  const removeElementFromConditionalFollowUp = (followUpIndex: number, elementId: string) => {
    const updatedFollowUps = (element.conditionalFollowUps || []).map((followUp, i) =>
      i === followUpIndex 
        ? { ...followUp, elements: followUp.elements.filter(el => el.id !== elementId) }
        : followUp
    );
    onUpdate(element.id, { conditionalFollowUps: updatedFollowUps });
  };

  const canHaveConditionalFollowUps = ['dropdown', 'toggle', 'radio', 'checkbox'].includes(element.type);

  return (
    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <select
          value={element.type}
          onChange={(e) => onUpdate(element.id, { type: e.target.value as UIElement['type'] })}
          className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="text">Text Input</option>
          <option value="textarea">Textarea</option>
          <option value="dropdown">Dropdown</option>
          <option value="radio">Radio Buttons</option>
          <option value="checkbox">Checkbox</option>
          <option value="toggle">Toggle</option>
          <option value="button">Button</option>
          <option value="file-upload">File Upload</option>
          <option value="section-divider">Section Divider</option>
          <option value="text-block">Text Block</option>
        </select>
        <button
          onClick={() => onRemove(element.id)}
          className="p-1 text-red-600 hover:text-red-700 transition-colors"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
          <input
            type="text"
            value={element.label}
            onChange={(e) => onUpdate(element.id, { label: e.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Placeholder</label>
          <input
            type="text"
            value={element.placeholder || ''}
            onChange={(e) => onUpdate(element.id, { placeholder: e.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {(element.type === 'dropdown' || element.type === 'radio') && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Options (comma-separated)</label>
          <input
            type="text"
            value={element.options?.join(', ') || ''}
            onChange={(e) => {
              const options = e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt);
              onUpdate(element.id, { options });
            }}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      )}

      <div className="flex items-center mb-3">
        <input
          type="checkbox"
          id={`required-${element.id}`}
          checked={element.required || false}
          onChange={(e) => onUpdate(element.id, { required: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor={`required-${element.id}`} className="text-xs text-slate-600">
          Required field
        </label>
      </div>

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
                  onUpdate(element.id, { 
                    hasConditionalFollowUps: e.target.checked,
                    conditionalFollowUps: e.target.checked ? (element.conditionalFollowUps || []) : []
                  });
                }}
                className="mr-2"
              />
              <label htmlFor={`conditional-followup-${element.id}`} className="text-xs text-slate-600">
                Enable conditional follow-ups
              </label>
            </div>
            {element.hasConditionalFollowUps && (
              <button
                onClick={addConditionalFollowUp}
                className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Condition</span>
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
                          className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-slate-600">Follow-up Elements</label>
                      <button
                        onClick={() => addElementToConditionalFollowUp(followUpIndex)}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Element</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {followUp.elements.map((followUpElement) => (
                        <WorkflowUIElementEditor
                          key={followUpElement.id}
                          element={followUpElement}
                          onUpdate={(elementId, updates) => updateElementInConditionalFollowUp(followUpIndex, elementId, updates)}
                          onRemove={(elementId) => removeElementFromConditionalFollowUp(followUpIndex, elementId)}
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
    </div>
  );
}