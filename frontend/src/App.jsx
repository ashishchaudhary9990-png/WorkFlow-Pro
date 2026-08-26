import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import TaskList from './pages/TaskList';
import EmployeesList from './pages/EmployeesList';
import DepartmentsList from './pages/DepartmentsList';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

// Route protection wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, token, loading } = useApp();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Verifying credentials...</span>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Toast notification renderer
const ToastsPortal = () => {
  const { toasts } = useApp();
  return (
    <div className="toasts-portal-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-message-card ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const MainAppLayout = () => {
  const { token, user } = useApp();

  // If loading or not authenticated, render routes directly (Login screen)
  if (!token || !user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-wrapper">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectsList />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TaskList />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute adminOnly>
              <EmployeesList />
            </ProtectedRoute>
          } />
          <Route path="/departments" element={
            <ProtectedRoute adminOnly>
              <DepartmentsList />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute adminOnly>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppProvider>
        <MainAppLayout />
        <ToastsPortal />
      </AppProvider>
    </Router>
  );
}

export default App;
