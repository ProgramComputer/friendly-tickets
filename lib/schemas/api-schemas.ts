import { z } from 'zod'
import {
  ticketTemplateSchema,
  tagSchema,
  customFieldValueSchema,
  ticketResponseSchema,
  createCustomerTicketSchema,
  createAgentTicketSchema,
  createAdminTicketSchema,
  bulkTicketUpdateSchema,
} from './ticket'

// SLA Policy schemas
export const slaPolicySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  responseTimeHours: z.number().min(0),
  resolutionTimeHours: z.number().min(0),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

// Custom Field Definition schemas
export const customFieldDefinitionSchema = z.object({
  name: z.string().min(2).max(50),
  label: z.string().min(2).max(100),
  fieldType: z.enum(['text', 'number', 'boolean', 'select', 'multiselect']),
  required: z.boolean().default(false),
  isInternal: z.boolean().default(false),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
})

// Role-based ticket requests
export const createTicketRequest = z.discriminatedUnion('role', [
  z.object({ role: z.literal('customer'), data: createCustomerTicketSchema }),
  z.object({ role: z.literal('agent'), data: createAgentTicketSchema }),
  z.object({ role: z.literal('admin'), data: createAdminTicketSchema }),
])

// Template requests
export const createTemplateRequest = ticketTemplateSchema

export const updateTemplateRequest = ticketTemplateSchema.partial()

// Tag requests
export const createTagRequest = tagSchema.omit({ id: true })

export const updateTagRequest = tagSchema.partial().omit({ id: true })

// Custom field requests
export const createCustomFieldRequest = customFieldDefinitionSchema

export const updateCustomFieldRequest = customFieldDefinitionSchema.partial()

// SLA requests
export const createSLAPolicyRequest = slaPolicySchema

export const updateSLAPolicyRequest = slaPolicySchema.partial()

// Response requests
export const addTicketResponseRequest = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('customer'),
    data: ticketResponseSchema.omit({ isInternal: true }),
  }),
  z.object({
    role: z.literal('agent'),
    data: ticketResponseSchema,
  }),
  z.object({
    role: z.literal('admin'),
    data: ticketResponseSchema,
  }),
])

// Bulk action requests (agent/admin only)
export const bulkUpdateRequest = z.object({
  role: z.enum(['agent', 'admin']),
  data: bulkTicketUpdateSchema,
})

// API Response schemas
export const apiErrorResponse = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }),
})

export const apiSuccessResponse = z.object({
  data: z.unknown(),
  message: z.string().optional(),
})

// Type exports
export type CreateTicketRequest = z.infer<typeof createTicketRequest>
export type SLAPolicy = z.infer<typeof slaPolicySchema>
export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>
export type CreateTemplateRequest = z.infer<typeof createTemplateRequest>
export type UpdateTemplateRequest = z.infer<typeof updateTemplateRequest>
export type CreateTagRequest = z.infer<typeof createTagRequest>
export type UpdateTagRequest = z.infer<typeof updateTagRequest>
export type CreateCustomFieldRequest = z.infer<typeof createCustomFieldRequest>
export type UpdateCustomFieldRequest = z.infer<typeof updateCustomFieldRequest>
export type CreateSLAPolicyRequest = z.infer<typeof createSLAPolicyRequest>
export type UpdateSLAPolicyRequest = z.infer<typeof updateSLAPolicyRequest>
export type AddTicketResponseRequest = z.infer<typeof addTicketResponseRequest>
export type BulkUpdateRequest = z.infer<typeof bulkUpdateRequest>
export type APIErrorResponse = z.infer<typeof apiErrorResponse>
export type APISuccessResponse = z.infer<typeof apiSuccessResponse> 