import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const DepartmentsList = () => {
  const { showToast } = useApp();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.departments.list();
      setDepartments(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setCurrentDept(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (dept) => {
    setCurrentDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || ''
    });
    setShowModal(true);
  };

  const handleOpenDeleteConfirm = (dept) => {
    setCurrentDept(dept);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (currentDept) {
        await api.departments.update(currentDept.id, formData);
        showToast("Department updated successfully", "success");
      } else {
        await api.departments.create(formData);
        showToast("Department created successfully", "success");
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.departments.delete(currentDept.id);
      showToast("Department deleted successfully", "success");
      setShowDeleteConfirm(false);
      fetchDepartments();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Create Department</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
          Loading department structure...
        </div>
      ) : (
        <div className="dashboard-panel" style={{ padding: '20px' }}>
          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><Building size={16} /></th>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Allocated Staff Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id}>
                    <td>
                      <div className="avatar-circle" style={{ width: '28px', height: '28px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {dept.name.substring(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{dept.description || 'No description.'}</td>
                    <td>
                      <span className="status-pill active" style={{ backgroundColor: 'var(--primary-light)', color: '#818cf8' }}>
                        {dept.employee_count} Employees
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenEditModal(dept)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '6px' }}
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteConfirm(dept)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                          title="Delete Department"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No departments established yet. Click "Create Department" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title-header">{currentDept ? 'Edit Department' : 'Create New Department'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Quality Assurance"
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
                    placeholder="Describe roles and scopes..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {currentDept ? 'Save Changes' : 'Create Department'}
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
              <h3 className="modal-title-header">Remove Department</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete department <strong>{currentDept?.name}</strong>?
                Staff members in this department will be unassigned (set to "Unassigned"), but their profiles will remain.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Department</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsList;
