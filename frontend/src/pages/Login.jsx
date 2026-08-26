import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Lock, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    try {
      setSubmitting(true);
      await login(username, password);
      navigate('/');
    } catch (err) {
      // Error handled by Context toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-full-page">
      <div className="login-card-container">
        <div className="login-header-section">
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Briefcase size={32} />
          </div>
          <h1 className="login-title-primary">WorkFlow Pro</h1>
          <p className="login-desc-sec">Enter credentials to access your workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="e.g. admin or lalit_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 500 }}>Demo Credentials:</p>
          <p style={{ marginTop: '4px' }}>Admin: <code style={{ color: 'var(--text-primary)' }}>admin</code> / <code style={{ color: 'var(--text-primary)' }}>admin123</code></p>
          <p>Employee: <code style={{ color: 'var(--text-primary)' }}>lalit_dev</code> / <code style={{ color: 'var(--text-primary)' }}>password123</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
