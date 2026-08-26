import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, BarChart4, PieChart as PieIcon, Download } from 'lucide-react';
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

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#4f46e5'
};

const STATUS_COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  in_progress: '#818cf8',
  overdue: '#ef4444'
};

const Reports = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('projects');
  
  // Data State
  const [projectsReport, setProjectsReport] = useState([]);
  const [employeesReport, setEmployeesReport] = useState([]);
  const [tasksReport, setTasksReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [projs, emps, tsks] = await Promise.all([
        api.reports.projects(),
        api.reports.employees(),
        api.reports.tasks()
      ]);
      setProjectsReport(projs);
      setEmployeesReport(emps);
      setTasksReport(tsks);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Compiling Analytical Reports...</span>
      </div>
    );
  }

  // Format charts data
  const priorityChartData = tasksReport ? [
    { name: 'High Priority', value: tasksReport.priorities.high, fill: PRIORITY_COLORS.high },
    { name: 'Medium Priority', value: tasksReport.priorities.medium, fill: PRIORITY_COLORS.medium },
    { name: 'Low Priority', value: tasksReport.priorities.low, fill: PRIORITY_COLORS.low }
  ].filter(d => d.value > 0) : [];

  const statusChartData = tasksReport ? [
    { name: 'Completed', count: tasksReport.overall.completed },
    { name: 'Pending', count: tasksReport.overall.pending },
    { name: 'In Progress', count: tasksReport.overall.in_progress },
    { name: 'Overdue', count: tasksReport.overall.overdue }
  ] : [];

  return (
    <div className="page-container">
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--bg-tertiary)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('projects')}
        >
          Project Summary
        </button>
        <button 
          className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('employees')}
        >
          Employee Productivity
        </button>
        <button 
          className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('tasks')}
        >
          Overall Task Analysis
        </button>
      </div>

      {/* Projects summary Report */}
      {activeTab === 'projects' && (
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-header-row" style={{ marginBottom: 0 }}>
            <span className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} className="logo-accent" />
              Project Status & Task Completions
            </span>
          </div>

          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Timeline</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {projectsReport.map(proj => (
                  <tr key={proj.project_id}>
                    <td style={{ fontWeight: 600 }}>{proj.name}</td>
                    <td>
                      <span className={`status-pill ${proj.status}`}>
                        {proj.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {proj.start_date} &rarr; {proj.end_date}
                    </td>
                    <td>{proj.total_tasks}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{proj.completed_tasks}</td>
                    <td style={proj.overdue_tasks > 0 ? { color: 'var(--danger)', fontWeight: 600 } : {}}>{proj.overdue_tasks}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
                        <div className="progress-bar-container" style={{ flexGrow: 1 }}>
                          <div className="progress-fill-percentage" style={{ width: `${proj.completion_percentage}%` }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{proj.completion_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee load Report */}
      {activeTab === 'employees' && (
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel-header-row" style={{ marginBottom: 0 }}>
            <span className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart4 size={20} className="logo-accent" />
              Employee Productivity Metrics
            </span>
          </div>

          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>Overdue</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {employeesReport.map(emp => (
                  <tr key={emp.employee_id}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td><span className="badge primary">{emp.department}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.job_title || 'N/A'}</td>
                    <td>{emp.total_tasks}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{emp.completed_tasks}</td>
                    <td style={emp.overdue_tasks > 0 ? { color: 'var(--danger)', fontWeight: 600 } : {}}>{emp.overdue_tasks}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
                        <div className="progress-bar-container" style={{ flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="progress-fill-percentage" style={{ width: `${emp.completion_rate}%`, backgroundColor: 'var(--success)' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{emp.completion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task analytics charts */}
      {activeTab === 'tasks' && tasksReport && (
        <div className="grid-2-col">
          {/* Status Chart */}
          <div className="dashboard-panel">
            <h3 className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <BarChart4 size={18} className="logo-accent" /> Task Status Progression
            </h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232d45" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bg-tertiary)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Tasks Count">
                    {statusChartData.map((entry, index) => {
                      const colors = ['#10b981', '#f59e0b', '#818cf8', '#ef4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Chart */}
          <div className="dashboard-panel">
            <h3 className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <PieIcon size={18} className="logo-accent" /> Task Priority Distributions
            </h3>
            <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {priorityChartData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--bg-tertiary)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No tasks found to parse.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
