import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '@residrix/supabase'
import type { AIClassificationResult, IncidenceCategory, IncidenceUrgency } from '@residrix/types'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic()

function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  let body: { incidenceId: string; description: string; photoUrl?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { incidenceId, description, photoUrl } = body

  if (!incidenceId || !description) {
    return Response.json({ error: 'incidenceId and description are required' }, { status: 400 })
  }

  // PASO 1: Haiku clasifica urgencia y categoría (barato y rápido)
  let urgency: IncidenceUrgency = 'medium'
  let category: IncidenceCategory = 'other'

  try {
    const classification = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `Eres un clasificador de incidencias para comunidades de vecinos en España.
Responde SOLO con JSON válido, sin texto adicional.
Formato exacto:
{
  "urgency": "low|medium|high|critical",
  "category": "plumbing|electricity|cleaning|elevator|structure|access|noise|other"
}

Criterios de urgencia:
- critical: riesgo para personas (inundación, gas, ascensor atrapado)
- high: afecta a múltiples vecinos o es urgente (avería luz escalera, puerta entrada)
- medium: afecta a uno pero requiere atención pronta (gotera, bajante)
- low: estético o no urgente (pintura, jardín)`,
      messages: [{ role: 'user', content: description }],
    })

    const parsed = JSON.parse((classification.content[0] as Anthropic.TextBlock).text)
    urgency = parsed.urgency as IncidenceUrgency
    category = parsed.category as IncidenceCategory
  } catch (err) {
    console.error('Classification step failed:', err)
    // Continúa con valores por defecto; no bloqueamos la incidencia
  }

  // PASO 2: Sonnet genera resumen y respuesta inicial para el vecino
  let summary = ''
  let suggested_response = ''

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `Eres el asistente virtual de una comunidad de vecinos en España.
Tu tono es profesional, empático y claro. Hablas en español.
Responde SOLO con JSON válido, sin texto adicional.
Formato exacto:
{
  "summary": "Resumen breve de la incidencia en 1 frase (para el administrador)",
  "suggested_response": "Respuesta al vecino confirmando recepción y próximos pasos (2-3 frases)"
}`,
      messages: [
        {
          role: 'user',
          content: `Incidencia reportada:\nCategoría: ${category}\nUrgencia: ${urgency}\nDescripción: ${description}`,
        },
      ],
    })

    const parsed = JSON.parse((response.content[0] as Anthropic.TextBlock).text)
    summary = parsed.summary as string
    suggested_response = parsed.suggested_response as string
  } catch (err) {
    console.error('Summary generation step failed:', err)
  }

  // PASO 3: Actualizar la incidencia en Supabase con los resultados de la IA
  const supabase = createServiceClient()

  const { error: updateError } = await supabase
    .from('incidences')
    .update({
      urgency,
      category,
      ai_summary: summary || null,
      ai_response: suggested_response || null,
      status: urgency === 'critical' ? ('in_progress' as const) : ('open' as const),
    })
    .eq('id', incidenceId)

  if (updateError) {
    console.error('Supabase update failed:', updateError)
    return Response.json({ error: 'Failed to update incidence' }, { status: 500 })
  }

  const result: AIClassificationResult = {
    urgency,
    category,
    summary,
    suggested_response,
  }

  return Response.json(result)
}
