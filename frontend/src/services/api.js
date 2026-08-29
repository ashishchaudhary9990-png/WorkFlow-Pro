const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

const request = async (method, path, body = null) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  
  // Handle empty or text responses
  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.error) || response.statusText || 'API Request Failed';
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  auth: {
    login: (username, password) => request('POST', '/auth/login', { username, password }),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/auth/me'),
    updateProfile: (profileData) => request('PUT', '/auth/profile', profileData),
  },
  departments: {
    list: () => request('GET', '/departments'),
    get: (id) => request('GET', `/departments/${id}`),
    create: (deptData) => request('POST', '/departments', deptData),
    update: (id, deptData) => request('PUT', `/departments/${id}`, deptData),
    delete: (id) => request('DELETE', `/departments/${id}`),
  },
  employees: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/employees?${qs}`);
    },
    get: (id) => request('GET', `/employees/${id}`),
    create: (empData) => request('POST', '/employees', empData),
    update: (id, empData) => request('PUT', `/employees/${id}`, empData),
    delete: (id) => request('DELETE', `/employees/${id}`),
  },
  projects: {
    list: () => request('GET', '/projects'),
    get: (id) => request('GET', `/projects/${id}`),
    create: (projData) => request('POST', '/projects', projData),
    update: (id, projData) => request('PUT', `/projects/${id}`, projData),
    delete: (id) => request('DELETE', `/projects/${id}`),
  },
  tasks: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/tasks?${qs}`);
    },
    get: (id) => request('GET', `/tasks/${id}`),
    create: (taskData) => request('POST', '/tasks', taskData),
    update: (id, taskData) => request('PUT', `/tasks/${id}`, taskData),
    delete: (id) => request('DELETE', `/tasks/${id}`),
    addComment: (id, text) => request('POST', `/tasks/${id}/comments`, { comment_text: text }),
    getComments: (id) => request('GET', `/tasks/${id}/comments`),
    getHistory: (id) => request('GET', `/tasks/${id}/history`),
  },
  dashboard: {
    stats: () => request('GET', '/dashboard/stats'),
  },
  reports: {
    employees: () => request('GET', '/reports/employees'),
    projects: () => request('GET', '/reports/projects'),
    tasks: () => request('GET', '/reports/tasks'),
  }
};
