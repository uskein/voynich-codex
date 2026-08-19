import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

export class N8nService {
  static async triggerWorkflow(workflowId: string, data: Record<string, any>): Promise<void> {
    try {
      await axios.post(`${N8N_WEBHOOK_URL}/${workflowId}`, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
    } catch (error) {
      console.error(`Error triggering n8n workflow "${workflowId}":`, error);
    }
  }

  static async notifyTaskAssigned(assigneeEmail: string, taskTitle: string, manuscriptTitle: string): Promise<void> {
    await this.triggerWorkflow('task-assigned', {
      assigneeEmail,
      taskTitle,
      manuscriptTitle,
      timestamp: new Date().toISOString()
    });
  }

  static async notifyChapterPublished(teamEmails: string[], chapterTitle: string, manuscriptTitle: string): Promise<void> {
    await this.triggerWorkflow('chapter-published', {
      teamEmails,
      chapterTitle,
      manuscriptTitle,
      timestamp: new Date().toISOString()
    });
  }

  static async notifyDeadlineReminder(assigneeEmail: string, taskTitle: string, dueDate: string): Promise<void> {
    await this.triggerWorkflow('deadline-reminder', {
      assigneeEmail,
      taskTitle,
      dueDate,
      timestamp: new Date().toISOString()
    });
  }

  static async notifyMilestoneAchieved(teamEmails: string[], milestoneTitle: string, manuscriptTitle: string): Promise<void> {
    await this.triggerWorkflow('milestone-achieved', {
      teamEmails,
      milestoneTitle,
      manuscriptTitle,
      timestamp: new Date().toISOString()
    });
  }
}
