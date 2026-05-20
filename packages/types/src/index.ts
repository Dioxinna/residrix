// ===== ENTIDADES CORE =====

export type UserRole = 'admin' | 'president' | 'neighbor' | 'tenant'

// Roles asignables vía invitación (admin se crea por otra vía).
export type InvitableRole = Exclude<UserRole, 'admin'>

export type IncidenceStatus =
  | 'open'
  | 'in_progress'
  | 'pending_neighbor'
  | 'resolved'
  | 'closed'

export type IncidenceUrgency = 'low' | 'medium' | 'high' | 'critical'

export type IncidenceCategory =
  | 'plumbing'      // fontanería
  | 'electricity'   // electricidad
  | 'cleaning'      // limpieza
  | 'elevator'      // ascensor
  | 'structure'     // estructura / obra
  | 'access'        // acceso / puertas
  | 'noise'         // ruido / convivencia
  | 'other'

export interface Firm {
  id: string
  name: string
  email: string
  phone?: string
  plan: 'base' | 'pro' | 'total'
  communities_count: number
  created_at: string
}

export interface Community {
  id: string
  firm_id: string
  name: string
  address: string
  city: string
  postal_code: string
  units_count: number
  president_id?: string
  created_at: string
}

export interface Profile {
  id: string               // = auth.users.id
  role: UserRole
  full_name: string
  phone?: string
  community_id?: string    // null si es admin de despacho
  firm_id?: string         // null si es vecino
  unit_number?: string     // piso/puerta del vecino
  created_at: string
}

export type DevicePlatform = 'ios' | 'android' | 'web'

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: DevicePlatform
  last_seen_at: string
  created_at: string
}

export type NotificationEvent =
  | 'new_incidence'
  | 'status_change'
  | 'new_message'
  | 'new_announcement'
  | 'invite_code'

export type NotificationChannel = 'push' | 'email'

export interface NotificationPreferences {
  user_id: string
  push_new_incidence: boolean
  push_status_change: boolean
  push_new_message: boolean
  push_new_announcement: boolean
  email_new_incidence: boolean
  email_status_change: boolean
  email_new_message: boolean
  email_new_announcement: boolean
  email_invite_code: boolean
  updated_at: string
}

export type AnnouncementSeverity = 'info' | 'warning' | 'urgent'

export interface Announcement {
  id: string
  community_id: string
  author_id: string
  title: string
  body: string
  severity: AnnouncementSeverity
  created_at: string
  updated_at: string
}

export interface Incidence {
  id: string
  community_id: string
  reported_by: string      // profile id
  title: string
  description: string
  category: IncidenceCategory
  urgency: IncidenceUrgency
  status: IncidenceStatus
  photo_url?: string
  ai_summary?: string      // resumen generado por IA
  ai_response?: string     // respuesta inicial generada por IA
  admin_notes?: string     // notas internas del administrador
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface IncidenceMessage {
  id: string
  incidence_id: string
  sender_id: string
  content: string
  is_internal: boolean     // true = nota interna del admin, no visible al vecino
  created_at: string
}

export interface Document {
  id: string
  community_id: string
  name: string
  description?: string
  file_url: string
  file_size: number
  mime_type: string
  category: 'acta' | 'estatutos' | 'seguro' | 'presupuesto' | 'circular' | 'other'
  uploaded_by: string
  is_public: boolean       // true = todos los vecinos, false = solo admin/presidente
  created_at: string
}

export interface Invitation {
  id: string
  community_id: string
  unit_number: string
  email?: string
  code: string
  role: InvitableRole
  used_by?: string
  used_at?: string
  expires_at: string
  created_at: string
}

// ===== PAYLOADS API =====

export interface CreateIncidencePayload {
  community_id: string
  title: string
  description: string
  category: IncidenceCategory
  photo_url?: string
}

export interface UpdateIncidencePayload {
  status?: IncidenceStatus
  admin_notes?: string
}

export interface AIClassificationResult {
  urgency: IncidenceUrgency
  category: IncidenceCategory
  summary: string
  suggested_response: string
}
