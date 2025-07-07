export interface ConditionalFollowUp {
  conditionValue: string | boolean;
  elements: UIElement[];
}

export interface UIElement {
  id: string;
  type: 'text' | 'dropdown' | 'radio' | 'checkbox' | 'button' | 'section-divider' | 'text-block' | 'toggle' | 'file-upload' | 'textarea' | 'number' | 'date';
  label: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | boolean | number;
  text?: string; // For text-block and section-divider
  hasConditionalFollowUps?: boolean;
  conditionalFollowUps?: ConditionalFollowUp[];
  multiselect?: boolean; // For dropdown elements
  // Button-specific properties
  hasIcon?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  addsElements?: boolean;
  elementReference?: string; // For referencing elements like #{Questionnaire}
  // Number input specific
  min?: number | string; // string for date type (ISO)
  max?: number | string; // string for date type (ISO)
  step?: number; // for date: days
  halfSize?: boolean;
  tab?: 'Configuration' | 'Advanced' | 'User Interface'; // Optional tab grouping
}

export interface ActivityTemplate {
  id: string;
  name: string;
  icon: string;
  iconColor?: string;
  description: string;
  category: string; // New category field
  sidePanelDescription?: string;
  sidePanelElements: UIElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  activityTemplateId: string;
  position: { x: number; y: number };
  localSidePanelElements?: UIElement[];
  userAssignedName?: string;
  sidePanelDescription?: string;
  mapDescription?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: 'draft' | 'published';
  globalSidePanelElements?: UIElement[];
  triggerMetadata?: Record<string, any>; // Store trigger configuration separately
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  workflows: Workflow[];
  activityTemplates: ActivityTemplate[];
  selectedWorkflow?: Workflow;
  selectedActivityTemplate?: ActivityTemplate;
  selectedNode?: WorkflowNode;
  loading: boolean;
  error: string | null;
}