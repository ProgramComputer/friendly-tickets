"use client"

import { type ReactNode } from "react"
import { useAuth, type FeatureFlag, type UserRole } from "@/lib/hooks/use-auth"

interface RoleGateProps {
  children: ReactNode
  requireFeature?: FeatureFlag
  allowedRoles?: UserRole[]
  fallback?: ReactNode
}

export function RoleGate({ 
  children, 
  requireFeature,
  allowedRoles,
  fallback = null 
}: RoleGateProps) {
  const { canAccessFeature, role, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (requireFeature && !canAccessFeature(requireFeature)) {
    return fallback
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return fallback
  }

  return <>{children}</>
} 