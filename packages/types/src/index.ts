// ===== ENTIDADES CORE =====

export type UserRole = 'admin' | 'president' | 'neighbor' | 'tenant'

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
  push_token?: string      // Expo push token
  created_at: string
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
  code: string
  role: UserRole
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
