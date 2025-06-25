import React from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Hide header for workflow builder pages
  const isWorkflowBuilder = location.pathname.startsWith('/workflow/');

  return (
    <div className="min-h-screen bg-white">
      <main className={`${!isWorkflowBuilder ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}`}>
        {children}
      </main>
    </div>
  );
}