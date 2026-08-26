import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  FileText, 
  TrendingUp 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user, showToast } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsData, setProjectsData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await api.dashboard.stats();
        setStats(data);
        
        // Also fetch project list to feed project comparison charts
        const projs = await api.projects.list();
        const formattedProjects = projs.map(p => ({
          name: p.name,
          progress: p.completion_percentage,
          tasksCount: p.task_count
        }));
        setProjectsData(formattedProjects);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Loading Dashboard Metrics...</span>
      </div>
    );
  }

  if (!stats) return null;

  const isAdmin = user.role === 'admin';
  const { summary, recent_activity } = stats;

  // Prepare Task Status Pie chart data
  const pieData = isAdmin ? [
    { name: 'Pending Tasks', value: summary.pending_tasks },
    { name: 'Completed Tasks', value: summary.completed_tasks }
  ] : [
    { name: 'Pending Tasks', value: summary.pending_tasks },
    { name: 'Completed Tasks', value: summary.completed_tasks }
  ];

  return (
    <div className="page-container">
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid var(--bg-tertiary)', borderRadius: 'var(--border-radius)', padding: '30px', position: 'relative', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
          Hello, {user.employee_profile ? `${user.employee_profile.first_name} ${user.employee_profile.last_name}` : user.username}!
        </h2>
        <p style={{ color: '#c7d2fe', fontSize: '15px' }}>
          {isAdmin 
            ? "Here is your organization-wide progress overview and status audits." 
            : "Review your tasks, current project responsibilities, and upcoming deadlines."}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        {isAdmin ? (
          <>
            <div className="metric-card">
              <div className="metric-icon-box indigo">
                <Users size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num">{summary.total_employees}</span>
                <span className="metric-name">Active Employees</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box green">
                <Briefcase size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num">{summary.active_projects}</span>
                <span className="metric-name">Active Projects</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box yellow">
                <CheckSquare size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num">{summary.pending_tasks}</span>
                <span className="metric-name">Pending Tasks</span>
              </div>
            </div>

            <div className="metric-card" style={summary.overdue_tasks > 0 ? { borderColor: 'rgba(239, 68, 68, 0.4)' } : {}}>
              <div className="metric-icon-box red">
                <AlertTriangle size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num" style={summary.overdue_tasks > 0 ? { color: 'var(--danger)' } : {}}>{summary.overdue_tasks}</span>
                <span className="metric-name">Overdue Tasks</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="metric-card">
              <div className="metric-icon-box indigo">
                <Briefcase size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num">{summary.total_projects}</span>
                <span className="metric-name">My Projects</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box yellow">
                <CheckSquare size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num">{summary.pending_tasks}</span>
                <span className="metric-name">Assigned Pending</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box green">
                <CheckSquare size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num">{summary.completed_tasks}</span>
                <span className="metric-name">Assigned Completed</span>
              </div>
            </div>

            <div className="metric-card" style={summary.overdue_tasks > 0 ? { borderColor: 'rgba(239, 68, 68, 0.4)' } : {}}>
              <div className="metric-icon-box red">
                <AlertTriangle size={24} />
              </div>
              <div className="metric-details">
                <span className="metric-num" style={summary.overdue_tasks > 0 ? { color: 'var(--danger)' } : {}}>{summary.overdue_tasks}</span>
                <span className="metric-name">My Overdue Tasks</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="grid-2-col">
        {/* Left Column - Visual Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="dashboard-panel">
            <div className="panel-header-row">
              <span className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} className="logo-accent" />
                Project Progression Status (%)
              </span>
            </div>
            
            <div style={{ width: '100%', height: 260 }}>
              {projectsData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={projectsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232d45" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bg-tertiary)' }} />
                    <Bar dataKey="progress" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Progress %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No projects available to compare.
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-header-row">
              <span className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={20} className="logo-accent" />
                Task Distribution Breakdown
              </span>
            </div>
            <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {summary.pending_tasks + summary.completed_tasks > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bg-tertiary)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No task data available.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Audit Trails Activity Feed */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div className="panel-header-row">
            <span className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} className="logo-accent" />
              Recent Activity Audit
            </span>
          </div>

          <div className="activity-feed">
            {recent_activity && recent_activity.length > 0 ? (
              recent_activity.map((act) => (
                <div key={act.id} className="activity-node">
                  <div className="activity-point" />
                  <div className="activity-content">
                    <span className="activity-title">
                      <strong style={{ color: '#fff' }}>@{act.username}</strong> performed{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{act.action}</span>
                    </span>
                    {act.old_value && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Changed: {act.old_value} &rarr; {act.new_value}
                      </span>
                    )}
                    {!act.old_value && act.new_value && (
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {act.new_value}
                      </span>
                    )}
                    <span className="activity-meta">
                      {new Date(act.created_at + 'Z').toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                No recent activity logs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
