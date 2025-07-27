import { apiRequest } from './queryClient';
import { LoginUserInput, RegisterUserInput } from '@shared/schema';

export const api = {
  auth: {
    login: (data: LoginUserInput) => apiRequest('POST', '/api/auth/login', data),
    register: (data: RegisterUserInput) => apiRequest('POST', '/api/auth/register', data),
    me: () => apiRequest('GET', '/api/auth/me')
  },
  students: {
    getAll: () => apiRequest('GET', '/api/students'),
    getById: (id: number) => apiRequest('GET', `/api/students/${id}`),
    create: (data: any) => apiRequest('POST', '/api/students', data),
    update: (id: number, data: any) => apiRequest('PUT', `/api/students/${id}`, data),
    activate: (id: number) => apiRequest('PATCH', `/api/students/${id}/activate`),
    deactivate: (id: number) => apiRequest('PATCH', `/api/students/${id}/deactivate`),
    getAttendance: (id: number) => apiRequest('GET', `/api/students/${id}/attendance`),
    getPlans: (id: number) => apiRequest('GET', `/api/students/${id}/plans`)
  },
  plans: {
    getAll: () => apiRequest('GET', '/api/plans'),
    create: (data: any) => apiRequest('POST', '/api/plans', data),
    update: (id: number, data: any) => apiRequest('PUT', `/api/plans/${id}`, data),
    delete: (id: number) => apiRequest('DELETE', `/api/plans/${id}`)
  },
  studentPlans: {
    create: (data: any) => apiRequest('POST', '/api/student-plans', data)
  },
  classes: {
    getAll: () => apiRequest('GET', '/api/classes'),
    create: (data: any) => apiRequest('POST', '/api/classes', data),
    checkin: (id: number, studentId: number) => apiRequest('POST', `/api/classes/${id}/checkin`, { studentId }),
    getAttendance: (id: number) => apiRequest('GET', `/api/classes/${id}/attendance`)
  },
  dashboard: {
    admin: () => apiRequest('GET', '/api/dash/admin'),
    instructor: () => apiRequest('GET', '/api/dash/instructor'),
    student: () => apiRequest('GET', '/api/dash/student')
  }
};
