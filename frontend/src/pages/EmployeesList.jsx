import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Key, Users } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const EmployeesList = () => {
  const { showToast } = useApp();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    salary: '',
    hire_date: '',
    department_id: '',
    role: 'employee',
    status: 'active'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (deptFilter) params.department_id = deptFilter;
      if (statusFilter) params.status = statusFilter;
      
      const data = await api.employees.list(params);
      setEmployees(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await api.departments.list();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter, statusFilter]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setCurrentEmployee(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      job_title: '',
      salary: '',
      hire_date: new Date().toISOString().split('T')[0],
      department_id: departments[0]?.id || '',
      role: 'employee',
      status: 'active'
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setCurrentEmployee(emp);
    setFormData({
      username: emp.username,
      email: emp.email,
      password: '', // Leave blank for edit
      first_name: emp.first_name,
      last_name: emp.last_name,
      phone: emp.phone || '',
      job_title: emp.job_title || '',
      salary: emp.salary || '',
      hire_date: emp.hire_date || '',
      department_id: emp.department_id || '',
      role: emp.role,
      status: emp.status
    });
    setShowFormModal(true);
  };

  const handleOpenDeleteConfirm = (emp) => {
    setCurrentEmployee(emp);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || (!currentEmployee && !formData.password) || !formData.first_name || !formData.last_name) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    try {
      if (currentEmployee) {
        // Edit Employee
        const updatePayload = { ...formData };
        if (!updatePayload.password) delete updatePayload.password; // Don't reset password if empty
        
        await api.employees.update(currentEmployee.id, updatePayload);
        showToast("Employee details updated", "success");
      } else {
        // Create Employee
        await api.employees.create(formData);
        showToast("Employee account created", "success");
      }
      setShowFormModal(false);
      fetchEmployees();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.employees.delete(currentEmployee.id);
      showToast("Employee account deleted", "success");
      setShowDeleteConfirm(false);
      fetchEmployees();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="page-container">
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div className="filter-search-container" style={{ marginBottom: 0, flexGrow: 1 }}>
          <input
            type="text"
            className="form-control filter-input-element"
            placeholder="Search name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-control filter-select-element"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            className="form-control filter-select-element"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
          Loading employee records...
        </div>
      ) : (
        <div className="dashboard-panel" style={{ padding: '20px' }}>
          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Salary</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                          {emp.first_name.substring(0, 1)}{emp.last_name.substring(0, 1)}
                        </div>
                        <span>{emp.first_name} {emp.last_name}</span>
                      </div>
                    </td>
                    <td>@{emp.username}</td>
                    <td>{emp.email}</td>
                    <td>
                      <span className="badge primary" style={{ textTransform: 'none' }}>
                        {emp.department_name}
                      </span>
                    </td>
                    <td>{emp.job_title || 'Unassigned'}</td>
                    <td>${emp.salary ? emp.salary.toLocaleString([], { minimumFractionDigits: 2 }) : '0.00'}</td>
                    <td>{emp.hire_date || 'N/A'}</td>
                    <td>
                      <span className={`status-pill ${emp.status}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleOpenEditModal(emp)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '6px' }}
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteConfirm(emp)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                          title="Delete Employee"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                      No staff members found matching search queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title-header">{currentEmployee ? 'Modify Employee Profile' : 'Onboard New Employee'}</h3>
              <button className="modal-close-btn" onClick={() => setShowFormModal(false)}>Cancel</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h4 style={{ fontSize: '14px', color: '#818cf8', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                  Account Credentials
                </h4>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. jsmith"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. john@workflowpro.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Password {currentEmployee ? '(Leave blank to retain)' : '*'}</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder={currentEmployee ? '••••••••' : 'Password (min 6 chars)'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required={!currentEmployee}
                      minLength={currentEmployee ? undefined : 6}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role Privilege</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', color: '#818cf8', margin: '20px 0 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                  Personal details & Allocation
                </h4>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Smith"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-control"
                      value={formData.department_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Frontend Engineer"
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Salary (USD) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 75000"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hire Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.hire_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="input-row-flex">
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +1-555-0199"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employment Status</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive (Deactivated)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {currentEmployee ? 'Save Changes' : 'Register Employee'}
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
              <h3 className="modal-title-header">Remove Employee</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete employee <strong>{currentEmployee?.first_name} {currentEmployee?.last_name}</strong>?
                This will delete their user account, profile details, comments, and project histories.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Remove Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesList;
