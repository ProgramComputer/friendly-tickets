import { z } from 'zod'

// Base schemas for reuse
export const attachmentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number(),
})

export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export const customFieldValueSchema = z.object({
  field_id: z.string().uuid(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  is_internal: z.boolean().default(false),
})

// Ticket schemas
export const ticketBasicInfoSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  categoryId: z.string().uuid().optional(),
})

export const ticketAttachmentsSchema = z.object({
  attachments: z.array(attachmentSchema).optional(),
})

export const ticketAgentFieldsSchema = z.object({
  departmentId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedToId: z.string().uuid().optional(),
  isInternal: z.boolean().default(false),
  tags: z.array(z.string().uuid()).optional(),
  customFields: z.array(customFieldValueSchema).optional(),
})

export const ticketAdminFieldsSchema = z.object({
  slaId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
})

export const ticketWatchersSchema = z.object({
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
})

// Role-based ticket creation schemas
export const createCustomerTicketSchema = ticketBasicInfoSchema
  .merge(ticketAttachmentsSchema)
  .merge(ticketWatchersSchema)

export const createAgentTicketSchema = createCustomerTicketSchema
  .merge(ticketAgentFieldsSchema)

export const createAdminTicketSchema = createAgentTicketSchema
  .merge(ticketAdminFieldsSchema)

// Response schemas
export const ticketResponseSchema = z.object({
  content: z
    .string()
    .min(1, 'Response cannot be empty')
    .max(10000, 'Response is too long'),
  isInternal: z.boolean().default(false),
  attachments: z.array(attachmentSchema).optional(),
})

// Template schemas
export const ticketTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  subject: z.string().min(5).max(100),
  content: z.string().min(20).max(10000),
  categoryId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  slaId: z.string().uuid().optional(),
  customFields: z.array(customFieldValueSchema).optional(),
  isPublic: z.boolean().default(true),
})

// Bulk action schemas
export const bulkTicketUpdateSchema = z.object({
  ticketIds: z.array(z.string().uuid()),
  updates: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignedToId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    tags: z.array(z.string().uuid()).optional(),
  }),
})

// Type exports
export type CreateCustomerTicketInput = z.infer<typeof createCustomerTicketSchema>
export type CreateAgentTicketInput = z.infer<typeof createAgentTicketSchema>
export type CreateAdminTicketInput = z.infer<typeof createAdminTicketSchema>
export type TicketResponse = z.infer<typeof ticketResponseSchema>
export type TicketTemplate = z.infer<typeof ticketTemplateSchema>
export type BulkTicketUpdate = z.infer<typeof bulkTicketUpdateSchema>
export type Tag = z.infer<typeof tagSchema>
export type Attachment = z.infer<typeof attachmentSchema>
export type CustomFieldValue = z.infer<typeof customFieldValueSchema> 