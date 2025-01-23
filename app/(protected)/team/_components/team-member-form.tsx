'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useTeamMembers } from '@/lib/hooks/team/use-team-members'
import { useDepartments } from '@/lib/hooks/departments/use-departments'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['agent', 'admin']),
  departmentId: z.string().optional(),
  specialties: z.array(z.string()).optional(),
})

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>

interface TeamMemberFormProps {
  member?: {
    id: string
    name: string
    email: string
    role: 'agent' | 'admin'
    department?: {
      id: string
      name: string
    }
    specialties?: string[]
  }
}

const specialtiesList = [
  'Technical Support',
  'Billing',
  'Account Management',
  'Product Support',
  'Feature Requests',
  'Bug Reports',
]

export function TeamMemberForm({ member }: TeamMemberFormProps) {
  const router = useRouter()
  const { createTeamMember, updateTeamMember } = useTeamMembers()
  const { data: departments } = useDepartments()

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: member?.name || '',
      email: member?.email || '',
      role: member?.role || 'agent',
      departmentId: member?.department?.id,
      specialties: member?.specialties || [],
    },
  })

  async function onSubmit(data: TeamMemberFormValues) {
    try {
      if (member) {
        await updateTeamMember({ id: member.id, ...data })
        toast.success('Team member updated successfully')
      } else {
        await createTeamMember(data)
        toast.success('Team member added successfully')
      }
      router.push('/team')
    } catch (error) {
      console.error('Error saving team member:', error)
      toast.error('Failed to save team member')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="agent">Support Agent</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines the team member's permissions and access level
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments?.map(department => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The department this team member belongs to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialties"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialties</FormLabel>
              <Select
                onValueChange={value =>
                  field.onChange(
                    field.value?.includes(value)
                      ? field.value.filter(item => item !== value)
                      : [...(field.value || []), value]
                  )
                }
                defaultValue={field.value?.[0]}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialties" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {specialtiesList.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Areas of expertise for this team member
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/team')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !form.formState.isDirty}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {member ? 'Updating...' : 'Adding...'}
              </>
            ) : member ? (
              'Update Team Member'
            ) : (
              'Add Team Member'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 