import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, Workflow, ActivityTemplate, WorkflowNode, UIElement } from '../types';
import { supabase } from '../lib/supabase';

type AppAction = 
  | { type: 'CREATE_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'SELECT_WORKFLOW'; payload: Workflow }
  | { type: 'CREATE_ACTIVITY_TEMPLATE'; payload: ActivityTemplate }
  | { type: 'UPDATE_ACTIVITY_TEMPLATE'; payload: ActivityTemplate }
  | { type: 'DELETE_ACTIVITY_TEMPLATE'; payload: string }
  | { type: 'SELECT_ACTIVITY_TEMPLATE'; payload: ActivityTemplate }
  | { type: 'ADD_NODE_TO_WORKFLOW'; payload: { workflowId: string; node: Omit<WorkflowNode, 'id'> } }
  | { type: 'UPDATE_NODE_IN_WORKFLOW'; payload: { workflowId: string; nodeId: string; updates: Partial<WorkflowNode> } }
  | { type: 'SELECT_NODE'; payload: WorkflowNode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_DATA'; payload: { workflows: Workflow[]; activityTemplates: ActivityTemplate[] } };

const initialState: AppState = {
  workflows: [],
  activityTemplates: [],
  loading: false,
  error: null
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'LOAD_DATA':
      return { 
        ...state, 
        workflows: action.payload.workflows,
        activityTemplates: action.payload.activityTemplates,
        loading: false 
      };

    case 'CREATE_WORKFLOW':
      return { ...state, workflows: [...state.workflows, action.payload] };

    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(w => 
          w.id === action.payload.id ? { ...action.payload, updatedAt: new Date() } : w
        )
      };

    case 'DELETE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.filter(w => w.id !== action.payload)
      };

    case 'SELECT_WORKFLOW':
      return { ...state, selectedWorkflow: action.payload };

    case 'CREATE_ACTIVITY_TEMPLATE':
      return { ...state, activityTemplates: [...state.activityTemplates, action.payload] };

    case 'UPDATE_ACTIVITY_TEMPLATE':
      return {
        ...state,
        activityTemplates: state.activityTemplates.map(t => 
          t.id === action.payload.id ? { ...action.payload, updatedAt: new Date() } : t
        )
      };

    case 'DELETE_ACTIVITY_TEMPLATE':
      return {
        ...state,
        activityTemplates: state.activityTemplates.filter(t => t.id !== action.payload)
      };

    case 'SELECT_ACTIVITY_TEMPLATE':
      return { ...state, selectedActivityTemplate: action.payload };

    case 'ADD_NODE_TO_WORKFLOW':
      const nodeWithId: WorkflowNode = {
        ...action.payload.node,
        id: Date.now().toString()
      };
      return {
        ...state,
        workflows: state.workflows.map(w => 
          w.id === action.payload.workflowId 
            ? { ...w, nodes: [...w.nodes, nodeWithId], updatedAt: new Date() }
            : w
        )
      };

    case 'UPDATE_NODE_IN_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(w => 
          w.id === action.payload.workflowId 
            ? {
                ...w,
                nodes: w.nodes.map(n => 
                  n.id === action.payload.nodeId ? { ...n, ...action.payload.updates } : n
                ),
                updatedAt: new Date()
              }
            : w
        )
      };

    case 'SELECT_NODE':
      return { ...state, selectedNode: action.payload };

    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  createActivityTemplate: (template: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActivityTemplate>;
  updateActivityTemplate: (template: ActivityTemplate) => Promise<void>;
  deleteActivityTemplate: (id: string) => Promise<void>;
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Workflow>;
  updateWorkflow: (workflow: Workflow) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from Supabase on app start
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Load activity templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('activity_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Load workflows
      const { data: workflowsData, error: workflowsError } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (workflowsError) throw workflowsError;

      // Transform data to match our types
      const activityTemplates: ActivityTemplate[] = (templatesData || []).map(template => ({
        id: template.id,
        name: template.name,
        icon: template.icon,
        iconColor: template.icon_color,
        description: template.description,
        category: template.category || 'Workflow', // Default to 'Workflow' for backward compatibility
        sidePanelDescription: template.side_panel_description,
        sidePanelElements: template.side_panel_elements || [],
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.updated_at)
      }));

      const workflows: Workflow[] = (workflowsData || []).map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodes: workflow.nodes || [],
        connections: workflow.connections || [],
        status: workflow.status,
        triggerMetadata: workflow.trigger_metadata || {},
        createdAt: new Date(workflow.created_at),
        updatedAt: new Date(workflow.updated_at)
      }));

      dispatch({ 
        type: 'LOAD_DATA', 
        payload: { workflows, activityTemplates } 
      });

    } catch (error) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from database' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createActivityTemplate = async (templateData: Omit<ActivityTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const { data, error } = await supabase
        .from('activity_templates')
        .insert([{
          name: templateData.name,
          icon: templateData.icon,
          icon_color: templateData.iconColor,
          description: templateData.description,
          category: templateData.category,
          side_panel_description: templateData.sidePanelDescription,
          side_panel_elements: templateData.sidePanelElements
        }])
        .select()
        .single();

      if (error) throw error;

      // Transform and add to state
      const newTemplate: ActivityTemplate = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        iconColor: data.icon_color,
        description: data.description,
        category: data.category,
        sidePanelDescription: data.side_panel_description,
        sidePanelElements: data.side_panel_elements || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      dispatch({ type: 'CREATE_ACTIVITY_TEMPLATE', payload: newTemplate });
      dispatch({ type: 'SET_LOADING', payload: false });
      return newTemplate;
      
    } catch (error) {
      console.error('Error creating activity template:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to create activity template: ${(error as any).message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error; // Re-throw so the UI can handle it
    }
  };

  const updateActivityTemplate = async (template: ActivityTemplate) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const { error } = await supabase
        .from('activity_templates')
        .update({
          name: template.name,
          icon: template.icon,
          icon_color: template.iconColor,
          description: template.description,
          category: template.category,
          side_panel_description: template.sidePanelDescription,
          side_panel_elements: template.sidePanelElements,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_ACTIVITY_TEMPLATE', payload: template });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      console.error('Error updating activity template:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to update activity template: ${(error as any).message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const deleteActivityTemplate = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const { error } = await supabase
        .from('activity_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_ACTIVITY_TEMPLATE', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      console.error('Error deleting activity template:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to delete activity template: ${(error as any).message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const createWorkflow = async (workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const { data, error } = await supabase
        .from('workflows')
        .insert([{
          name: workflowData.name,
          description: workflowData.description,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          status: workflowData.status,
          trigger_metadata: workflowData.triggerMetadata || {}
        }])
        .select()
        .single();

      if (error) throw error;

      const newWorkflow: Workflow = {
        id: data.id,
        name: data.name,
        description: data.description,
        nodes: data.nodes || [],
        connections: data.connections || [],
        status: data.status,
        triggerMetadata: data.trigger_metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      dispatch({ type: 'CREATE_WORKFLOW', payload: newWorkflow });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return newWorkflow;
      
    } catch (error) {
      console.error('Error creating workflow:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to create workflow: ${(error as any).message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const updateWorkflow = async (workflow: Workflow) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const { error } = await supabase
        .from('workflows')
        .update({
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          connections: workflow.connections,
          status: workflow.status,
          trigger_metadata: workflow.triggerMetadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

      if (error) throw error;

      dispatch({ type: 'UPDATE_WORKFLOW', payload: workflow });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      console.error('Error updating workflow:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to update workflow: ${(error as any).message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_WORKFLOW', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
      
    } catch (error) {
      console.error('Error deleting workflow:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to delete workflow: ${(error as any).message}` });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch,
      createActivityTemplate,
      updateActivityTemplate,
      deleteActivityTemplate,
      createWorkflow,
      updateWorkflow,
      deleteWorkflow
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}