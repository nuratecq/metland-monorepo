import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  project_type_id: z.string().optional(),
  location_text: z.string().max(200).optional(),
  start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
  status: z.enum(["DRAFT","PLANNED","ACTIVE","ON_HOLD","COMPLETED","ARCHIVED"]).default("DRAFT"),
  manager_id: z.string().optional(),
});

export const milestoneSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  completion_percentage: z.number().min(0).max(100).default(0),
  status: z.enum(["TODO","IN_PROGRESS","DONE","BLOCKED"]).default("TODO"),
  pic_user_id: z.string().optional(),
});

export const taskSchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().optional(),
  assignee_id: z.string().optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).default("MEDIUM"),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(["TODO","IN_PROGRESS","BLOCKED","DONE","CANCELLED"]).default("TODO"),
  progress: z.number().min(0).max(100).default(0),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const r2PresignSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.string().min(3),
  size: z.number().int().positive().max(20*1024*1024),
  entity: z.string().min(1),
  entityId: z.string().min(1),
});

export const contractorSchema = z.object({
  company_name: z.string().min(2),
  company_code: z.string().min(2),
  category_id: z.string().optional(),
  specialization_id: z.string().optional(),
  location: z.string().optional(),
});
