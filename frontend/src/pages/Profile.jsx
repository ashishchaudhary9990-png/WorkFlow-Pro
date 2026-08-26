import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Check } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const Profile = () => {
  const { user, showToast, refreshUser } = useApp();
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(user.employee_profile?.first_name || '');
  const [lastName, setLastName] = useState(user.employee_profile?.last_name || '');
  const [phone, setPhone] = useState(user.employee_profile?.phone || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setSubmitting(true);
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone
      };

      if (password) {
        if (password.length < 6) {
          showToast("Password must be at least 6 characters", "warning");
          setSubmitting(false);
          return;
        }
        payload.password = password;
      }

      await api.auth.updateProfile(payload);
      await refreshUser();
      setPassword('');
      showToast("Profile settings updated successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="grid-2-col" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        
        {/* Left Side: Edit Form */}
        <div className="dashboard-panel">
          <h3 className="panel-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <User size={18} className="logo-accent" /> Update Profile Settings
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-row-flex">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contact Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reset Password (Leave blank to keep current)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  placeholder="New Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={submitting}>
              {submitting ? 'Saving changes...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Right Side: Account Details Summary Card */}
        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
          <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid var(--bg-tertiary)' }}>
            <div className="avatar-circle" style={{ width: '64px', height: '64px', fontSize: '20px', margin: '0 auto 12px' }}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 600 }}>{user.username}</h4>
            <span className="status-pill active" style={{ marginTop: '6px' }}>{user.role}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user.employee_profile?.department_name || 'N/A'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Job Title:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user.employee_profile?.job_title || 'N/A'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hire Date:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user.employee_profile?.hire_date || 'N/A'}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Employment status:</span>
              <strong style={{ color: 'var(--success)' }}>
                {user.employee_profile?.status === 'active' ? 'Active Account' : 'Inactive'}
              </strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
