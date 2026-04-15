import axios from 'axios';

const BASE_URL = '/api';
let activeRequests = 0;
const loadingListeners = new Set();
const responseCache = new Map();

const emitLoading = () => {
  const isLoading = activeRequests > 0;
  loadingListeners.forEach(listener => listener(isLoading));
};

const startLoading = () => {
  activeRequests += 1;
  emitLoading();
};

const stopLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  emitLoading();
};

const buildCacheKey = (url, params) => `${url}::${JSON.stringify(params || {})}`;

const invalidateCache = (urlPrefix) => {
  for (const key of responseCache.keys()) {
    if (key.startsWith(`${urlPrefix}::`)) {
      responseCache.delete(key);
    }
  }
};

export const subscribeGlobalLoading = listener => {
  if (typeof listener !== 'function') return () => {};
  loadingListeners.add(listener);
  listener(activeRequests > 0);
  return () => loadingListeners.delete(listener);
};

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  if (!config?.skipGlobalLoading) startLoading();

  const path = window.location.pathname || '';
  const isTeacherArea = path.startsWith('/teacher');
  const isStudentArea = path.startsWith('/student');
  const isAdminArea = path.startsWith('/admin') || path === '/' || path.startsWith('/login');

  let token = null;
  if (isTeacherArea) {
    token = localStorage.getItem('teacher_token');
  } else if (isStudentArea) {
    token = localStorage.getItem('student_token');
  } else if (isAdminArea) {
    token = localStorage.getItem('admin_token');
  }

  if (!token) {
    token =
      localStorage.getItem('teacher_token') ||
      localStorage.getItem('student_token') ||
      localStorage.getItem('admin_token');
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  r => {
    if (!r.config?.skipGlobalLoading) stopLoading();
    return r;
  },
  err => {
    if (!err.config?.skipGlobalLoading) stopLoading();
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('teacher');
      localStorage.removeItem('student');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('teacher_token');
      localStorage.removeItem('student_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const cachedGet = (url, params, ttlMs = 10000) => {
  const key = buildCacheKey(url, params);
  const cached = responseCache.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.response);
  }

  return api.get(url, { params }).then(response => {
    responseCache.set(key, { response, expiresAt: now + ttlMs });
    return response;
  });
};

export const authAPI = {
  login: d => api.post('/auth/login', d),
  logout: () => api.post('/auth/logout'),
  forgotPassword: d => api.post('/auth/forgot-password', d),
  resetPassword: d => api.post('/auth/reset-password', d),
  changePassword: d => api.post('/auth/change-password', d),
};
export const studentAuthAPI = {
  login: d => api.post('/students/login', d),
  forgotPassword: d => api.post('/students/forgot-password', d),
  resetPassword: d => api.post('/students/reset-password', d),
  changePassword: d => api.post('/students/change-password', d),
};
export const usersAPI = {
  register: d => api.post('/users/register', d),
  getAll: p => api.get('/users', { params: p }),
  getSummary: () => api.get('/users/summary'),
  getSearchSummary: p => api.get('/users/search-summary', { params: p }),
  getById: id => api.get(`/users/${id}`),
  update: (id, d) => api.patch(`/users/${id}`, d),
  delete: id => api.delete(`/users/${id}`),
  uploadPhoto: (id, fd) => api.patch(`/users/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const teachersAPI = {
  create: d => api.post('/teachers', d).then(r => { invalidateCache('/teachers'); return r; }),
  login: d => api.post('/teachers/login', d),
  getAll: p => (p?.compact ? cachedGet('/teachers', p, 15000) : api.get('/teachers', { params: p })),
  getSummary: () => api.get('/teachers/summary'),
  getSearchSummary: p => api.get('/teachers/search-summary', { params: p }),
  getById: id => api.get(`/teachers/${id}`),
  update: (id, d) => api.patch(`/teachers/${id}`, d).then(r => { invalidateCache('/teachers'); return r; }),
  delete: id => api.delete(`/teachers/${id}`).then(r => { invalidateCache('/teachers'); return r; }),
  getGroups: id => api.get(`/teachers/${id}/groups`),
  uploadPhoto: (id, fd) => api.patch(`/teachers/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => { invalidateCache('/teachers'); return r; }),
};
export const studentsAPI = {
  create: d => api.post('/students', d).then(r => { invalidateCache('/students'); return r; }),
  getAll: p => (p?.compact ? cachedGet('/students', p, 15000) : api.get('/students', { params: p })),
  getSummary: () => api.get('/students/summary'),
  getSearchSummary: p => api.get('/students/search-summary', { params: p }),
  getById: id => api.get(`/students/${id}`),
  update: (id, d) => api.patch(`/students/${id}`, d).then(r => { invalidateCache('/students'); return r; }),
  delete: id => api.delete(`/students/${id}`).then(r => { invalidateCache('/students'); return r; }),
  getGroups: id => api.get(`/students/${id}/groups`),
  uploadPhoto: (id, fd) => api.patch(`/students/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => { invalidateCache('/students'); return r; }),
};
export const coursesAPI = {
  create: d => api.post('/courses', d).then(r => { invalidateCache('/courses'); return r; }),
  getAll: () => cachedGet('/courses', undefined, 30000),
  getById: id => api.get(`/courses/${id}`),
  update: (id, d) => api.patch(`/courses/${id}`, d).then(r => { invalidateCache('/courses'); return r; }),
  delete: id => api.delete(`/courses/${id}`).then(r => { invalidateCache('/courses'); return r; }),
};
export const roomsAPI = {
  create: d => api.post('/rooms', d).then(r => { invalidateCache('/rooms'); return r; }),
  getAll: () => cachedGet('/rooms', undefined, 30000),
  getById: id => api.get(`/rooms/${id}`),
  update: (id, d) => api.patch(`/rooms/${id}`, d).then(r => { invalidateCache('/rooms'); return r; }),
  delete: id => api.delete(`/rooms/${id}`).then(r => { invalidateCache('/rooms'); return r; }),
};
export const groupsAPI = {
  create: d => api.post('/groups', d).then(r => { invalidateCache('/groups'); return r; }),
  getAll: p => (p?.compact ? cachedGet('/groups', p, 15000) : api.get('/groups', { params: p })),
  getById: id => api.get(`/groups/${id}`),
  update: (id, d) => api.patch(`/groups/${id}`, d).then(r => { invalidateCache('/groups'); return r; }),
  delete: id => api.delete(`/groups/${id}`).then(r => { invalidateCache('/groups'); return r; }),
  getStudents: id => api.get(`/groups/${id}/students`),
  addStudent: (id, d) => api.post(`/groups/${id}/students`, d).then(r => { invalidateCache('/groups'); invalidateCache('/students'); return r; }),
  addStudentsBulk: (id, d) => api.post(`/groups/${id}/students/bulk`, d).then(r => { invalidateCache('/groups'); invalidateCache('/students'); return r; }),
  removeStudent: (id, sid) => api.delete(`/groups/${id}/students/${sid}`).then(r => { invalidateCache('/groups'); invalidateCache('/students'); return r; }),
};
export const lessonsAPI = {
  create: d => api.post('/lessons', d).then(r => { invalidateCache('/lessons'); return r; }),
  getAll: p => cachedGet('/lessons', p, 8000),
  getById: id => api.get(`/lessons/${id}`),
  update: (id, d) => api.patch(`/lessons/${id}`, d).then(r => { invalidateCache('/lessons'); return r; }),
  delete: id => api.delete(`/lessons/${id}`).then(r => { invalidateCache('/lessons'); return r; }),
};
export const attendanceAPI = {
  create: d => api.post('/attendance', d),
  bulkCreate: d => api.post('/attendance/bulk', d),
  getAll: () => api.get('/attendance'),
  getByLesson: id => api.get(`/attendance/lesson/${id}`),
  getByStudent: id => api.get(`/attendance/student/${id}`),
  update: (id, d) => api.patch(`/attendance/${id}`, d),
};
export const homeworkAPI = {
  create: d => api.post('/homework', d).then(r => { invalidateCache('/homework'); return r; }),
  getAll: p => cachedGet('/homework', p, 8000),
  getById: id => api.get(`/homework/${id}`),
  update: (id, d) => api.patch(`/homework/${id}`, d).then(r => { invalidateCache('/homework'); return r; }),
  delete: id => api.delete(`/homework/${id}`).then(r => { invalidateCache('/homework'); return r; }),
  uploadFile: (id, fd) => api.patch(`/homework/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => { invalidateCache('/homework'); return r; }),
  getStudentStatuses: id => api.get(`/homework/${id}/student-statuses`),
};
export const lessonVideosAPI = {
  create: fd => api.post('/lesson-videos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => { invalidateCache('/lesson-videos'); return r; }),
  getAll: p => cachedGet('/lesson-videos', p, 8000),
  getById: id => api.get(`/lesson-videos/${id}`),
  update: (id, d) => {
    const config = d instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    return api.patch(`/lesson-videos/${id}`, d, config).then(r => { invalidateCache('/lesson-videos'); return r; });
  },
  delete: id => api.delete(`/lesson-videos/${id}`).then(r => { invalidateCache('/lesson-videos'); return r; }),
};
export const homeworkResponsesAPI = {
  create: d => api.post('/homework-responses', d),
  getAll: p => (p?.compact ? cachedGet('/homework-responses', p, 6000) : api.get('/homework-responses', { params: p })),
  getById: id => api.get(`/homework-responses/${id}`),
  update: (id, d) => api.patch(`/homework-responses/${id}`, d),
  uploadFile: (id, fd) => api.patch(`/homework-responses/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: id => api.delete(`/homework-responses/${id}`),
};
export const homeworkResultsAPI = {
  create: d => api.post('/homework-results', d),
  getAll: p => (p?.compact ? cachedGet('/homework-results', p, 6000) : api.get('/homework-results', { params: p })),
  getById: id => api.get(`/homework-results/${id}`),
  update: (id, d) => api.patch(`/homework-results/${id}`, d),
  uploadFile: (id, fd) => api.patch(`/homework-results/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: id => api.delete(`/homework-results/${id}`),
};
export const ratingsAPI = {
  create: d => api.post('/ratings', d),
  getAll: p => api.get('/ratings', { params: p }),
  getByStudent: id => api.get(`/ratings/student/${id}`),
  getByTeacher: id => api.get(`/ratings/teacher/${id}`),
  delete: id => api.delete(`/ratings/${id}`),
};

export default api;
