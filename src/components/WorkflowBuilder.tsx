import React, { useState, useRef, useCallback, useEffect, Dispatch, SetStateAction, useRef as useReactRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Save, Eye, Settings, Trash2, Search, X, Edit2, Check, ZoomIn, ZoomOut, Maximize2, Minus, Scan, Mail, Globe, Database, FileText, Calendar, Users, Zap, Clock, CheckCircle, AlertCircle, Split, Image, Bot, Hourglass, User, MessageCircle, Tag, ListChecks, Video, ExternalLink, GitBranch, Star, Sparkle, UserRoundPlus, MoreVertical } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WorkflowNode, ActivityTemplate, UIElement, ConditionalFollowUp } from '../types';
import { DynamicForm } from './DynamicForm';
import ReactDOM from 'react-dom';
import * as Lucide from 'lucide-react';

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
  { name: 'Robot', component: Bot },
  { name: 'Star', component: Star },
  { name: 'Sparkle', component: Sparkle },
  { name: 'UserRoundPlus', component: UserRoundPlus },
  { name: 'Plus', component: Plus },
];

const ICON_COLORS = [
  { name: 'Purple', value: 'purple', bg: '#EAE8FB', iconColor: '#4D3EE0' },
  { name: 'Orange', value: 'orange', bg: '#FBEDD5', iconColor: '#DA5C30' },
  { name: 'Teal', value: 'teal', bg: '#D8F4F2', iconColor: '#3C6D68' }
];

// Add helper to normalize icon names
function normalizeIconName(name: string): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// --- UI Element Type Dropdown with Previews (copied from ActivityConfigurator) ---
const UI_ELEMENT_TYPES = [
  { value: 'text', label: 'Text Input', icon: Lucide.Type, category: 'User inputs' },
  { value: 'textarea', label: 'Textarea', icon: Lucide.AlignLeft, category: 'User inputs' },
  { value: 'dropdown', label: 'Dropdown', icon: Lucide.ChevronDownSquare, category: 'User inputs' },
  { value: 'radio', label: 'Radio Buttons', icon: Lucide.CircleDot, category: 'User inputs' },
  { value: 'checkbox', label: 'Checkbox', icon: Lucide.CheckSquare, category: 'User inputs' },
  { value: 'toggle', label: 'Toggle', icon: Lucide.ToggleLeft, category: 'User inputs' },
  { value: 'file-upload', label: 'File Upload', icon: Lucide.UploadCloud, category: 'User inputs' },
  { value: 'number', label: 'Numerical Input', icon: Lucide.ArrowDown10, category: 'User inputs' },
  { value: 'date', label: 'Date Picker', icon: Lucide.Calendar, category: 'User inputs' },
  { value: 'button', label: 'Button', icon: Lucide.MousePointer, category: 'User inputs' },
  { value: 'section-divider', label: 'Section Divider', icon: Lucide.Minus, category: 'Layout' },
  { value: 'text-block', label: 'Text Block', icon: Lucide.Text, category: 'Layout' },
  { value: 'screening-questions', label: 'Screening Questions Module', icon: Lucide.ListChecks, category: 'Special activities' },
  { value: 'conditions-module', label: 'Conditions Module', icon: Lucide.GitBranch, category: 'Special activities' },
  { value: 'events-module', label: 'Events Module', icon: Lucide.Calendar, category: 'Special activities' },
  { value: 'trigger-conditions-module', label: 'Trigger Conditions Module', icon: Lucide.Zap, category: 'Special activities' },
];

function UIElementTypeDropdown({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
  const selected = UI_ELEMENT_TYPES.find(t => t.value === value);
  // Group by category
  const grouped: Record<string, typeof UI_ELEMENT_TYPES> = UI_ELEMENT_TYPES.reduce((acc: Record<string, typeof UI_ELEMENT_TYPES>, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {});
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`flex items-center gap-2 px-3 py-1 border border-[#8C95A8] rounded-[10px] text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${open ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        {selected ? <selected.icon className="w-4 h-4 text-slate-500" /> : <Lucide.HelpCircle className="w-4 h-4 text-slate-400" />}
        <span>{selected ? selected.label : 'Select type'}</span>
        <Lucide.ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
      </button>
      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 mt-2 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[320px] max-h-72 overflow-y-auto"
        >
          {Object.entries(grouped).map(([category, types]: [string, typeof UI_ELEMENT_TYPES]) => (
            <div key={category} className="mb-1">
              <div className="text-[10px] font-semibold text-[#8C95A8] uppercase tracking-wider px-3 py-1 bg-[#F5F7FA] rounded mb-1">{category}</div>
              <div className="flex flex-col gap-0">
                {types.map((type: typeof UI_ELEMENT_TYPES[number]) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left text-[#464F5E] text-sm hover:bg-gray-50 ${value === type.value ? 'bg-[#F5F4FF] font-medium' : ''}`}
                    onClick={() => { onChange(type.value as string); setOpen(false); }}
                    disabled={disabled}
                  >
                    <type.icon className="w-4 h-4 text-slate-500" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, updateWorkflow, deleteWorkflow } = useApp();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [insertBranch, setInsertBranch] = useState<string>('main');
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingElements, setIsEditingElements] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [activityDropdownPosition, setActivityDropdownPosition] = useState<{ left: number; top: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editingBranchValue, setEditingBranchValue] = useState<string>('');
  const [availableActivityIds, setAvailableActivityIds] = useState<string[]>([]);
  const [showAvailableActivitiesModal, setShowAvailableActivitiesModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const workflow = state.workflows.find(w => w.id === workflowId);
  const selectedNode = state.selectedNode;

  // Reset selectedNode to null when workflowId changes (so no side panel is open by default)
  useEffect(() => {
    dispatch({ type: 'SELECT_NODE', payload: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  useEffect(() => {
    if (workflow?.metadata?.availableActivityIds) {
      setAvailableActivityIds(workflow.metadata.availableActivityIds);
    } else if (workflow) {
      setAvailableActivityIds(
        state.activityTemplates
          .filter(a => !(a.name.toLowerCase().includes('trigger') || a.icon === 'Zap'))
          .map(a => a.id)
      );
    }
  }, [workflow, state.activityTemplates]);

  // Save available activities to workflow metadata
  const saveAvailableActivities = async (newIds: string[]) => {
    if (!workflow) return;
    // Only update if changed
    if (JSON.stringify(workflow.metadata?.availableActivityIds || []) !== JSON.stringify(newIds)) {
      const updatedWorkflow = {
        ...workflow,
        metadata: {
          ...workflow.metadata,
          availableActivityIds: newIds
        }
      };
      dispatch({ type: 'UPDATE_WORKFLOW', payload: updatedWorkflow });
      await updateWorkflow(updatedWorkflow);
    }
  };

  // Memoize centerCanvas function to prevent initialization issues
  const centerCanvas = useCallback(() => {
    if (!canvasRef.current || !contentRef.current) return;
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
    // Only center when switching workflows, not on every workflow object or node change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  // Find the trigger template
  const triggerTemplate = state.activityTemplates.find(template => 
    template.name.toLowerCase().includes('trigger') || template.icon === 'Zap'
  );

  // Show loading spinner if data is still loading
  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  const handleAddActivity = (position: number, branch: string = 'main', event?: React.MouseEvent) => {
    setInsertPosition(position);
    setInsertBranch(branch);
    if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setActivityDropdownPosition({
        left: rect.left + rect.width / 2 - 132, // center dropdown (width 264px)
        top: rect.bottom + window.scrollY + 8,
      });
    }
    setShowActivityDropdown(true);
  };

  const handleSelectActivity = async (activity: ActivityTemplate) => {
    if (insertPosition === null) return;

    // Detect if this is a condition node
    const isCondition = activity.name.toLowerCase().includes('condition') || (activity.description && activity.description.toLowerCase().includes('condition'));

    const newNode: Omit<WorkflowNode, 'id'> = {
      activityTemplateId: activity.id,
      position: { x: 0, y: 0 }, // Position will be calculated based on order
      userAssignedName: activity.name,
      // Initialize with a copy of the template's elements for this specific node
      localSidePanelElements: [...activity.sidePanelElements],
      metadata: isCondition
        ? { branch: insertBranch, branches: ['Branch 1'] }
        : { branch: insertBranch }
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
    const normalized = normalizeIconName(iconName);
    const icon = AVAILABLE_ICONS.find(i => i.name === normalized);
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

    // Replace #{ElementLabel} with actual values, or empty string if not filled
    return description.replace(/#{([^}]+)}/g, (match, elementLabel) => {
      // Find the element by label in the node's local elements
      const allElements = getAllUIElements(node.localSidePanelElements || []);
      const element = allElements.find(el => el.label === elementLabel);
      if (element && node.metadata && node.metadata[element.id] !== undefined && node.metadata[element.id] !== null && node.metadata[element.id] !== '') {
        const value = node.metadata[element.id];
        // Format the value based on element type
        if (element.type === 'toggle') {
          return value ? 'ON' : 'OFF';
        } else if (element.type === 'checkbox') {
          return value ? 'checked' : 'unchecked';
        } else if (element.type === 'file-upload') {
          if (value && typeof value === 'object' && value instanceof File) {
            return value.name;
          }
          return value || '';
        } else {
          return String(value);
        }
      }
      // If no value found, return empty string
      return '';
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

  // --- Helper: Get property/operator labels for conditions summary ---
  const PROPERTY_OPTIONS = [
    { label: 'Job ID', value: 'jobID' },
    { label: 'Department', value: 'department' },
    { label: 'Country', value: 'country' },
    { label: 'Profile skills', value: 'profileSkills' },
    { label: 'City', value: 'city' },
  ];
  const OPERATOR_OPTIONS = [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'is_not' },
    { label: 'contains', value: 'contains' },
  ];
  function getPropertyLabel(value: string) {
    // Try direct match
    let found = PROPERTY_OPTIONS.find(p => p.value === value);
    if (found) return found.label;
    // Try camelCase to snake_case
    const snake = value.replace(/([A-Z])/g, '_$1').toLowerCase();
    found = PROPERTY_OPTIONS.find(p => p.value.toLowerCase() === snake);
    if (found) return found.label;
    // Try snake_case to camelCase
    const camel = value.replace(/_([a-z])/g, g => g[1].toUpperCase());
    found = PROPERTY_OPTIONS.find(p => p.value === camel);
    if (found) return found.label;
    // Fallback: prettify
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  function getOperatorLabel(value: string) {
    return OPERATOR_OPTIONS.find(o => o.value === value)?.label || value;
  }
  // --- Branch summary for Condition nodes ---
  function getConditionBranchSummary(node: WorkflowNode): string {
    // Find the first conditions-module element
    const condEl = (node.localSidePanelElements || []).find(el => el.type === 'conditions-module');
    if (!condEl) return 'No conditions configured';
    const condId = condEl.id;
    const condData = node.metadata?.[condId];
    const branches = condData?.branches || [];
    if (!Array.isArray(branches) || branches.length === 0) return '';
    return branches.map((branch: any) => {
      const branchName = branch.name || 'Branch';
      const groups = branch.groups || [];
      if (!Array.isArray(groups) || groups.length === 0) return `${branchName}: No condition set`;
      // For each group, handle property/operator inheritance
      const groupSummaries = groups.map((group: any) => {
        const lines = Array.isArray(group?.lines) ? group.lines : [];
        if (!lines.length) return '';
        // Inherit property/operator from previous line if missing
        let lastProp = '';
        let lastOp = '';
        const effectiveLines = lines.map((l: any) => {
          if (l.property) lastProp = l.property;
          if (l.operator) lastOp = l.operator;
          return { property: lastProp, operator: lastOp, value: l.value };
        });
        // Group by property+operator
        const grouped: Record<string, { property: string, operator: string, values: string[] }> = {};
        effectiveLines.filter((l: any) => l.property && l.value).forEach((line: any) => {
          const key = `${line.property}__${line.operator}`;
          if (!grouped[key]) {
            grouped[key] = {
              property: line.property,
              operator: line.operator,
              values: []
            };
          }
          grouped[key].values.push(line.value);
        });
        const logic = group.groupLogic?.toUpperCase() || 'AND';
        const summaries = Object.values(grouped).map(g => {
          if (g.values.length === 1) {
            return `${getPropertyLabel(g.property)} ${getOperatorLabel(g.operator)} ${g.values[0]}`;
          } else {
            return `${getPropertyLabel(g.property)} ${getOperatorLabel(g.operator)} ${g.values.join(` ${logic} `)}`;
          }
        });
        return summaries.join(` ${logic} `);
      }).filter(Boolean);
      // Join groups with outerLogic (default OR)
      const outerLogic = branch.outerLogic?.toUpperCase() || 'OR';
      const summary = groupSummaries.join(` ${outerLogic} `);
      return `${branchName}: ${summary || 'No condition set'}`;
    }).join('\n');
  }

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
          const IconComponent = getIconComponent(template.icon);
          const iconColor = getIconColor(template.iconColor || 'purple');
          const displayDescription = isConditionNode(node) ? getConditionBranchSummary(node) : processMapDescription(
            node.mapDescription || template.description, 
            node
          );

          // Check if this is the last plus button in the branch
          const isLast = index === branchNodes.length - 1;

          return (
            <React.Fragment key={node.id}>
              {/* Plus button above (except first node, and not for first node after a Condition node) */}
              {index === 0 && branchNodes.length > 0 && !isFirstNodeAfterCondition && (
                <div className="flex justify-center mb-0">
                  <button
                    onClick={e => handleAddActivity(index, branch, e)}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-[#AEB5C2] text-[#AEB5C2] transition-all duration-200 group hover:w-6 hover:h-6 hover:bg-gray-400 hover:text-white hover:rounded-lg"
                    style={{ minWidth: 12, minHeight: 12 }}
                  >
                    <Plus className="w-3 h-3 group-hover:w-4 group-hover:h-4 transition-all duration-200" />
                  </button>
                </div>
              )}
              {/* Always render separator line after plus button, before node card */}
              <div className="flex justify-center mb-0">
                <div className="w-0.5 h-6 bg-slate-300"></div>
              </div>
              {/* Node rendering (Condition or not) */}
              {isConditionNode(node) ? (
                (() => {
                  const branches = node.metadata?.branches || ['Branch 1', 'Branch 2'];
                  const branchCount = branches.length;
                  const columnWidth = 264; // width of activity card
                  const gap = 40;
                  const svgHeight = 12;
                  const svgWidth = branchCount > 1 ? (branchCount - 1) * (columnWidth + gap) : 0;
                  const startX = svgWidth / 2;
                  const branchXs = branches.map((_: any, idx: any) => idx * (columnWidth + gap));
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
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor.bg }}>
                            {/* Rotate icon 90deg for Condition node only */}
                            <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor, transform: 'rotate(90deg)' }} />
                          </div>
                          <h3 className="font-medium text-[#353B46] text-[14px] mb-0">{node.userAssignedName || template.name}</h3>
                        </div>
                        {displayDescription && (
                          <>
                            <p className="text-[10px] text-[#637085] leading-relaxed mt-2 whitespace-pre-line">{displayDescription}</p>
                            {node.mapDescription && (
                              <p className="text-[10px] text-[#637085] leading-relaxed mt-1 whitespace-pre-line font-semibold">{processMapDescription(node.mapDescription, node)}</p>
                            )}
                          </>
                        )}
                      </div>
                      {/* Vertical line directly after the card, with no margin below */}
                      <div className="w-0.5 h-8 bg-slate-300 m-0 p-0" style={{ margin: 0, padding: 0 }} />
                      {/* SVG for horizontal + rounded lines, horizontal line at the very top */}
                      {branchCount > 1 && (
                        <svg width={svgWidth} height={svgHeight} className="block" style={{ marginTop: 0 }}>
                          {/* Horizontal line at the very top */}
                          <line x1={branchXs[0]} y1={0} x2={branchXs[branchCount-1]} y2={0} stroke="#CBD5E1" strokeWidth="3" />
                          {/* Rounded corners and verticals */}
                          {branchXs.map((x: number, idx: any) => (
                            <React.Fragment key={idx}>
                              {/* Rounded corner starting at the top */}
                              <path
                                d={`M${x},0 Q${x},6 ${x},${svgHeight}`}
                                stroke="#CBD5E1"
                                strokeWidth="3"
                                fill="none"
                              />
                            </React.Fragment>
                          ))}
                        </svg>
                      )}
                      {/* Branch columns */}
                      <div className="flex flex-row justify-center gap-x-12 mt-0">
                        {branches.map((branchName: string, branchIdx: number) => {
                          const branchNodes = getNodesForBranch(branchName);
                          return (
                            <div key={branchName} className="flex flex-col items-center w-[264px]">
                              {/* Branch tag */}
                              {editingBranch === branchName ? (
                                <input
                                  ref={inputRef}
                                  className="bg-[#C6F2F2] text-[#2B4C4C] px-2 py-1 rounded-lg text-xs font-normal mb-0 mt-0 outline-none border border-[#2B4C4C]"
                                  value={editingBranchValue}
                                  onChange={e => setEditingBranchValue(e.target.value)}
                                  onBlur={() => {
                                    if (editingBranchValue && editingBranchValue !== branchName) {
                                      updateBranchNameEverywhere(branchName, editingBranchValue);
                                    }
                                    setEditingBranch(null);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      if (editingBranchValue && editingBranchValue !== branchName) {
                                        updateBranchNameEverywhere(branchName, editingBranchValue);
                                      }
                                      setEditingBranch(null);
                                    } else if (e.key === 'Escape') {
                                      setEditingBranch(null);
                                    }
                                  }}
                                  autoFocus
                                  style={{ minWidth: 60 }}
                                />
                              ) : (
                                <div
                                  className="bg-[#C6F2F2] text-[#2B4C4C] px-2 py-1 rounded-lg text-xs font-normal mb-0 mt-0 cursor-pointer hover:ring-2 hover:ring-[#2B4C4C]"
                                  onClick={() => {
                                    setEditingBranch(branchName);
                                    setEditingBranchValue(branchName);
                                    setTimeout(() => inputRef.current?.focus(), 0);
                                  }}
                                  title="Click to rename branch"
                                >
                                  {branchName}
                                </div>
                              )}
                              {/* Vertical line from tag to first node or plus */}
                              <div className="w-0.5 h-4 bg-slate-300" />
                              {/* If branch is empty, show plus button */}
                              {branchNodes.length === 0 && (
                                <button
                                  onClick={() => handleAddActivity(0, branchName)}
                                  className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center mt-0 hover:bg-gray-500 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                              {/* Render all nodes in this branch */}
                              {branchNodes.map((node, idx) => {
                                const template = getActivityTemplate(node.activityTemplateId);
                                if (!template) return null;
                                const IconComponent = getIconComponent(template.icon);
                                const iconColor = getIconColor(template.iconColor || 'purple');
                                const displayDescription = processMapDescription(
                                  node.mapDescription || template.description,
                                  node
                                );
                                const isLast = idx === branchNodes.length - 1;
                                const isCondition = template.name === 'Condition';
                                return (
                                  <React.Fragment key={node.id}>
                                    {/* Activity card */}
                                    <div
                                      className={`w-full bg-white rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 relative group
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
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor.bg }}>
                                          <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor, ...(isCondition ? { transform: 'rotate(90deg)' } : {}) }} />
                                        </div>
                                        <h3 className="font-medium text-[#353B46] text-[14px] mb-0">{node.userAssignedName || template.name}</h3>
                                      </div>
                                      {isCondition ? (
                                        <>
                                          <p className="text-[10px] text-[#637085] leading-relaxed mt-2 whitespace-pre-line">{getConditionBranchSummary(node)}</p>
                                          {node.mapDescription && (
                                            <p className="text-[10px] text-[#637085] leading-relaxed mt-1 whitespace-pre-line font-semibold">{processMapDescription(node.mapDescription, node)}</p>
                                          )}
                                        </>
                                      ) : (
                                        displayDescription && (
                                          <p className="text-[10px] text-[#637085] leading-relaxed mt-2 whitespace-pre-line">{displayDescription}</p>
                                        )
                                      )}
                                    </div>
                                    {/* Vertical line below card */}
                                    <div className="w-0.5 h-4 bg-slate-300" />
                                    {/* Plus button after each node except last */}
                                    {!isLast && (
                                      <>
                                        <button
                                          onClick={e => handleAddActivity(idx + 1, branchName, e)}
                                          className="w-4 h-4 flex items-center justify-center rounded-full bg-[#AEB5C2] text-[#AEB5C2] transition-all duration-200 group hover:w-6 hover:h-6 hover:bg-gray-400 hover:text-white hover:rounded-lg"
                                          style={{ minWidth: 12, minHeight: 12 }}
                                        >
                                          <Plus className="w-3 h-3 group-hover:w-4 group-hover:h-4 transition-all duration-200" />
                                        </button>
                                        <div className="w-0.5 h-4 bg-slate-300" />
                                      </>
                                    )}
                                    {/* Plus button after last node */}
                                    {isLast && (
                                      <button
                                        onClick={e => handleAddActivity(idx + 1, branchName, e)}
                                        className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center hover:bg-gray-500 transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mb-0 flex flex-col items-center w-[264px]">
                  <div
                    className={`w-full bg-white rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 relative group
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
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconColor.bg }}>
                        <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                      </div>
                      <h3 className="font-medium text-[#353B46] text-[14px] mb-0">{node.userAssignedName || template.name}</h3>
                    </div>
                    {displayDescription && (
                      <p className="text-[10px] text-[#637085] leading-relaxed mt-2">{displayDescription}</p>
                    )}
                  </div>
                </div>
              )}
              {/* Connection Line */}
              {(!isConditionNode(node)) && (
                <div className="flex justify-center mb-0">
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                </div>
              )}
              {/* Plus button after (except for Condition node) */}
              {!isConditionNode(node) && (
                <div className="flex justify-center mb-0">
                  {isLast ? (
                    <button
                      onClick={e => handleAddActivity(index + 1, branch, e)}
                      className="w-6 h-6 bg-gray-400 text-white rounded-lg flex items-center justify-center hover:bg-gray-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={e => handleAddActivity(index + 1, branch, e)}
                      className="w-4 h-4 flex items-center justify-center rounded-full bg-[#AEB5C2] text-[#AEB5C2] transition-all duration-200 group hover:w-6 hover:h-6 hover:bg-gray-400 hover:text-white hover:rounded-lg"
                      style={{ minWidth: 12, minHeight: 12 }}
                    >
                      <Plus className="w-3 h-3 group-hover:w-4 group-hover:h-4 transition-all duration-200" />
                    </button>
                  )}
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

  const handleDeleteWorkflow = async () => {
    if (!workflow) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteWorkflow = async () => {
    if (!workflow) return;
    navigate('/'); // Redirect first, before any state changes or async
    await deleteWorkflow(workflow.id);
    setShowDeleteModal(false);
  };

  const cancelDeleteWorkflow = () => {
    setShowDeleteModal(false);
  };

  // Utility to recursively collect all node IDs in a branch and its sub-branches for deletion
  function collectAllNodeIdsToDelete(nodes: WorkflowNode[], branchNames: string[], getActivityTemplate: (id: string) => ActivityTemplate | undefined): Set<string> {
    const idsToDelete = new Set<string>();
    function collect(branch: string) {
      // Find all nodes in this branch
      const branchNodes = nodes.filter(n => (n.metadata?.branch || 'main') === branch);
      for (const node of branchNodes) {
        idsToDelete.add(node.id);
        // If this is a condition node, recursively collect for its sub-branches
        const template = getActivityTemplate(node.activityTemplateId);
        if (template && (template.name.toLowerCase().includes('condition') || (template.description && template.description.toLowerCase().includes('condition')))) {
          const subBranches: string[] = node.metadata?.branches || [];
          for (const subBranch of subBranches) {
            collect(subBranch);
          }
        }
      }
    }
    for (const branch of branchNames) {
      collect(branch);
    }
    return idsToDelete;
  }

  // Utility to deeply and recursively remove all references to deleted branches from all nodes' metadata and localSidePanelElements
  function deepCleanWorkflowForDeletedBranches(workflow: any, deletedBranches: string[]): any {
    function recursiveClean(obj: any): any {
      if (Array.isArray(obj)) {
        // Recursively clean each item in the array
        return obj
          .map(recursiveClean)
          .filter(item => {
            // Remove branch objects whose name matches a deleted branch
            if (item && typeof item === 'object' && 'name' in item && deletedBranches.includes(item.name)) {
              return false;
            }
            return true;
          });
      } else if (obj && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key of Object.keys(obj)) {
          // Remove branch/branches fields referencing deleted branches
          if (key === 'branch' && typeof obj[key] === 'string' && deletedBranches.includes(obj[key])) {
            continue;
          }
          if (key === 'branches' && Array.isArray(obj[key])) {
            cleaned[key] = obj[key].filter((b: any) =>
              typeof b === 'string' ? !deletedBranches.includes(b) : (b && b.name ? !deletedBranches.includes(b.name) : true)
            ).map(recursiveClean);
            continue;
          }
          // Recursively clean nested objects/arrays
          cleaned[key] = recursiveClean(obj[key]);
        }
        // Remove empty objects
        if (Object.keys(cleaned).length === 0) return undefined;
        return cleaned;
      }
      return obj;
    }
    // Remove nodes whose metadata.branch matches a deleted branch
    let nodes = workflow.nodes.filter((n: any) => !deletedBranches.includes(n.metadata?.branch));
    // For each node, clean up metadata and localSidePanelElements
    nodes = nodes.map((node: any) => {
      const cleanedMetadata = recursiveClean(node.metadata);
      // Optionally, clean localSidePanelElements if you have branch-specific elements
      return { ...node, metadata: cleanedMetadata };
    });
    return { ...workflow, nodes };
  }

  // Utility to repair branch assignments for all nodes after branch operations
  function repairBranchAssignments(nodes: WorkflowNode[], getActivityTemplate: (id: string) => ActivityTemplate | undefined): WorkflowNode[] {
    // Map from node id to node for fast lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    // Helper to recursively assign branch to all descendants
    function assignBranch(startNodeId: string, branch: string) {
      let queue = [startNodeId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId) continue;
        const node = nodeMap.get(currentId);
        if (!node) continue;
        // Only update if not a condition node (they own their own branches)
        const template = getActivityTemplate(node.activityTemplateId);
        const isCondition = template && (template.name.toLowerCase().includes('condition') || (template.description && template.description.toLowerCase().includes('condition')));
        if (!isCondition) {
          node.metadata = { ...node.metadata, branch };
        }
        // Find direct children (nodes whose metadata.branch === branch and come after this node)
        // In this flat model, we can't walk children by tree, so we rely on branch assignment only
        // (If you have explicit parent/child links, use them here)
      }
    }
    // For each condition node, assign branches to all descendants
    nodes.forEach(node => {
      const template = getActivityTemplate(node.activityTemplateId);
      if (template && (template.name.toLowerCase().includes('condition') || (template.description && template.description.toLowerCase().includes('condition')))) {
        const branches: string[] = node.metadata?.branches || [];
        branches.forEach((branch: string) => {
          // Find all nodes in this branch and set their branch
          nodes.forEach(n => {
            if (n.metadata?.branch === branch) {
              n.metadata = { ...n.metadata, branch };
            }
          });
        });
      }
    });
    return nodes;
  }

  // Helper to update all references to a branch name in the workflow
  function updateBranchNameEverywhere(oldName: string, newName: string) {
    if (!workflow) return;
    // Update nodes' metadata.branch
    const updatedNodes = workflow.nodes.map((node: any) => {
      let updated = { ...node };
      if (node.metadata?.branch === oldName) {
        updated = { ...updated, metadata: { ...updated.metadata, branch: newName } };
      }
      // If this is a condition node, update its branches array
      if (Array.isArray(node.metadata?.branches)) {
        updated = {
          ...updated,
          metadata: {
            ...updated.metadata,
            branches: node.metadata.branches.map((b: string) => b === oldName ? newName : b)
          }
        };
      }
      // If there are other references (e.g., branchConditions), update those too
      if (node.metadata?.branchConditions) {
        const newBranchConditions: any = {};
        Object.entries(node.metadata.branchConditions).forEach(([k, v]) => {
          newBranchConditions[k === oldName ? newName : k] = v;
        });
        updated = {
          ...updated,
          metadata: {
            ...updated.metadata,
            branchConditions: newBranchConditions
          }
        };
      }
      return updated;
    });
    const updatedWorkflow = { ...workflow, nodes: updatedNodes };
    dispatch({ type: 'UPDATE_WORKFLOW', payload: updatedWorkflow });
    updateWorkflow(updatedWorkflow);
  }

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
          <div className="flex items-center space-x-3 relative">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                previewMode
                  ? 'bg-[#EAE8FB] border border-[#2927B2]'
                  : 'bg-white text-[#2927B2] border border-[#8C95A8] hover:bg-slate-200'
              }`}
            >
              <span>Simulate</span>
            </button>
            <button 
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center space-x-2  px-4 py-2 bg-[#4D3EE0] text-white rounded-xl hover:bg-[#2927B2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            {/* More menu button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(v => !v)}
                className={`flex items-center space-x-2 px-2 py-2 rounded-xl transition-colors bg-white text-[#637085] border border-[#8C95A8] hover:bg-slate-200`}
                title="More actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 pt-1 pb-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => { setShowAvailableActivitiesModal(true); setShowMenu(false); }}
                    className="w-full text-sm text-left px-4 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-xs text-slate-500" />
                    <span>Available activities</span>
                  </button>
                  <button
                    onClick={handleDeleteWorkflow}
                    className="w-full text-sm text-left px-4 py-2 text-slate-600 hover:bg-red-50 rounded-t-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-xs text-red-500" />
                    <span>Delete workflow</span>
                  </button>
                </div>
              )}
            </div>
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
                  style={{ position: 'relative' }}
                >
                  {/* Green line on top for Trigger */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '6px',
                    background: '#5CB6AC',
                    borderTopLeftRadius: '14px',
                    borderTopRightRadius: '14px',
                  }} />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#D8F4F2] rounded-[10px] flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-[#3C6D68]" />
                    </div>
                    <h3 className="font-medium text-[#353B46] text-[14px] mb-0">Trigger</h3>
                  </div>
                  <p className="text-[10px] text-[#637085] leading-relaxed mt-2">
                    {processMapDescription(
                      triggerTemplate?.description || '',
                      {
                        id: 'trigger',
                        activityTemplateId: triggerTemplate?.id || '',
                        position: { x: 0, y: 0 },
                        userAssignedName: 'Trigger',
                        localSidePanelElements: triggerTemplate?.sidePanelElements || [],
                        metadata: workflow.triggerMetadata || {}
                      }
                    )}
                  </p>
                </div>
              </div>
              <div className="flex justify-center mb-0">
                <div className="w-0.5 h-6 bg-slate-300"></div>
              </div>
              {/* Add Activity Button after Trigger */}
              {mainBranchNodes.length === 0 && (
                <div className="flex justify-center mb-0">
                  <button
                    onClick={e => handleAddActivity(0, 'main', e)}
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
          <div className="bg-white p-4 flex justify-between items-start">
  {/* Left: Title + optional subtitle */}
  <div className="flex-1">
    <div className="flex items-center justify-between">
      <h3 className="text-[20px] font-semibold text-[#353B46]">
        {selectedNode.id === 'trigger'
          ? 'Trigger'
          : selectedNode.userAssignedName || selectedTemplate?.name || 'Configuration'}
      </h3>
      {/* Right: Icons */}
      <div className="flex items-center space-x-3 ml-4">
        {selectedNode.id !== 'trigger' && (
          <button
            onClick={() => setIsEditingElements(!isEditingElements)}
            className={`p-2 rounded-lg transition-colors ${
              isEditingElements
                ? 'bg-[#EAE8FB] text-[#2927B2]'
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

    {(selectedNode.sidePanelDescription || selectedTemplate?.sidePanelDescription) && (
      <p className="text-[13px] text-[#464F5E] mt-1">
        {selectedNode.sidePanelDescription || selectedTemplate?.sidePanelDescription}
      </p>
    )}
  </div>
</div>


          <div className="flex-1 overflow-y-auto p-4">
            <ActivityNodeConfiguration
              node={selectedNode}
              onUpdate={(updates) => {
                // Special handling for branch deletion: remove nodes in deleted branches
                if (updates.metadata && updates.metadata.__deleteNodesInBranches) {
                  const deletedBranches = updates.metadata.__deleteNodesInBranches;
                  console.log('WorkflowBuilder: Received branch deletion signal for branches', deletedBranches);
                  // Recursively collect all node IDs to be deleted
                  const idsToDelete = collectAllNodeIdsToDelete(workflow.nodes, deletedBranches, getActivityTemplate);
                  console.log('WorkflowBuilder: Deleting node IDs', Array.from(idsToDelete));
                  // Repair branch assignments before filtering (optional, but safe)
                  const repairedNodes = repairBranchAssignments([...workflow.nodes], getActivityTemplate);
                  const filteredNodes = repairedNodes.filter((n: any) => !idsToDelete.has(n.id));
                  const cleanedMetadata = { ...updates.metadata };
                  delete cleanedMetadata.__deleteNodesInBranches;
                  let updatedWorkflow = {
                    ...workflow,
                    nodes: filteredNodes
                  };
                  // Deep clean all metadata for deleted branches
                  updatedWorkflow = deepCleanWorkflowForDeletedBranches(updatedWorkflow, deletedBranches);
                  // Remove nodes whose metadata.branch is not in any Condition node's branches or 'main'
                  const validBranches = new Set(['main']);
                  updatedWorkflow.nodes.forEach((node: any) => {
                    const template = getActivityTemplate(node.activityTemplateId);
                    if (template && (template.name.toLowerCase().includes('condition') || (template.description && template.description.toLowerCase().includes('condition')))) {
                      (node.metadata?.branches || []).forEach((b: string) => validBranches.add(b));
                    }
                  });
                  updatedWorkflow.nodes = updatedWorkflow.nodes.filter((n: any) => validBranches.has(n.metadata?.branch || 'main'));
                  // Debug: log the workflow state after cleaning
                  console.log('Workflow after branch deletion:', JSON.stringify(updatedWorkflow, null, 2));
                  dispatch({ type: 'UPDATE_WORKFLOW', payload: updatedWorkflow });
                  updateWorkflow(updatedWorkflow);
                  console.log('WorkflowBuilder: Updated workflow nodes', updatedWorkflow.nodes.map(n => n.id));
                  // If the current node is being deleted, do not update it further
                  if (idsToDelete.has(selectedNode.id)) {
                    dispatch({ type: 'SELECT_NODE', payload: null });
                    return;
                  }
                  // Always update the selected node to the latest version from the workflow
                  let updatedNode = updatedWorkflow.nodes.find((n: any) => n.id === selectedNode.id);
                  if (updatedNode) {
                    // If this is a condition node, prune its metadata.branches to only include branches that still exist
                    const template = getActivityTemplate(updatedNode.activityTemplateId);
                    if (
                      template &&
                      (template.name.toLowerCase().includes('condition') ||
                        (template.description && template.description.toLowerCase().includes('condition')))
                    ) {
                      const allBranchNames = new Set(
                        updatedWorkflow.nodes.map((n: any) => n.metadata?.branch || 'main')
                      );
                      if (updatedNode.metadata && Array.isArray(updatedNode.metadata.branches)) {
                        updatedNode = {
                          ...updatedNode,
                          metadata: {
                            ...updatedNode.metadata,
                            branches: updatedNode.metadata.branches.filter((b: string) =>
                              allBranchNames.has(b)
                            )
                          }
                        };
                      }
                    }
                    dispatch({ type: 'SELECT_NODE', payload: updatedNode });
                  }
                  // Continue with normal update for the condition node itself
                  handleNodeUpdate(selectedNode.id, { ...updates, metadata: cleanedMetadata });
                  return;
                }
                handleNodeUpdate(selectedNode.id, updates);
              }}
              previewMode={previewMode}
              isEditingElements={isEditingElements}
              workflow={workflow}
            />
          </div>
        </div>
      )}

      {showActivityDropdown && activityDropdownPosition && ReactDOM.createPortal(
        <ActivityDropdown
          position={activityDropdownPosition}
          activities={state.activityTemplates.filter(a => (workflow?.metadata?.availableActivityIds || availableActivityIds).includes(a.id))}
          onSelect={handleSelectActivity}
          onClose={() => setShowActivityDropdown(false)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
          onClick={cancelDeleteWorkflow}
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
                onClick={cancelDeleteWorkflow}
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
                onClick={cancelDeleteWorkflow}
              >
                Cancel
              </button>
              <button
                className="h-10 px-4 rounded-xl bg-[#C40F24] text-white text-sm font-medium hover:bg-[#B71C1C] focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                style={{ fontSize: 14 }}
                onClick={confirmDeleteWorkflow}
              >
                Delete workflow
              </button>
            </div>
          </div>
        </div>
      )}
      {showAvailableActivitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" onClick={async () => { await saveAvailableActivities(availableActivityIds); setShowAvailableActivitiesModal(false); }}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-0 flex flex-col"
            style={{ minWidth: 380 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-semibold text-[#3A3F4B]">Available activities</h2>
              <button
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full focus:outline-none"
                onClick={async () => { await saveAvailableActivities(availableActivityIds); setShowAvailableActivitiesModal(false); }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Divider */}
            <div className="border-t border-slate-200 w-full" />
            {/* Activities List - grouped by category, show category label, no description */}
            <div className="px-6 py-6 max-h-96 overflow-y-auto">
              <div className="text-sm text-[#3A3F4B] mb-4">
                Select the activities that show up when you add new activities to this workflow.
              </div>
              {(() => {
                const activities = state.activityTemplates.filter(a => !(a.name.toLowerCase().includes('trigger') || a.icon === 'Zap'));
                // Group by category
                const grouped: Record<string, typeof activities> = activities.reduce((acc, act) => {
                  if (!acc[act.category]) acc[act.category] = [];
                  acc[act.category].push(act);
                  return acc;
                }, {} as Record<string, typeof activities>);
                const sortedCategories = Object.keys(grouped).sort();
                return sortedCategories.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">No activities found.</div>
                ) : (
                  sortedCategories.map(category => (
                    <div key={category} className="mb-2">
                      <div className="text-[10px] font-semibold text-[#8C95A8] uppercase tracking-wider px-3 py-1 bg-[#F5F7FA] rounded mb-1">{category}</div>
                      {grouped[category].map(activity => {
                        const IconComponent = AVAILABLE_ICONS.find(i => i.name === activity.icon)?.component || Settings;
                        const iconColor = ICON_COLORS.find(c => c.value === (activity.iconColor || 'purple')) || ICON_COLORS[0];
                        return (
                          <label key={activity.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2">
                            <input
                              type="checkbox"
                              checked={availableActivityIds.includes(activity.id)}
                              onChange={e => {
                                setAvailableActivityIds(ids =>
                                  e.target.checked
                                    ? [...ids, activity.id]
                                    : ids.filter(id => id !== activity.id)
                                );
                              }}
                              className="accent-[#4D3EE0] w-4 h-4"
                            />
                            <span className="w-6 h-6 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: iconColor.bg }}>
                              <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                            </span>
                            <span className="font-medium text-[#353B46] text-sm">{activity.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  ))
                );
              })()}
            </div>
            {/* Divider */}
            <div className="border-t border-slate-200 w-full" />
            {/* Buttons */}
            <div className="flex justify-end space-x-4 px-6 py-3">
              <button
                className="h-10 px-4 rounded-xl bg-[#4D3EE0] text-white text-sm font-medium hover:bg-[#2927B2] focus:outline-none focus:ring-2 focus:ring-[#4D3EE0]"
                style={{ fontSize: 14 }}
                onClick={async () => { await saveAvailableActivities(availableActivityIds); setShowAvailableActivitiesModal(false); }}
              >
                Continue
              </button>
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
  const [activeTab, setActiveTab] = useState<'Configuration' | 'Advanced' | 'User Interface'>('Configuration');

  // Local state for buffered editing
  const [localActivityName, setLocalActivityName] = useState(node.userAssignedName || template?.name || '');
  const [localSidePanelDescription, setLocalSidePanelDescription] = useState(node.sidePanelDescription || template?.sidePanelDescription || '');
  const [localMapDescription, setLocalMapDescription] = useState(node.mapDescription || template?.description || '');

  // Keep local state in sync with node/template changes
  useEffect(() => {
    setLocalActivityName(node.userAssignedName || template?.name || '');
  }, [node.userAssignedName, template?.name]);
  useEffect(() => {
    setLocalSidePanelDescription(node.sidePanelDescription || template?.sidePanelDescription || '');
  }, [node.sidePanelDescription, template?.sidePanelDescription]);
  useEffect(() => {
    setLocalMapDescription(node.mapDescription || template?.description || '');
  }, [node.mapDescription, template?.description]);

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
      required: false,
      tab: activeTab
    };
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

  // Tab logic: get all tabs present in currentElements
  const tabSet = new Set((currentElements || []).map(el => el.tab || 'Configuration'));
  const allTabs = ['Configuration', 'Advanced', 'User Interface'] as const;
  const showTabs = isEditingElements && node.id !== 'trigger';
  // Only show elements for the active tab
  const filteredElements = currentElements.filter(el => (el.tab || 'Configuration') === activeTab);

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
              value={localActivityName}
              onChange={e => setLocalActivityName(e.target.value)}
              onBlur={() => {
                if (localActivityName !== (node.userAssignedName || template.name)) {
                  onUpdate({ userAssignedName: localActivityName });
                }
              }}
              className="w-full px-3 py-1 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter activity name"
            />
          </div>

          {/* Side Panel Description Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Side Panel Description
            </label>
            <textarea
              value={localSidePanelDescription}
              onChange={e => setLocalSidePanelDescription(e.target.value)}
              onBlur={() => {
                if (localSidePanelDescription !== (node.sidePanelDescription || template.sidePanelDescription)) {
                  onUpdate({ sidePanelDescription: localSidePanelDescription });
                }
              }}
              className="w-full px-3 py-1 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Description shown in the side panel"
            />
          </div>

          {!isConditionNode && (
           <div className="py-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Map Description
              </label>
              <MapDescriptionInput
                value={localMapDescription}
                onChange={setLocalMapDescription}
                onBlur={() => {
                  if (localMapDescription !== (node.mapDescription || template.description)) {
                    onUpdate({ mapDescription: localMapDescription });
                  }
                }}
                uiElements={currentElements}
              />
            </div>
          )}

          {/* Tab Bar for switching between Configuration, Advanced, User Interface */}
          <div className="flex bg-[#F5F7FA] rounded-xl p-0.5 w-full max-w-full mb-4">
            {allTabs.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  `flex-1 py-2 text-[12px] font-semibold focus:outline-none transition-all duration-150 ` +
                  (activeTab === tab
                    ? 'bg-white shadow text-slate-700 z-10 ' +
                      (idx === 0 ? 'rounded-l-xl' : '') +
                      (idx === allTabs.length - 1 ? ' rounded-r-xl' : '')
                    : 'bg-transparent text-slate-500 hover:text-slate-700 ' +
                      (idx === 0 ? 'rounded-l-xl' : '') +
                      (idx === allTabs.length - 1 ? ' rounded-r-xl' : ''))
                }
                style={{ minWidth: 0 }}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Side Panel Elements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-slate-700">Side Panel Elements</h5>
              <button
                onClick={addUIElement}
                className="flex items-center space-x-1 px-3 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add UI Element</span>
              </button>
            </div>
            {filteredElements.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-[#8C95A8] rounded-lg">
                <Settings className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No elements in this tab yet.</p>
                <p className="text-xs text-slate-500">Click "Add" to create your first element</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredElements.map((element) => (
                  <WorkflowUIElementEditor
                    key={element.id}
                    element={element}
                    onUpdate={updateUIElement}
                    onRemove={removeUIElement}
                    tabSelector
                    onTabChange={tab => updateUIElement(element.id, { tab })}
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
            key={node.id}
            elements={currentElements}
            values={node.metadata || {}}
            onChange={(values) => {
              // Intercept branch deletion signal and pass it up
              if (values.__deleteNodesInBranches) {
                onUpdate({ metadata: values });
              } else {
                onUpdate({ metadata: values });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

interface MapDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  uiElements: UIElement[];
}

function MapDescriptionInput({ value, onChange, onBlur, uiElements }: MapDescriptionInputProps) {
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
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 border border-slate-300 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  tabSelector?: boolean;
  onTabChange?: (tab: 'Configuration' | 'Advanced' | 'User Interface') => void;
}

function WorkflowUIElementEditor({ element, onUpdate, onRemove, tabSelector, onTabChange }: WorkflowUIElementEditorProps) {
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

  // --- Conditions Module Options Editor (for editing mode in side panel) ---
  // Helper to generate a unique value from label
  function generateUniqueValue(label: string, existing: string[], base?: string): string {
    let val = (base || label).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let unique = val;
    let i = 1;
    while (existing.includes(unique)) {
      unique = val + '_' + i;
      i++;
    }
    return unique;
  }

  const handleAddPropertyOption = () => {
    const current = element.propertyOptions || [];
    onUpdate(element.id, { propertyOptions: [...current, { label: '', value: '', values: ['', ''] }] });
  };
  const handleUpdatePropertyOption = (idx: number, updates: Partial<{ label: string; value: string; values: string[] }>) => {
    const current = element.propertyOptions || [];
    const updated = current.map((opt, i) => {
      if (i !== idx) return opt;
      let newLabel = updates.label !== undefined ? updates.label : opt.label;
      let newValue = opt.value;
      if (updates.label !== undefined) {
        // Regenerate value from label
        const existing = current.filter((_, j) => j !== idx).map(o => o.value);
        newValue = generateUniqueValue(updates.label, existing);
      }
      return { ...opt, ...updates, label: newLabel, value: newValue };
    });
    onUpdate(element.id, { propertyOptions: updated });
  };
  const handleRemovePropertyOption = (idx: number) => {
    const current = element.propertyOptions || [];
    onUpdate(element.id, { propertyOptions: current.filter((_, i) => i !== idx) });
  };
  const handleUpdatePropertyOptionValue = (propIdx: number, valueIdx: number, newValue: string) => {
    const current = element.propertyOptions || [];
    const prop = current[propIdx];
    const newValues = [...(prop.values || [])];
    newValues[valueIdx] = newValue;
    handleUpdatePropertyOption(propIdx, { values: newValues });
  };
  const handleAddPropertyOptionValue = (propIdx: number) => {
    const current = element.propertyOptions || [];
    const prop = current[propIdx];
    const newValues = [...(prop.values || []), ''];
    handleUpdatePropertyOption(propIdx, { values: newValues });
  };
  const handleRemovePropertyOptionValue = (propIdx: number, valueIdx: number) => {
    const current = element.propertyOptions || [];
    const prop = current[propIdx];
    const newValues = (prop.values || []).filter((_, i) => i !== valueIdx);
    handleUpdatePropertyOption(propIdx, { values: newValues });
  };
  // Operator options
  const handleAddOperatorOption = () => {
    const current = element.operatorOptions || [];
    onUpdate(element.id, { operatorOptions: [...current, { label: '', value: '' }] });
  };
  const handleUpdateOperatorOption = (idx: number, updates: Partial<{ label: string; value: string }>) => {
    const current = element.operatorOptions || [];
    const updated = current.map((opt, i) => {
      if (i !== idx) return opt;
      let newLabel = updates.label !== undefined ? updates.label : opt.label;
      let newValue = opt.value;
      if (updates.label !== undefined) {
        // Regenerate value from label
        const existing = current.filter((_, j) => j !== idx).map(o => o.value);
        newValue = generateUniqueValue(updates.label, existing);
      }
      return { ...opt, ...updates, label: newLabel, value: newValue };
    });
    onUpdate(element.id, { operatorOptions: updated });
  };
  const handleRemoveOperatorOption = (idx: number) => {
    const current = element.operatorOptions || [];
    onUpdate(element.id, { operatorOptions: current.filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
      {/* Tab Selector Dropdown */}
      {/* {tabSelector && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Tab</label>
          <select
            value={element.tab || 'Configuration'}
            onChange={e => {
              const tab = e.target.value as 'Configuration' | 'Advanced' | 'User Interface';
              if (onTabChange) onTabChange(tab);
              else onUpdate(element.id, { tab });
            }}
            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Configuration">Configuration</option>
            <option value="Advanced">Advanced</option>
            <option value="User Interface">User Interface</option>
          </select>
        </div>
      )} */}
      <div className="flex items-center justify-between mb-3">
        <UIElementTypeDropdown
          value={element.type}
          onChange={(newType) => {
            const castType = newType as UIElement['type'];
            if (castType === 'events-module' && (!element.events || element.events.length === 0)) {
              onUpdate(element.id, {
                type: castType,
                events: [
                  { title: 'The Dream Career Conference', subtitle: 'High Volume Hiring', tag: 'Upcoming' },
                  { title: 'Technical Professionals Meetup', subtitle: 'High Volume Hiring', tag: 'Upcoming' },
                  { title: 'How Phenom keeps employees happy', subtitle: 'High Volume Hiring', tag: 'Upcoming' }
                ],
                label: ''
              });
            } else {
              onUpdate(element.id, { type: castType });
            }
          }}
          disabled={false}
        />
        <div className="flex items-center space-x-1">
          {/* Move up/down buttons (optional, for future parity) */}
        </div>
        <button
          onClick={() => onRemove(element.id)}
          className="p-1 text-red-600 hover:text-red-700 transition-colors"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Now, for each field, match the logic and classes from ActivityConfigurator's UIElementEditor. */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {element.type === 'text-block' ? (
          <div className="col-span-2 mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Text Content</label>
            <textarea
              value={element.text || element.label}
              onChange={e => onUpdate(element.id, { text: e.target.value, label: e.target.value })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter text content..."
            />
          </div>
        ) : element.type !== 'section-divider' && element.type !== 'screening-questions' && element.type !== 'conditions-module' && element.type !== 'events-module' && (
          // Remove label and placeholder for trigger-conditions-module
          element.type === 'trigger-conditions-module' ? null :
          // Add label input for file-upload
          element.type === 'file-upload' ? (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
              <input
                type="text"
                value={element.label}
                onChange={e => onUpdate(element.id, { label: e.target.value })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div className={element.type === 'toggle' ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
              <input
                type="text"
                value={element.label}
                onChange={e => onUpdate(element.id, { label: e.target.value })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )
        )}
        {/* Placeholder for text, textarea, dropdown, number */}
        {(element.type === 'text' || element.type === 'textarea' || element.type === 'dropdown' || element.type === 'number') && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Placeholder</label>
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={e => onUpdate(element.id, { placeholder: e.target.value })}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Placeholder"
            />
          </div>
        )}
        {/* Default value, min, max, step for number */}
        {element.type === 'number' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Default Value</label>
              <input
                type="number"
                value={element.defaultValue !== undefined && element.defaultValue !== null ? String(element.defaultValue) : ''}
                onChange={e => onUpdate(element.id, { defaultValue: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Default value"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min</label>
              <input
                type="number"
                value={element.min !== undefined && element.min !== null ? String(element.min) : ''}
                onChange={e => onUpdate(element.id, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max</label>
              <input
                type="number"
                value={element.max !== undefined && element.max !== null ? String(element.max) : ''}
                onChange={e => onUpdate(element.id, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Step</label>
              <input
                type="number"
                value={element.step !== undefined && element.step !== null ? String(element.step) : ''}
                onChange={e => onUpdate(element.id, { step: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Step"
              />
            </div>
          </>
        )}
        {/* Default value, min, max, step for date */}
        {element.type === 'date' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Default Value</label>
              <input
                type="date"
                value={element.defaultValue !== undefined && element.defaultValue !== null ? String(element.defaultValue) : ''}
                onChange={e => onUpdate(element.id, { defaultValue: e.target.value })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Default value"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Min</label>
              <input
                type="date"
                value={element.min !== undefined && element.min !== null ? String(element.min) : ''}
                onChange={e => onUpdate(element.id, { min: e.target.value })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max</label>
              <input
                type="date"
                value={element.max !== undefined && element.max !== null ? String(element.max) : ''}
                onChange={e => onUpdate(element.id, { max: e.target.value })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Step (days)</label>
              <input
                type="number"
                value={element.step !== undefined && element.step !== null ? String(element.step) : ''}
                onChange={e => onUpdate(element.id, { step: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Step (days)"
              />
            </div>
          </>
        )}
      </div>
      {/* Default text for text and textarea */}
      {['text', 'textarea'].includes(element.type) && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Default Text</label>
          <input
            type="text"
            value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
            onChange={e => onUpdate(element.id, { defaultValue: e.target.value })}
            className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional default text"
          />
        </div>
      )}
      {/* Half-size input checkbox for text, dropdown, date, number */}
      {['text', 'dropdown', 'date', 'number'].includes(element.type) && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id={`half-size-${element.id}`}
            checked={element.halfSize || false}
            onChange={e => onUpdate(element.id, { halfSize: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor={`half-size-${element.id}`} className="text-xs text-slate-600">
            Half-size input
          </label>
        </div>
      )}
      {/* Is disabled for text input only */}
      {element.type === 'text' && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id={`disabled-${element.id}`}
            checked={!!element.disabled}
            onChange={e => onUpdate(element.id, { disabled: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor={`disabled-${element.id}`} className="text-xs text-slate-600">
            Is disabled
          </label>
        </div>
      )}
      {/* Has follow-up elements for dropdown, radio, checkbox, toggle */}
      {(element.type === 'dropdown' || element.type === 'radio' || element.type === 'checkbox' || element.type === 'toggle') && (
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            id={`has-followup-${element.id}`}
            checked={!!element.hasConditionalFollowUps}
            onChange={e => onUpdate(element.id, { hasConditionalFollowUps: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor={`has-followup-${element.id}`} className="text-xs text-slate-600">
            Has follow-up elements
          </label>
        </div>
      )}
      {/* Conditional follow-up elements for dropdown, radio, checkbox, toggle (functional) */}
      {(element.type === 'dropdown' || element.type === 'radio' || element.type === 'checkbox' || element.type === 'toggle') && element.hasConditionalFollowUps && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-slate-600">Follow-up Elements</label>
            <button
              type="button"
              onClick={addConditionalFollowUp}
              className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Follow-up</span>
            </button>
          </div>
          {(element.conditionalFollowUps || []).map((followUp, followUpIndex) => (
            <div key={followUpIndex} className="mb-2 p-2 border border-slate-200 rounded bg-white">
              <div className="flex items-center mb-2">
                <label className="block text-xs font-medium text-slate-600 mr-2">For option:</label>
                {(element.type === 'checkbox' || element.type === 'toggle') ? (
                  <select
                    value={followUp.conditionValue === true ? 'true' : 'false'}
                    onChange={e => updateConditionalFollowUp(followUpIndex, { conditionValue: e.target.value === 'true' })}
                    className="px-2 py-1 border border-[#8C95A8] rounded-[10px] text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Checked</option>
                    <option value="false">Unchecked</option>
                  </select>
                ) : (
                  <select
                    value={followUp.conditionValue as string}
                    onChange={e => updateConditionalFollowUp(followUpIndex, { conditionValue: e.target.value })}
                    className="px-2 py-1 border border-[#8C95A8] rounded-[10px] text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select option...</option>
                    {element.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => removeConditionalFollowUp(followUpIndex)}
                  className="ml-2 p-1 text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Nested follow-up elements */}
              <div className="ml-4">
                {(followUp.elements || []).map((el, idx) => (
                  <WorkflowUIElementEditor
                    key={el.id}
                    element={el}
                    onUpdate={(id, updates) => updateElementInConditionalFollowUp(followUpIndex, id, updates)}
                    onRemove={id => removeElementFromConditionalFollowUp(followUpIndex, id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addElementToConditionalFollowUp(followUpIndex)}
                  className="mt-2 px-2 py-1 bg-[#4D3EE0] text-white rounded text-xs hover:bg-[#2927B2]"
                >
                  + Add Follow-up Field
                </button>
              </div>
            </div>
          ))}
          {(element.conditionalFollowUps || []).length === 0 && (
            <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
              No follow-up elements added yet.
            </div>
          )}
        </div>
      )}
      {/* Dropdown options, default, and multiselect */}
      {element.type === 'dropdown' && (
        <div className="col-span-2 mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-slate-600">Options</label>
            <button
              type="button"
              onClick={() => onUpdate(element.id, { options: [...(element.options || []), ''] })}
              className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {(element.options || []).map((option, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={option}
                  onChange={e => {
                    const newOptions = [...(element.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdate(element.id, { options: newOptions });
                  }}
                  className="w-full pr-8 px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = (element.options || []).filter((_, i) => i !== index);
                    onUpdate(element.id, { options: newOptions });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label="Remove option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!element.options || element.options.length === 0) && (
              <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                No options added yet. Click "Add" to create your first option.
              </div>
            )}
          </div>
          {/* Default option selector */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Default Selected Option</label>
            <select
              value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
              onChange={e => onUpdate(element.id, { defaultValue: e.target.value || undefined })}
              disabled={!element.options || element.options.length === 0}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {element.options && element.options.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* Multiselect checkbox */}
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id={`multiselect-${element.id}`}
              checked={element.multiselect || false}
              onChange={e => onUpdate(element.id, { multiselect: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor={`multiselect-${element.id}`} className="text-xs text-slate-600">
              Allow multiple selections
            </label>
          </div>
        </div>
      )}
      {/* Checkbox options editor */}
      {element.type === 'checkbox' && (
        <div className="col-span-2 mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-slate-600">Options</label>
            <button
              type="button"
              onClick={() => onUpdate(element.id, { options: [...(element.options || []), ''] })}
              className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {(element.options || []).map((option, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={option}
                  onChange={e => {
                    const newOptions = [...(element.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdate(element.id, { options: newOptions });
                  }}
                  className="w-full pr-8 px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = (element.options || []).filter((_, i) => i !== index);
                    onUpdate(element.id, { options: newOptions });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label="Remove option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!element.options || element.options.length === 0) && (
              <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                No options added yet. Click "Add" to create your first option.
              </div>
            )}
          </div>
        </div>
      )}
      {/* Radio options editor and default */}
      {element.type === 'radio' && (
        <div className="col-span-2 mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-slate-600">Options</label>
            <button
              type="button"
              onClick={() => onUpdate(element.id, { options: [...(element.options || []), ''] })}
              className="flex items-center space-x-1 px-2 py-1 bg-[#4D3EE0] text-white rounded-lg text-xs hover:bg-[#2927B2] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {(element.options || []).map((option, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={option}
                  onChange={e => {
                    const newOptions = [...(element.options || [])];
                    newOptions[index] = e.target.value;
                    onUpdate(element.id, { options: newOptions });
                  }}
                  className="w-full pr-8 px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = (element.options || []).filter((_, i) => i !== index);
                    onUpdate(element.id, { options: newOptions });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label="Remove option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!element.options || element.options.length === 0) && (
              <div className="text-center py-3 border-2 border-dashed border-slate-300 rounded text-xs text-slate-500">
                No options added yet. Click "Add" to create your first option.
              </div>
            )}
          </div>
          {/* Default option selector */}
          <div className="mt-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Default Selected Option</label>
            <select
              value={typeof element.defaultValue === 'string' ? element.defaultValue : ''}
              onChange={e => onUpdate(element.id, { defaultValue: e.target.value || undefined })}
              disabled={!element.options || element.options.length === 0}
              className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              {element.options && element.options.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {/* Section Divider title input */}
      {element.type === 'section-divider' && (
        <div className="col-span-2 mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Section Title</label>
          <input
            type="text"
            value={element.text || element.label}
            onChange={e => onUpdate(element.id, { text: e.target.value, label: e.target.value })}
            className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Section title (optional)"
          />
          <div className="text-xs text-slate-500 mt-1">Leave empty if you just want a divider line</div>
        </div>
      )}
      {/* Button full editing UI: Has title, Has icon, Adds elements, and corresponding inputs */}
      {element.type === 'button' && (
        <div className="col-span-2 mb-3 space-y-3">
          {/* Has title checkbox */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`has-title-${element.id}`}
              checked={!!element.hasTitle}
              onChange={e => onUpdate(element.id, { hasTitle: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor={`has-title-${element.id}`} className="text-xs text-slate-600">
              Has title
            </label>
          </div>
          {/* Title input */}
          {element.hasTitle && (
            <div className="mb-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
              <input
                type="text"
                value={element.title || ''}
                onChange={e => onUpdate(element.id, { title: e.target.value })}
                className="w-full px-2 py-1 border border-[#8C95A8] rounded-[10px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Button title"
              />
            </div>
          )}
          {/* Has icon checkbox */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`has-icon-${element.id}`}
              checked={!!element.hasIcon}
              onChange={e => onUpdate(element.id, { hasIcon: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor={`has-icon-${element.id}`} className="text-xs text-slate-600">
              Has icon
            </label>
          </div>
          {/* Icon selection and position */}
          {element.hasIcon && (
            <div className="space-y-3 ml-4 rounded-lg">
              <div>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_ICONS.map((iconOption) => {
                    const IconComponent = iconOption.component;
                    const isSelected = element.icon === iconOption.name;
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => onUpdate(element.id, { icon: normalizeIconName(iconOption.name) })}
                        className={`p-1 rounded border bg-white transition-all duration-200 ${
                          isSelected
                            ? 'border-[#4D3EE0] bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mx-auto" style={{ color: '#4D3EE0' }} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Icon Position</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => onUpdate(element.id, { iconPosition: 'left' })}
                    className={`px-3 py-1 rounded-md text-xs transition-colors ${
                      (element.iconPosition || 'left') === 'left'
                        ? 'bg-blue-50 text-slate-800 border border-[#4D3EE0]'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate(element.id, { iconPosition: 'right' })}
                    className={`px-3 py-1 rounded-md text-xs transition-colors ${
                      element.iconPosition === 'right'
                        ? 'bg-blue-50 text-slate-800 border border-[#4D3EE0]'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Adds elements checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`adds-elements-${element.id}`}
              checked={!!element.addsElements}
              onChange={e => onUpdate(element.id, { addsElements: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor={`adds-elements-${element.id}`} className="text-xs text-slate-600">
              Adds elements
            </label>
          </div>
          {/* Add New Elements checkbox (only if addsElements is checked) */}
          {element.addsElements && (
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id={`add-new-elements-${element.id}`}
                checked={!!element.addNewElements}
                onChange={e => onUpdate(element.id, { addNewElements: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor={`add-new-elements-${element.id}`} className="text-xs text-slate-600">
                Add new elements
              </label>
            </div>
          )}
          {/* Configure added elements or reference input */}
          {element.addsElements && element.addNewElements && (
            <div className="ml-4 p-3 bg-white rounded border">
              <label className="block text-xs font-medium text-slate-600 mb-2">Elements to Add (appear above button)</label>
              <div className="space-y-2">
                {(element.addedElements || []).map((addedEl, idx) => (
                  <WorkflowUIElementEditor
                    key={addedEl.id}
                    element={addedEl}
                    onUpdate={(id, updates) => {
                      const newAdded = [...(element.addedElements || [])];
                      newAdded[idx] = { ...addedEl, ...updates };
                      onUpdate(element.id, { addedElements: newAdded });
                    }}
                    onRemove={id => {
                      const newAdded = [...(element.addedElements || [])];
                      newAdded.splice(idx, 1);
                      onUpdate(element.id, { addedElements: newAdded });
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newAdded = [
                      ...((element.addedElements as any[]) || []),
                      {
                        id: Date.now().toString(),
                        type: 'dropdown',
                        label: 'New Dropdown',
                        required: false,
                        options: ['Option 1', 'Option 2'],
                        tab: element.tab
                      }
                    ];
                    onUpdate(element.id, { addedElements: newAdded });
                  }}
                  className="text-xs text-blue-700 hover:underline mt-2"
                >
                  + Add Element
                </button>
              </div>
            </div>
          )}
          {element.addsElements && !element.addNewElements && (
            <div className="ml-4 p-3 bg-white rounded border">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Element Reference
              </label>
              <input
                type="text"
                value={element.elementReference || ''}
                onChange={e => onUpdate(element.id, { elementReference: e.target.value })}
                className="w-full px-3 py-2 border border-[#8C95A8] rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type # to reference elements (e.g., #{Questionnaire})"
              />
              <div className="mt-1 text-xs text-slate-500">
                Type <code className="bg-slate-100 px-1 rounded">#</code> to reference existing elements or create new ones.
              </div>
            </div>
          )}
        </div>
      )}
      {/* Events Module Editor */}
      {element.type === 'events-module' && (
        <div className="col-span-2 mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Events</label>
          <div className="space-y-3">
            {(element.events || []).map((event, idx) => (
              <div key={idx} className="border rounded-lg p-3 bg-slate-50 flex flex-col gap-2 relative">
                <button
                  type="button"
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1"
                  onClick={() => {
                    const newEvents = [...(element.events || [])];
                    newEvents.splice(idx, 1);
                    onUpdate(element.id, { events: newEvents });
                  }}
                  tabIndex={-1}
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-[#8C95A8] rounded text-sm mb-1"
                  placeholder="Event title"
                  value={event.title}
                  onChange={e => {
                    const newEvents = [...(element.events || [])];
                    newEvents[idx] = { ...event, title: e.target.value };
                    onUpdate(element.id, { events: newEvents });
                  }}
                />
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-[#8C95A8] rounded text-sm mb-1"
                  placeholder="Event subtitle"
                  value={event.subtitle}
                  onChange={e => {
                    const newEvents = [...(element.events || [])];
                    newEvents[idx] = { ...event, subtitle: e.target.value };
                    onUpdate(element.id, { events: newEvents });
                  }}
                />
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-[#8C95A8] rounded text-sm"
                  placeholder="Event tag"
                  value={event.tag}
                  onChange={e => {
                    const newEvents = [...(element.events || [])];
                    newEvents[idx] = { ...event, tag: e.target.value };
                    onUpdate(element.id, { events: newEvents });
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              onClick={() => {
                const newEvents = [...(element.events || []), { title: '', subtitle: '', tag: '' }];
                onUpdate(element.id, { events: newEvents });
              }}
            >
              + Add Event
            </button>
          </div>
        </div>
      )}
      {/* Conditions Module property/operator options editor (editing mode) */}
      {element.type === 'conditions-module' && (
        <div className="mb-4">
          <div className="mb-2 font-semibold text-xs text-slate-700">Property Options</div>
          <div className="space-y-4 mb-2">
            {(element.propertyOptions || []).map((opt, idx) => (
              <div key={idx} className="flex flex-col gap-1 border border-slate-200 rounded p-2 bg-slate-50">
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    className="px-3 py-2 border border-slate-400  rounded-lg text-xs w-full pr-8"
                    placeholder="Label"
                    value={opt.label}
                    onChange={e => handleUpdatePropertyOption(idx, { label: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500"
                    onClick={() => handleRemovePropertyOption(idx)}
                    tabIndex={-1}
                    aria-label="Remove property option"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="ml-0 mt-1">
                  <div className="text-[10px] text-slate-500 mb-1">Possible Values</div>
                  <div className="flex flex-col gap-1 items-start w-full">
                    {(opt.values || []).map((val, vIdx) => (
                      <div key={vIdx} className="relative flex items-center w-full">
                        <input
                          type="text"
                          className="px-3 py-2 border border-slate-400  rounded-lg text-xs w-full pr-8"
                          placeholder={`Value ${vIdx + 1}`}
                          value={val}
                          onChange={e => handleUpdatePropertyOptionValue(idx, vIdx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500"
                          onClick={() => handleRemovePropertyOptionValue(idx, vIdx)}
                          tabIndex={-1}
                          aria-label="Remove value"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
                      onClick={() => handleAddPropertyOptionValue(idx)}
                    >
                      + Add Value
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
              onClick={handleAddPropertyOption}
            >
              + Add Property Option
            </button>
          </div>
          <div className="mb-2 font-semibold text-xs text-slate-700">Operator Options</div>
          <div className="space-y-2 mb-2">
            {(element.operatorOptions || []).map((opt, idx) => (
              <div key={idx} className="relative flex items-center w-full">
                <input
                  type="text"
                  className="px-3 py-2 border border-slate-400  rounded-lg text-xs w-full pr-8"
                  placeholder="Label"
                  value={opt.label}
                  onChange={e => handleUpdateOperatorOption(idx, { label: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-red-500"
                  onClick={() => handleRemoveOperatorOption(idx)}
                  tabIndex={-1}
                  aria-label="Remove operator option"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-[#2927B2] font-medium hover:text-[#1C1876]"
              onClick={handleAddOperatorOption}
            >
              + Add Operator Option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActivityDropdownProps {
  position: { left: number; top: number };
  activities: ActivityTemplate[];
  onSelect: (activity: ActivityTemplate) => void;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
}

function ActivityDropdown({ position, activities, onSelect, onClose, searchTerm, setSearchTerm }: ActivityDropdownProps): JSX.Element {
  const dropdownRef = useReactRef<HTMLDivElement>(null);
  // Close on outside click
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);
  // Filter out triggers
  const filteredActivities = activities.filter((a: ActivityTemplate) =>
    !(a.name.toLowerCase().includes('trigger') || a.icon === 'Zap')
  );
  // Group activities by category
  const grouped = filteredActivities.reduce((acc: Record<string, ActivityTemplate[]>, act: ActivityTemplate) => {
    if (!acc[act.category]) acc[act.category] = [];
    acc[act.category].push(act);
    return acc;
  }, {} as Record<string, ActivityTemplate[]>);
  // Filter by search
  const filtered = Object.entries(grouped).reduce((acc: Record<string, ActivityTemplate[]>, [cat, acts]) => {
    const filteredActs = (acts as ActivityTemplate[]).filter((a: ActivityTemplate) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filteredActs.length) acc[cat] = filteredActs;
    return acc;
  }, {} as Record<string, ActivityTemplate[]>);
  return (
    <div
      ref={dropdownRef}
      className="z-[9999] fixed"
      style={{ left: position.left, top: position.top, width: 264, maxWidth: '90vw' }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 pt-2" style={{ minWidth: 260 }}>
        <div className="flex items-center mb-2 px-1">
          
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-2 py-1 ml-1 mr-1 text-sm border border-slate-200 rounded-[10px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ minWidth: 0 }}
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {Object.entries(filtered).length === 0 && (
            <div className="text-xs text-slate-500 px-2 py-6 text-center">No activities found</div>
          )}
          {Object.entries(filtered)
            .sort(([a,], [b,]) => {
              const aLower = a.toLowerCase();
              const bLower = b.toLowerCase();
              if (aLower === 'workflow') return -1;
              if (bLower === 'workflow') return 1;
              return 0;
            })
            .map(([category, acts]) => (
              <div key={category} className="mb-1">
                <div className="text-[10px] font-semibold text-[#8C95A8] uppercase tracking-wider px-3 py-1 bg-[#F5F7FA] rounded mb-1">{category}</div>
                <div className="flex flex-col gap-0">
                  {(acts as ActivityTemplate[]).map(activity => {
                    const IconComponent = AVAILABLE_ICONS.find(i => i.name === activity.icon)?.component || Settings;
                    const iconColor = ICON_COLORS.find(c => c.value === (activity.iconColor || 'purple')) || ICON_COLORS[0];
                    // Check if this is the Condition activity
                    const isCondition = activity.name.toLowerCase() === 'condition' || activity.icon === 'Split';
                    return (
                      <button
                        key={activity.id}
                        onClick={() => { onSelect(activity); onClose(); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F5F7FA] transition-all text-left"
                        style={{ minHeight: 36 }}
                      >
                        <div className="w-6 h-6 rounded-[8px] flex items-center justify-center" style={{ backgroundColor: iconColor.bg }}>
                          <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor, ...(isCondition ? { transform: 'rotate(90deg)' } : {}) }} />
                        </div>
                        <span className="font-medium text-[#353B46] text-xs">{activity.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}