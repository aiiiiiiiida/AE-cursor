import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ArrowLeftToLine, Check, Mail, Globe, Database, FileText, Calendar, Users, Zap, Clock, CheckCircle, AlertCircle, Split, Image, Hourglass, User, MessageCircle, Tag, ListChecks, Video, ExternalLink, GitBranch, Star, Sparkle, UserRoundPlus, Plus, Settings, Search, ArrowUp } from 'lucide-react';
import { sendMessageToOpenAI } from '../lib/openai';
import { useApp } from '../context/AppContext';
import { ActivityTemplate, Workflow } from '../types';

interface ChatWidgetProps {
    workflowId: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    suggestions?: ActivityTemplate[];
    selectedActivities?: string[];
    suggestionsAdded?: boolean;
}

export function ChatWidget({ workflowId }: ChatWidgetProps) {
  const { state: appState, dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'system-init',
      role: 'system',
      content: 'You are a helpful assistant for building workflows.'
    },
    {
        id: 'assistant-init',
        role: 'assistant',
        content: 'Hello! I can help you build your workflow. Just let me know what activities you’d like to add.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Helper: get all branches in the workflow
  const getAllBranches = (): string[] => {
    const workflow: Workflow | undefined = appState.workflows.find(w => w.id === workflowId);
    if (!workflow) return ['main'];
    const branches = new Set<string>();
    workflow.nodes.forEach(node => {
      const branch = node.metadata?.branch || 'main';
      branches.add(branch);
    });
    return Array.from(branches).sort();
  };

  // Helper: check if workflow has branching
  const hasBranching = (): boolean => {
    const branches = getAllBranches();
    return branches.length > 1 || (branches.length === 1 && branches[0] !== 'main');
  };

  // Helper: check if workflow has condition nodes (which means no main branch)
  const hasConditionNodes = (): boolean => {
    const workflow: Workflow | undefined = appState.workflows.find(w => w.id === workflowId);
    if (!workflow) return false;
    return workflow.nodes.some(node => {
      const activity = appState.activityTemplates.find(a => a.id === node.activityTemplateId);
      return activity?.name.toLowerCase().includes('condition') || 
             activity?.name.toLowerCase().includes('split') ||
             activity?.name.toLowerCase().includes('if');
    });
  };

  // Helper: find the deepest leaf branch in a given branch
  const findDeepestLeafBranch = (startBranch: string): string => {
    const workflow: Workflow | undefined = appState.workflows.find(w => w.id === workflowId);
    if (!workflow) return startBranch;

    // Get all nodes in the start branch
    const branchNodes = workflow.nodes.filter(node => (node.metadata?.branch || 'main') === startBranch);
    
    // Find condition nodes in this branch
    const conditionNodes = branchNodes.filter(node => {
      const activity = appState.activityTemplates.find(a => a.id === node.activityTemplateId);
      return activity?.name.toLowerCase().includes('condition') || 
             activity?.name.toLowerCase().includes('split') ||
             activity?.name.toLowerCase().includes('if');
    });

    // If no condition nodes in this branch, it's a leaf branch
    if (conditionNodes.length === 0) {
      return startBranch;
    }

    // Find the first condition node and get its branches
    const firstConditionNode = conditionNodes[0];
    const conditionBranches = firstConditionNode.metadata?.branches || [];
    
    if (conditionBranches.length === 0) {
      return startBranch;
    }

    // Recursively find the deepest leaf branch in the first sub-branch
    const deepestBranch = findDeepestLeafBranch(conditionBranches[0]);
    console.log(`Deep branch search: ${startBranch} -> ${deepestBranch}`);
    return deepestBranch;
  };

  // Helper: get the target branch for a user message
  const getTargetBranch = (userMsg: string): string => {
    const availableBranches = getAllBranches();
    let branch = parseBranchFromMessage(userMsg, availableBranches);
    
    console.log('=== getTargetBranch ===');
    console.log('User message:', userMsg);
    console.log('Available branches:', availableBranches);
    console.log('Parsed branch:', branch);
    console.log('Has condition nodes:', hasConditionNodes());
    console.log('Has branching:', hasBranching());
    
    if (!branch) {
      // If no branch specified, find the deepest leaf branch
      if (hasConditionNodes()) {
        // Find the first available branch and go deep into it
        const firstBranch = availableBranches[0];
        console.log('No branch specified, has condition nodes, starting from:', firstBranch);
        branch = findDeepestLeafBranch(firstBranch);
      } else if (hasBranching()) {
        const nonMainBranches = availableBranches.filter(b => b !== 'main');
        if (nonMainBranches.length > 0) {
          // Find the deepest leaf branch in the first non-main branch
          console.log('No branch specified, has branching, starting from:', nonMainBranches[0]);
          branch = findDeepestLeafBranch(nonMainBranches[0]);
        } else {
          branch = availableBranches[0];
        }
      } else {
        // No branching, use main branch
        branch = 'main';
      }
    } else {
      // If branch was parsed but doesn't exist, check if it's a valid branch name pattern
      // and create it if it follows the pattern (e.g., "Branch 1.1")
      const branchPattern = /^Branch \d+\.\d+$/;
      if (branchPattern.test(branch) && !availableBranches.includes(branch)) {
        // The branch will be created when nodes are added to it
      }
    }
    
    console.log('Final selected branch:', branch);
    console.log('=== END getTargetBranch ===');
    
    return branch;
  };

  // Helper: parse branch from user message
  const parseBranchFromMessage = (msg: string, availableBranches: string[]): string | null => {
    // Match various branch patterns:
    // - "branch 1.2" or "Branch 1.2"
    // - "to branch 1.2" or "to Branch 1.2"
    // - "add to branch 1.2" or "add to Branch 1.2"
    // - "in branch 1.2" or "in Branch 1.2"
    // - "on branch 1.2" or "on Branch 1.2"
    const patterns = [
      /(?:add\s+)?(?:to\s+|in\s+|on\s+)?branch\s*([\w.\-]+)/i,
      /branch\s*([\w.\-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = msg.match(pattern);
      if (match) {
        const branchName = `Branch ${match[1]}`;
        // Try exact match
        if (availableBranches.includes(branchName)) {
          return branchName;
        }
        // Try case-insensitive match
        const found = availableBranches.find(b => b.toLowerCase() === branchName.toLowerCase());
        if (found) {
          return found;
        }
        // If the branch doesn't exist but follows the pattern, return it anyway
        // (it will be created when nodes are added to it)
        const branchPattern = /^Branch \d+\.\d+$/;
        if (branchPattern.test(branchName)) {
          return branchName;
        }
      }
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { 
        id: `user-${Date.now()}`,
        role: 'user' as const, 
        content: input.trim() 
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    try {
      const relevantActivities = appState.activityTemplates.map(({ id, name, description }) => ({ id, name, description }));
      const botResponse = await sendMessageToOpenAI(newMessages, relevantActivities);
      
      const parsedResponse = JSON.parse(botResponse);
      const { reply, suggestions } = parsedResponse;

      const botMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: reply,
      };

      if (suggestions && suggestions.length > 0) {
        // Always create a new array for suggestions, and reset selection state
        botMessage.suggestions = appState.activityTemplates.filter(a => suggestions.includes(a.id)).map(a => ({ ...a }));
        botMessage.selectedActivities = [];
        botMessage.suggestionsAdded = false;
      }
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = { id: `error-${Date.now()}`, role: 'assistant' as const, content: "Sorry, I couldn't get a response. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddActivitiesToWorkflow = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.selectedActivities || message.selectedActivities.length === 0) return;

    // Find the user message just before this assistant message
    const idx = messages.findIndex(m => m.id === messageId);
    let userMsg = '';
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i].content;
        break;
      }
    }
    
    const branch = getTargetBranch(userMsg);

    dispatch({
      type: 'ADD_NODES',
      payload: {
        workflowId: workflowId,
        activityIds: message.selectedActivities,
        branch: branch
      }
    });

    setMessages(prevMessages => prevMessages.map(m => 
        m.id === messageId ? { ...m, suggestionsAdded: true } : m
    ));
  };

  const handleSelectionChange = (messageId: string, activityId: string, isSelected: boolean) => {
    setMessages(prevMessages => prevMessages.map(m => {
        if (m.id === messageId) {
            const currentSelected = m.selectedActivities || [];
            const newSelected = isSelected
                ? [...currentSelected, activityId]
                : currentSelected.filter(id => id !== activityId);
            return { ...m, selectedActivities: newSelected };
        }
        return m;
    }));
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      {!isOpen ? (
        <button
        onClick={handleToggleChat}
        className="fixed bottom-1/2 translate-y-1/2 left-0 z-50 bg-white text-white w-auto h-auto p-2 rounded-r-lg shadow-lg flex flex-col items-center justify-center hover:bg-slate-100 transition-colors"
        aria-label="Open Chat"
      >
        <img src="/agent-avatar.png" alt="Chat" className="w-8 h-8 mb-1" />
        <h3 className="font-semibold text-xs text-[#2927B2]">AI</h3>
      </button>
      
       ) : (
         <div className="fixed top-[73px] left-0 z-50 w-[360px] h-[calc(100vh-73px)] bg-white shadow-2xl flex flex-col border-r border-b border-slate-200">
           {/* Header */}
           <div className="flex items-center justify-between px-4 py-3   border-b border-slate-200">
             <div className="flex items-center space-x-2">
            <img src="/agent-avatar.png" alt="Chat" className="w-8 h-8" />
              <h3 className="font-semibold text-xs text-[#2927B2]">AI ASSISTANT</h3>
             </div>
             <button
               onClick={handleToggleChat}
               className="p-1 text-slate-600 hover:text-gray-800 rounded-full"
             >
              <ArrowLeftToLine className="w-5 h-5" />
             </button>
           </div>
     
           {/* Messages */}
           <div className="flex-1 p-4 overflow-y-auto">
             <div className="space-y-4">
               {messages.filter(m => m.role !== 'system').map((msg) => (
                 <React.Fragment key={msg.id}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-[#4D3EE0] text-white rounded-br-none' 
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}>
                        {msg.content.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
                      </div>
                    </div>

                    {msg.suggestions && (
                        <div className="bg-[#F4F6FA] p-3 rounded-xl">
                            <h4 className="font-medium text-sm mb-2 text-slate-700">Recommended activities</h4>
                            <div className="space-y-2">
                                {msg.suggestions.map(activity => {
                                    const isSelected = msg.selectedActivities?.includes(activity.id);
                                    const IconComponent = getIconComponent(activity.icon);
                                    const iconColor = getIconColor(activity.iconColor || 'purple');

                                    return (
                                        <label 
                                            key={activity.id} 
                                            className={`flex items-center bg-white justify-between pt-2 pb-2 pl-2 pr-3 rounded-xl border transition-all ${
                                                msg.suggestionsAdded 
                                                    ? 'cursor-default border-[#D1D5DC]'
                                                    : `cursor-pointer ${isSelected ? 'bg-white border-2 border-[#4D3EE0]' : 'bg-white border-1 border-slate-200 hover:border-slate-300'}`
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: iconColor.bg }}>
                                                    <IconComponent className="w-4 h-4" style={{ color: iconColor.iconColor }} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-800">{activity.name}</span>
                                            </div>

                                            <div className={`w-5 h-5 flex items-center justify-center rounded-md border ${
                                                isSelected 
                                                    ? msg.suggestionsAdded ? 'bg-[#AEB5C2] border-[#AEB5C2]' : 'bg-[#4D3EE0] border-[#4D3EE0]'
                                                    : msg.suggestionsAdded ? 'border-[#D1D5DC]' : 'border-slate-400'
                                            }`}>
                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                            </div>

                                            <input 
                                                type="checkbox"
                                                className="hidden"
                                                checked={!!isSelected}
                                                disabled={msg.suggestionsAdded}
                                                onChange={(e) => {
                                                    handleSelectionChange(msg.id, activity.id, e.target.checked);
                                                }}
                                            />
                                        </label>
                                    )
                                })}
                            </div>
                            <button 
                                onClick={() => handleAddActivitiesToWorkflow(msg.id)}
                                disabled={!msg.selectedActivities || msg.selectedActivities.length === 0 || msg.suggestionsAdded}
                                className="mt-3 px-2.5 py-1.5 bg-[#4D3EE0] text-white rounded-[10px] hover:bg-[#2927B2] disabled:bg-[#E8EAEE] disabled:text-[#8C95A8] disabled:cursor-not-allowed text-sm font-normal"
                            >
                                {msg.suggestionsAdded ? "Added to workflow" : "Add to workflow"}
                            </button>
                            {!msg.suggestionsAdded && msg.selectedActivities && msg.selectedActivities.length > 0 && (
                                <div className="mt-0 text-xs text-slate-500">
                                    {/* Will be added to: {(() => {
                                        const idx = messages.findIndex(m => m.id === msg.id);
                                        let userMsg = '';
                                        for (let i = idx - 1; i >= 0; i--) {
                                            if (messages[i].role === 'user') {
                                                userMsg = messages[i].content;
                                                break;
                                            }
                                        }
                                        return getTargetBranch(userMsg);
                                    })()} */}
                                </div>
                            )}
                        </div>
                    )}
                </React.Fragment>
               ))}
               
               {isLoading && (
                 <div className="flex justify-start">
                   <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-slate-100 text-slate-800 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
    
          {/* Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI..."
                className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || input.trim() === ''}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#4D3EE0] text-white rounded-lg hover:bg-[#2927B2] disabled:bg-[#E8EAEE] disabled:text-[#8C95A8] disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 

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

  const getIconComponent = (iconName: string) => {
    const normalized = normalizeIconName(iconName);
    const icon = AVAILABLE_ICONS.find(i => i.name === normalized);
    return icon ? icon.component : Settings;
  };
  
  const getIconColor = (color: string) => {
    const colorConfig = ICON_COLORS.find(c => c.value === color);
    return colorConfig || ICON_COLORS[0];
  }; 