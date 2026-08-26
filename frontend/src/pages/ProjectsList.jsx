import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Edit2, Trash2, Users, FolderOpen } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const ProjectsList = () => {
  const { user, showToast } = useApp();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning',
    member_ids: []
  });

  const isAdmin = user.role === 'admin';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.projects.list();
      setProjects(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isAdmin) return;
    try {
      const data = await api.employees.list({ status: 'active' });
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setCurrentProject(null);
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planning',
      member_ids: []
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (proj) => {
    setCurrentProject(proj);
    setFormData({
      name: proj.name,
      description: proj.description || '',
      start_date: proj.start_date,
      end_date: proj.end_date,
      status: proj.status,
      member_ids: proj.members.map(m => m.id)
    });
    setShowModal(true);
  };

  const handleOpenDeleteConfirm = (proj) => {
    setCurrentProject(proj);
    setShowDeleteConfirm(true);
  };

  const handleCheckboxChange = (empId) => {
    setFormData(prev => {
      const isSelected = prev.member_ids.includes(empId);
      const member_ids = isSelected
        ? prev.member_ids.filter(id => id !== empId)
        : [...prev.member_ids, empId];
      return { ...prev, member_ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      showToast("Start date cannot be after end date", "error");
      return;
    }

    try {
      if (currentProject) {
        // Update Project
        await api.projects.update(currentProject.id, formData);
        showToast("Project updated successfully", "success");
      } else {
        // Create Project
        await api.projects.create(formData);
        showToast("Project created successfully", "success");
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.projects.delete(currentProject.id);
      showToast("Project deleted successfully", "success");
      setShowDeleteConfirm(false);
      fetchProjects();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Filter project cards
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div className="filter-search-container" style={{ marginBottom: 0, flexGrow: 1 }}>
          <input
            type="text"
            className="form-control filter-input-element"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="form-control filter-select-element"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
          Loading projects data...
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="cards-grid">
          {filteredProjects.map((proj) => (
            <div key={proj.id} className={`project-item-card ${proj.status}`}>
              <div className="card-top">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="status-pill status-pill-active" style={{ width: 'fit-content' }}>
                    {proj.status.replace('_', ' ')}
                  </span>
                  <h3 className="project-title">{proj.name}</h3>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleOpenEditModal(proj)}
                      className="btn btn-secondary" 
                      style={{ padding: '6px', borderRadius: '6px' }}
                      title="Edit Project"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleOpenDeleteConfirm(proj)}
                      className="btn btn-secondary" 
                      style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <p className="project-card-desc">
                {proj.description || "No project description provided."}
              </p>

              <div className="progress-group">
                <div className="progress-label-row">
                  <span>Task Completion</span>
                  <span>{proj.completion_percentage}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-fill-percentage" 
                    style={{ width: `${proj.completion_percentage}%` }}
                  />
                </div>
              </div>

              <div className="card-dates-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} />
                  {proj.start_date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} />
                  {proj.end_date}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Tasks: <strong>{proj.task_count}</strong>
                </span>
                
                <div className="member-avatar-list">
                  {proj.members.map((m, idx) => (
                    <div 
                      key={m.id} 
                      className="member-avatar-badge"
                      title={`${m.first_name} ${m.last_name} (${m.job_title || 'Employee'})`}
                      style={{ zIndex: proj.members.length - idx }}
                    >
                      {m.first_name.substring(0, 1)}{m.last_name.substring(0, 1)}
                    </div>
                  ))}
                  {proj.members.length === 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No members</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="dashboard-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>No Projects Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            There are no projects that match your filters or assignments.
          </p>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title-header">{currentProject ? 'Edit Project Details' : 'Create New Project'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mobile Application Backend"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Provide details about the target objectives..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '10px' }}>Assign Team Members</label>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--bg-tertiary)', 
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {employees.map(emp => (
                      <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={formData.member_ids.includes(emp.id)}
                          onChange={() => handleCheckboxChange(emp.id)}
                        />
                        <span>{emp.first_name} {emp.last_name} ({emp.job_title || 'Unassigned'})</span>
                      </label>
                    ))}
                    {employees.length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active employees found to assign.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {currentProject ? 'Save Changes' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title-header">Confirm Deletion</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete project <strong>{currentProject?.name}</strong>?
                This action is irreversible and will delete all associated tasks, task comments, and history logs.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
