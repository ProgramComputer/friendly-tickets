"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/lib/constants/routes"
import { createBrowserClient } from '@supabase/ssr'
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      // Determine role based on email domain
      const role = values.email.endsWith('@admin.autocrm.com')
        ? 'admin'
        : values.email.endsWith('@agent.autocrm.com')
          ? 'agent'
          : 'customer'
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      })

      if (error) {
        console.error('Signup error:', error)
        toast.error(error.message)
        return
      }

      if (data?.user) {
        // Create the appropriate record based on role
        if (role === 'customer') {
          const { error: customerError } = await supabase
            .from('customers')
            .insert({
              user_id: data.user.id,
              email: values.email,
              name: values.email.split('@')[0], // Use email prefix as initial name
            })

          if (customerError) {
            console.error('Customer creation error:', customerError)
            // If customer creation fails, clean up the auth user
            await supabase.auth.admin.deleteUser(data.user.id)
            toast.error("Failed to create customer profile")
            return
          }
        } else {
          // Create team member record for admin/agent
          const { error: teamMemberError } = await supabase
            .from('team_members')
            .insert({
              user_id: data.user.id,
              email: values.email,
              name: values.email.split('@')[0], // Use email prefix as initial name
              role: role,
            })

          if (teamMemberError) {
            console.error('Team member creation error:', teamMemberError)
            // If team member creation fails, clean up the auth user
            await supabase.auth.admin.deleteUser(data.user.id)
            toast.error("Failed to create team member profile")
            return
          }
        }

        // Sign in immediately after signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })

        if (signInError) {
          toast.error('Account created but automatic login failed. Please log in manually.')
          router.push(ROUTES.auth.login)
          return
        }

        toast.success("Account created successfully!")
        // Redirect based on role
        switch (role) {
          case 'admin':
            router.push(ROUTES.admin.overview)
            break
          case 'agent':
            router.push(ROUTES.agent.workspace)
            break
          default:
            router.push(ROUTES.dashboard.home)
        }
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error(error instanceof Error ? error.message : "An error occurred while creating your account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Choose your email domain based on your role:
          </CardDescription>
          <div className="mt-2 space-y-2 rounded-lg bg-muted p-4 text-sm">
            <p>
              <span className="font-semibold">Admin:</span> Use{" "}
              <code className="rounded bg-primary/10 px-1">@admin.autocrm.com</code>
            </p>
            <p>
              <span className="font-semibold">Agent:</span> Use{" "}
              <code className="rounded bg-primary/10 px-1">@agent.autocrm.com</code>
            </p>
            <p>
              <span className="font-semibold">Customer:</span> Use any other email domain
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={ROUTES.auth.login}
              className="text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 