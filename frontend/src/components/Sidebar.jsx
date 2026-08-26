import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  Building2, 
  FileText, 
  User, 
  LogOut 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const { user, logout } = useApp();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <Briefcase className="logo-accent" size={28} />
        <span className="logo-text">
          WorkFlow<span className="logo-accent">Pro</span>
        </span>
      </div>

      <nav className="nav-menu">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={20} />
          <span>Projects</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>

        {isAdmin && (
          <>
            <NavLink 
              to="/employees" 
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Employees</span>
            </NavLink>

            <NavLink 
              to="/departments" 
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Building2 size={20} />
              <span>Departments</span>
            </NavLink>

            <NavLink 
              to="/reports" 
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
            >
              <FileText size={20} />
              <span>Reports</span>
            </NavLink>
          </>
        )}

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-user">
        <div className="avatar-circle">
          {user.username.substring(0, 2).toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.employee_profile 
              ? `${user.employee_profile.first_name} ${user.employee_profile.last_name.substring(0, 1)}.` 
              : user.username}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.role}</span>
        </div>
        <button 
          onClick={logout} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
