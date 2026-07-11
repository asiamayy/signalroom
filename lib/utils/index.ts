import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Plan, PlanLimits } from '@/types'
import { PLAN_LIMITS } from '@/types'

// ─── Tailwind className merge ─────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Design tokens ────────────────────────────────────────────────────────────
// Shared card elevation — used across Home's editorial sections so every
// card reads as a distinct, lifted surface rather than a flat bordered box.
export const CARD_SHADOW = '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06)'

// ─── Plan helpers ─────────────────────────────────────────────────────────────

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function canCreatePersona(plan: Plan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].personas
}

export function canRunInterview(plan: Plan, monthlyCount: number): boolean {
  return monthlyCount < PLAN_LIMITS[plan].interviews_per_month
}

// ─── Persona avatar helpers ───────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#FBEAF0', text: '#993556' },
]

export function getAvatarColor(name: string) {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// ─── Interview type labels ────────────────────────────────────────────────────

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  concept_testing: 'Concept testing',
  pricing_discovery: 'Pricing discovery',
  message_testing: 'Message testing',
  competitive_positioning: 'Competitive positioning',
  feature_prioritization: 'Feature prioritization',
  custom: 'Custom interview',
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

// ─── Sentiment color ──────────────────────────────────────────────────────────

export function getSentimentColor(sentiment: string) {
  const map: Record<string, string> = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-100',
    mixed: 'text-amber-600 bg-amber-50',
  }
  return map[sentiment] ?? map.neutral
}

// ─── Priority color ───────────────────────────────────────────────────────────

export function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-emerald-600 bg-emerald-50',
  }
  return map[priority] ?? map.medium
}

// ─── Signal type / status color ───────────────────────────────────────────────

export function getSignalTypeColor(type: string) {
  const map: Record<string, string> = {
    pain_point: 'text-red-600 bg-red-50',
    objection: 'text-amber-600 bg-amber-50',
    desired_outcome: 'text-emerald-600 bg-emerald-50',
    feature_request: 'text-blue-600 bg-blue-50',
    buying_trigger: 'text-purple-600 bg-purple-50',
    trend: 'text-indigo-600 bg-indigo-50',
    opportunity: 'text-teal-600 bg-teal-50',
    risk: 'text-orange-600 bg-orange-50',
  }
  return map[type] ?? 'text-gray-600 bg-gray-100'
}

export function getSignalStatusColor(status: string) {
  const map: Record<string, string> = {
    emerging: 'text-gray-600 bg-gray-100',
    growing: 'text-amber-600 bg-amber-50',
    validated: 'text-emerald-600 bg-emerald-50',
  }
  return map[status] ?? map.emerging
}

export function getSignalImpactColor(impact: string) {
  const map: Record<string, string> = {
    high: 'text-white bg-[#1C3D2E]',
    medium: 'text-amber-700 bg-amber-50',
    low: 'text-gray-500 bg-gray-100',
  }
  return map[impact] ?? map.medium
}
