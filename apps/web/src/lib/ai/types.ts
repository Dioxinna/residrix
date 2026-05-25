import type { IncidenceCategory, IncidenceUrgency } from '@residrix/types'

export type ProviderType =
  | 'plumber'
  | 'electrician'
  | 'elevator_technician'
  | 'cleaner'
  | 'locksmith'
  | 'glazier'
  | 'general_maintenance'

export const PROVIDER_LABEL: Record<ProviderType, string> = {
  plumber: 'Fontanero',
  electrician: 'Electricista',
  elevator_technician: 'Técnico de ascensor',
  cleaner: 'Limpieza',
  locksmith: 'Cerrajero',
  glazier: 'Cristalero',
  general_maintenance: 'Mantenimiento general',
}

export interface AIClassifyInput {
  description: string
  photoUrl?: string
}

export interface AIClassifyOutput {
  urgency: IncidenceUrgency
  category: IncidenceCategory
  summary: string
  suggested_response: string
  suggested_provider: ProviderType | null
  /**
   * Clave semántica para agrupar incidencias similares dentro de una comunidad.
   * Ejemplos: "elevator-stuck", "leak-bathroom", "lobby-light-out".
   * Slug minúsculas, palabras separadas por guiones, máximo 4 palabras.
   */
  group_key: string
}

export interface MeetingSummaryInput {
  transcript: string
  communityName: string
  meetingDate: string  // ISO date YYYY-MM-DD
  title: string
}

export interface MeetingSummaryOutput {
  /** Markdown con secciones: Resumen, Temas tratados, Acuerdos, Pendientes. */
  summary: string
}

export type AIProviderName = 'anthropic' | 'groq'

export interface AIProvider {
  name: AIProviderName
  classifyIncidence(input: AIClassifyInput): Promise<AIClassifyOutput>
  summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummaryOutput>
}
