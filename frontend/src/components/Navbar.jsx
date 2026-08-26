import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const { user } = useApp();
  const location = useLocation();

  if (!user) return null;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'System Dashboard';
      case '/projects': return 'Project Workspace';
      case '/tasks': return 'Task Workspace';
      case '/employees': return 'Employee Directory';
      case '/departments': return 'Departments & Structure';
      case '/reports': return 'Reports & Analytics';
      case '/profile': return 'My Profile Settings';
      default: return 'WorkFlow Pro';
    }
  };

  return (
    <header className="top-navbar">
      <h2 className="page-title">{getPageTitle()}</h2>
      <div className="profile-dropdown-container">
        <div className="user-details" style={{ textAlign: 'right' }}>
          <span className="user-name">
            {user.employee_profile 
              ? `${user.employee_profile.first_name} ${user.employee_profile.last_name}` 
              : user.username}
          </span>
          <span className="user-role">
            {user.employee_profile?.job_title || (user.role === 'admin' ? 'System Administrator' : 'Employee')}
          </span>
        </div>
        <div className="avatar-circle">
          {user.username.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
