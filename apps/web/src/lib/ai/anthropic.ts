import Anthropic from '@anthropic-ai/sdk'
import type {
  AIClassifyInput,
  AIClassifyOutput,
  AIProvider,
  MeetingSummaryInput,
  MeetingSummaryOutput,
} from './types'
import { SYSTEM_PROMPT, MEETING_SUMMARY_SYSTEM } from './prompt'

let _client: Anthropic | null = null
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!_client) _client = new Anthropic()
  return _client
}

export const anthropicProvider: AIProvider = {
  name: 'anthropic',
  async classifyIncidence(input: AIClassifyInput): Promise<AIClassifyOutput> {
    const client = getClient()
    if (!client) throw new Error('ANTHROPIC_API_KEY not configured')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input.description }],
    })

    const text = (response.content[0] as Anthropic.TextBlock).text
    return parseJsonOutput(text)
  },
  async summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummaryOutput> {
    const client = getClient()
    if (!client) throw new Error('ANTHROPIC_API_KEY not configured')

    const userMsg = [
      `Comunidad: ${input.communityName}`,
      `Fecha: ${input.meetingDate}`,
      `Título: ${input.title}`,
      '',
      'Transcripción:',
      input.transcript,
    ].join('\n')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250930',
      max_tokens: 2500,
      system: MEETING_SUMMARY_SYSTEM,
      messages: [{ role: 'user', content: userMsg }],
    })

    const text = (response.content[0] as Anthropic.TextBlock).text.trim()
    return { summary: stripCodeFence(text) }
  },
}

function stripCodeFence(text: string): string {
  const fenceMatch = text.match(/^```(?:markdown|md)?\s*([\s\S]*?)```\s*$/)
  return fenceMatch ? fenceMatch[1].trim() : text
}

function parseJsonOutput(text: string): AIClassifyOutput {
  // El modelo puede envolver el JSON en ```json```; intentamos extraer
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)```/) ?? trimmed.match(/\{[\s\S]*\}/)
  const raw = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : trimmed
  return JSON.parse(raw) as AIClassifyOutput
}
