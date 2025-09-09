/**
 * Project team management
 */
import { User } from '@/types/hub';
import { apiRequest } from './base-api';

export const projectsTeamApi = {
  /**
   * Get project team members
   */
  async getTeamMembers(projectId: string): Promise<{
    members: Array<User & { role: string; joinedAt: string; permissions: string[] }>;
    totalCount: number;
  }> {
    return apiRequest(`/projects/${projectId}/team`);
  },

  /**
   * Add team member to project
   */
  async addTeamMember(
    projectId: string, 
    userId: string, 
    role: string = 'member'
  ): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}/team`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  /**
   * Update team member role
   */
  async updateTeamMemberRole(
    projectId: string, 
    userId: string, 
    role: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}/team/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  /**
   * Remove team member from project
   */
  async removeTeamMember(
    projectId: string, 
    userId: string
  ): Promise<{ success: boolean }> {
    return apiRequest(`/projects/${projectId}/team/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get team member permissions
   */
  async getTeamMemberPermissions(
    projectId: string, 
    userId: string
  ): Promise<{ permissions: string[] }> {
    return apiRequest(`/projects/${projectId}/team/${userId}/permissions`);
  },
};