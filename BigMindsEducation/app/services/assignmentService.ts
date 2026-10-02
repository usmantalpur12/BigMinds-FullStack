import { backendAPI } from './backendAPI';

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  instructions?: string;
  dueDate: string; // ISO date
  maxScore?: number;
  isPublished?: boolean;
  allowLateSubmission?: boolean;
}

export const assignmentService = {
  async createAssignment(courseId: string, payload: CreateAssignmentPayload) {
    const res = await backendAPI.post(`/assignments/courses/${courseId}/assignments`, payload);
    return res.data.data as any;
  },
  async getCourseAssignments(courseId: string) {
    const res = await backendAPI.get(`/assignments/courses/${courseId}/assignments`);
    return res.data.data as any[];
  },
  async deleteAssignment(assignmentId: string) {
    const res = await backendAPI.delete(`/assignments/${assignmentId}`);
    return res.data;
  },
  async submitAssignment(assignmentId: string, submissionData: { submissionText: string; attachments?: string[] }) {
    const res = await backendAPI.post(`/assignments/${assignmentId}/submit`, submissionData);
    return res.data.data as any;
  },
  async updateSubmission(submissionId: string, submissionData: { submissionText: string; attachments?: string[] }) {
    const res = await backendAPI.put(`/assignments/submissions/${submissionId}`, submissionData);
    return res.data.data as any;
  },
  async getMySubmissions() {
    const res = await backendAPI.get('/assignments/student/my-submissions');
    return res.data.data as any[];
  },
  async getAssignmentSubmissions(assignmentId: string) {
    const res = await backendAPI.get(`/assignments/${assignmentId}/submissions`);
    return res.data.data as any[];
  },
  async gradeSubmission(submissionId: string, gradeData: { score: number; feedback?: string }) {
    const res = await backendAPI.post(`/assignments/submissions/${submissionId}/grade`, gradeData);
    return res.data.data as any;
  }
};
