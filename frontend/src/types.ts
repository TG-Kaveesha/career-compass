export type SkillStatus = "not_started" | "in_progress" | "mastered";
export type MilestoneStatus = "todo" | "in_progress" | "completed";
export type ResourceType = "video" | "article" | "documentation" | "certification";

export interface Role {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  academicYear: string;
  targetRole: { id: string; name: string; isCustom: boolean };
}

export interface AssessmentItem {
  skillId: string;
  name: string;
  category: string;
  importance: "critical" | "important";
  status: SkillStatus;
  isCustom: boolean;
}

export interface Assessment {
  role: { id: string; name: string; isCustom: boolean };
  items: AssessmentItem[];
  readiness: number;
  mastered: number;
  total: number;
  criticalGaps: string[];
}

export interface Milestone {
  id: string;
  title: string;
  skillTag: string;
  dueDate: string | null;
  status: MilestoneStatus;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  skillTag: string;
  createdAt?: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  createdAt: string;
}

export interface DashboardData {
  targetRole: string;
  readiness: number;
  mastered: number;
  total: number;
  criticalGaps: string[];
  upcoming: Milestone[];
  activity: ActivityItem[];
}

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  current: boolean;
}

export interface CustomSkill {
  id: string;
  name: string;
}