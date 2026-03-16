import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

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
  getAll: () => api.get('/users'),
  getById: id => api.get(`/users/${id}`),
  update: (id, d) => api.patch(`/users/${id}`, d),
  delete: id => api.delete(`/users/${id}`),
  uploadPhoto: (id, fd) => api.patch(`/users/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const teachersAPI = {
  create: d => api.post('/teachers', d),
  login: d => api.post('/teachers/login', d),
  getAll: () => api.get('/teachers'),
  getById: id => api.get(`/teachers/${id}`),
  update: (id, d) => api.patch(`/teachers/${id}`, d),
  delete: id => api.delete(`/teachers/${id}`),
  getGroups: id => api.get(`/teachers/${id}/groups`),
  uploadPhoto: (id, fd) => api.patch(`/teachers/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const studentsAPI = {
  create: d => api.post('/students', d),
  getAll: () => api.get('/students'),
  getById: id => api.get(`/students/${id}`),
  update: (id, d) => api.patch(`/students/${id}`, d),
  delete: id => api.delete(`/students/${id}`),
  getGroups: id => api.get(`/students/${id}/groups`),
  uploadPhoto: (id, fd) => api.patch(`/students/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const coursesAPI = {
  create: d => api.post('/courses', d),
  getAll: () => api.get('/courses'),
  getById: id => api.get(`/courses/${id}`),
  update: (id, d) => api.patch(`/courses/${id}`, d),
  delete: id => api.delete(`/courses/${id}`),
};
export const roomsAPI = {
  create: d => api.post('/rooms', d),
  getAll: () => api.get('/rooms'),
  getById: id => api.get(`/rooms/${id}`),
  update: (id, d) => api.patch(`/rooms/${id}`, d),
  delete: id => api.delete(`/rooms/${id}`),
};
export const groupsAPI = {
  create: d => api.post('/groups', d),
  getAll: p => api.get('/groups', { params: p }),
  getById: id => api.get(`/groups/${id}`),
  update: (id, d) => api.patch(`/groups/${id}`, d),
  delete: id => api.delete(`/groups/${id}`),
  getStudents: id => api.get(`/groups/${id}/students`),
  addStudent: (id, d) => api.post(`/groups/${id}/students`, d),
  removeStudent: (id, sid) => api.delete(`/groups/${id}/students/${sid}`),
};
export const lessonsAPI = {
  create: d => api.post('/lessons', d),
  getAll: p => api.get('/lessons', { params: p }),
  getById: id => api.get(`/lessons/${id}`),
  update: (id, d) => api.patch(`/lessons/${id}`, d),
  delete: id => api.delete(`/lessons/${id}`),
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
  create: d => api.post('/homework', d),
  getAll: p => api.get('/homework', { params: p }),
  getById: id => api.get(`/homework/${id}`),
  update: (id, d) => api.patch(`/homework/${id}`, d),
  delete: id => api.delete(`/homework/${id}`),
  uploadFile: (id, fd) => api.patch(`/homework/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStudentStatuses: id => api.get(`/homework/${id}/student-statuses`),
};
export const lessonVideosAPI = {
  create: fd => api.post('/lesson-videos', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: p => api.get('/lesson-videos', { params: p }),
  getById: id => api.get(`/lesson-videos/${id}`),
  update: (id, d) => {
    const config = d instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
    return api.patch(`/lesson-videos/${id}`, d, config);
  },
  delete: id => api.delete(`/lesson-videos/${id}`),
};
export const homeworkResponsesAPI = {
  create: d => api.post('/homework-responses', d),
  getAll: p => api.get('/homework-responses', { params: p }),
  getById: id => api.get(`/homework-responses/${id}`),
  update: (id, d) => api.patch(`/homework-responses/${id}`, d),
  uploadFile: (id, fd) => api.patch(`/homework-responses/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: id => api.delete(`/homework-responses/${id}`),
};
export const homeworkResultsAPI = {
  create: d => api.post('/homework-results', d),
  getAll: p => api.get('/homework-results', { params: p }),
  getById: id => api.get(`/homework-results/${id}`),
  update: (id, d) => api.patch(`/homework-results/${id}`, d),
  uploadFile: (id, fd) => api.patch(`/homework-results/${id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: id => api.delete(`/homework-results/${id}`),
};
export const ratingsAPI = {
  create: d => api.post('/ratings', d),
  getAll: () => api.get('/ratings'),
  getByStudent: id => api.get(`/ratings/student/${id}`),
  getByTeacher: id => api.get(`/ratings/teacher/${id}`),
  delete: id => api.delete(`/ratings/${id}`),
};

export default api;
