import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  User, 
  AlertCircle, 
  MessageSquare, 
  History, 
  Trash2, 
  Send,
  SlidersHorizontal 
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const TaskList = () => {
  const { user, showToast } = useApp();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [search, setSearch] = useState('');

  // Task creation/edit modal
  const [showTaskFormModal, setShowTaskFormModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  
  // Detail modal (drawer)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    project_id: '',
    assigned_to_id: '',
    title: '',
    description: '',
    priority: 'medium',
    start_date: '',
    due_date: ''
  });

  const isAdmin = user.role === 'admin';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProject) params.project_id = selectedProject;
      if (selectedPriority) params.priority = selectedPriority;
      if (search) params.search = search;
      
      const data = await api.tasks.list(params);
      setTasks(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const projs = await api.projects.list();
      setProjects(projs);
      
      if (isAdmin) {
        const emps = await api.employees.list({ status: 'active' });
        setEmployees(emps);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProject, selectedPriority, search]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const handleOpenCreateModal = () => {
    setCurrentTask(null);
    setFormData({
      project_id: projects[0]?.id || '',
      assigned_to_id: '',
      title: '',
      description: '',
      priority: 'medium',
      start_date: '',
      due_date: ''
    });
    setShowTaskFormModal(true);
  };

  const handleOpenEditModal = (task, e) => {
    e.stopPropagation();
    setCurrentTask(task);
    setFormData({
      project_id: task.project_id,
      assigned_to_id: task.assigned_to_id || '',
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      start_date: task.start_date || '',
      due_date: task.due_date
    });
    setShowTaskFormModal(true);
  };

  const handleOpenDetailModal = async (task) => {
    try {
      setDetailTask(task);
      setShowDetailModal(true);
      
      // Fetch comments & history logs
      const [comms, logs] = await Promise.all([
        api.tasks.getComments(task.id),
        api.tasks.getHistory(task.id)
      ]);
      setComments(comms);
      setHistoryLogs(logs);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const added = await api.tasks.addComment(detailTask.id, newComment);
      setComments(prev => [added.comment, ...prev]);
      setNewComment('');
      showToast("Comment posted", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.tasks.update(detailTask.id, { status: newStatus });
      setDetailTask(updated.task);
      fetchTasks();
      
      // Refresh logs
      const logs = await api.tasks.getHistory(detailTask.id);
      setHistoryLogs(logs);
      
      showToast("Task status updated", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.tasks.delete(taskId);
      showToast("Task deleted", "success");
      setShowDetailModal(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.title || !formData.due_date) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    if (formData.start_date && new Date(formData.start_date) > new Date(formData.due_date)) {
      showToast("Start date cannot be after due date", "error");
      return;
    }

    try {
      if (currentTask) {
        await api.tasks.update(currentTask.id, formData);
        showToast("Task updated successfully", "success");
      } else {
        await api.tasks.create(formData);
        showToast("Task created successfully", "success");
      }
      setShowTaskFormModal(false);
      fetchTasks();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const progressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="page-container">
      {/* Filters & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div className="filter-search-container" style={{ marginBottom: 0, flexGrow: 1 }}>
          <input
            type="text"
            className="form-control filter-input-element"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-control filter-select-element"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            className="form-control filter-select-element"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
          Loading tasks board...
        </div>
      ) : (
        <div className="kanban-board-row">
          {/* Pending Column */}
          <div className="kanban-column">
            <div className="column-header-title">
              <span className="column-label">Pending</span>
              <span className="status-pill pending">{pendingTasks.length}</span>
            </div>
            
            <div className="card-items-list">
              {pendingTasks.map(t => (
                <div key={t.id} className="task-item-card" onClick={() => handleOpenDetailModal(t)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span className={`badge ${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'primary'}`}>
                      {t.priority}
                    </span>
                    {t.is_overdue && (
                      <span className="overdue-alert-banner">
                        <AlertCircle size={10} /> Overdue
                      </span>
                    )}
                  </div>
                  <h4 className="task-card-title">{t.title}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Project: {t.project_name}</span>
                  <div className="task-footer-info">
                    <span className="task-card-dates" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      Due: {t.due_date}
                    </span>
                    <div className="assignee-avatar" title={`Assignee: ${t.assigned_to_name}`}>
                      {t.assigned_to_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No pending tasks.
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="kanban-column">
            <div className="column-header-title">
              <span className="column-label">In Progress</span>
              <span className="status-pill in_progress">{progressTasks.length}</span>
            </div>

            <div className="card-items-list">
              {progressTasks.map(t => (
                <div key={t.id} className="task-item-card" onClick={() => handleOpenDetailModal(t)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span className={`badge ${t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'primary'}`}>
                      {t.priority}
                    </span>
                    {t.is_overdue && (
                      <span className="overdue-alert-banner">
                        <AlertCircle size={10} /> Overdue
                      </span>
                    )}
                  </div>
                  <h4 className="task-card-title">{t.title}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Project: {t.project_name}</span>
                  <div className="task-footer-info">
                    <span className="task-card-dates" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      Due: {t.due_date}
                    </span>
                    <div className="assignee-avatar" title={`Assignee: ${t.assigned_to_name}`}>
                      {t.assigned_to_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              {progressTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No tasks in progress.
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="kanban-column">
            <div className="column-header-title">
              <span className="column-label">Completed</span>
              <span className="status-pill completed">{completedTasks.length}</span>
            </div>

            <div className="card-items-list">
              {completedTasks.map(t => (
                <div key={t.id} className="task-item-card" onClick={() => handleOpenDetailModal(t)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span className={`badge success`}>
                      Completed
                    </span>
                  </div>
                  <h4 className="task-card-title" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{t.title}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Project: {t.project_name}</span>
                  <div className="task-footer-info">
                    <span className="task-card-dates" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      Done: {t.due_date}
                    </span>
                    <div className="assignee-avatar" title={`Assignee: ${t.assigned_to_name}`}>
                      {t.assigned_to_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No completed tasks.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer / Modal */}
      {showDetailModal && detailTask && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="status-pill status-pill-active" style={{ fontSize: '10px' }}>
                  {detailTask.project_name}
                </span>
                <h3 className="modal-title-header" style={{ marginTop: '4px' }}>{detailTask.title}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className="form-label">Task Description</span>
                <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '6px' }}>
                  {detailTask.description || "No description provided for this task."}
                </p>
              </div>

              {/* Status and Action Row */}
              <div className="input-row-flex" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '16px 0' }}>
                <div>
                  <span className="form-label">Assignee</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                      {detailTask.assigned_to_name.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{detailTask.assigned_to_name}</span>
                  </div>
                </div>

                <div>
                  <span className="form-label">Update Status</span>
                  <select
                    className="form-control"
                    style={{ marginTop: '6px', width: '100%' }}
                    value={detailTask.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="input-row-flex" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div>
                  <span>Priority: </span>
                  <strong style={{ textTransform: 'capitalize' }}>{detailTask.priority}</strong>
                </div>
                <div>
                  <span>Due Date: </span>
                  <strong>{detailTask.due_date}</strong>
                </div>
              </div>

              {/* Comments & Activity Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Side: Comments */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={14} /> Comments Feed ({comments.length})
                  </span>
                  
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px' }} disabled={submittingComment}>
                      <Send size={14} />
                    </button>
                  </form>

                  <div className="comments-feed-box">
                    {comments.map(c => (
                      <div key={c.id} className="comment-node-bubble">
                        <div className="comment-author-row">
                          <span>{c.username} <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>({c.role})</span></span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {new Date(c.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="comment-msg-text">{c.comment_text}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                        No comments yet.
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Activity Log History */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={14} /> Audit Log Trail
                  </span>

                  <div style={{ 
                    marginTop: '10px', 
                    maxHeight: '260px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--bg-tertiary)', 
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {historyLogs.map(log => (
                      <div key={log.id} style={{ fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a5b4fc', fontWeight: 600 }}>
                          <span>{log.action}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                            {new Date(log.created_at + 'Z').toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {log.old_value && (
                            <span>{log.old_value} &rarr; {log.new_value}</span>
                          )}
                          {!log.old_value && <span>{log.new_value}</span>}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Updated by @{log.username}
                        </div>
                      </div>
                    ))}
                    {historyLogs.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                        No activity trails logged.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              {isAdmin ? (
                <button className="btn btn-danger" onClick={() => handleDeleteTask(detailTask.id)}>
                  <Trash2 size={16} /> Delete Task
                </button>
              ) : <div />}
              <div style={{ display: 'flex', gap: '10px' }}>
                {isAdmin && (
                  <button className="btn btn-secondary" onClick={(e) => { setShowDetailModal(false); handleOpenEditModal(detailTask, e); }}>
                    Edit Task
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Form Modal (Create / Edit) */}
      {showTaskFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title-header">{currentTask ? 'Edit Task' : 'Create New Task'}</h3>
              <button className="modal-close-btn" onClick={() => setShowTaskFormModal(false)}>Cancel</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project *</label>
                  <select
                    className="form-control"
                    value={formData.project_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Write integration test mocks"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Provide details about task expectations..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select
                      className="form-control"
                      value={formData.assigned_to_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, assigned_to_id: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.job_title})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {currentTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
