import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { WorkflowsTable } from './components/WorkflowsTable';
import { ActivityConfigurator } from './components/ActivityConfigurator';
import { WorkflowBuilder } from './components/WorkflowBuilder';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<WorkflowsTable />} />
            <Route path="/activities" element={<ActivityConfigurator />} />
            <Route path="/workflow/:workflowId" element={<WorkflowBuilder />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;