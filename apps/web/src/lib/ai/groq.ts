import type {
  AIClassifyInput,
  AIClassifyOutput,
  AIProvider,
  MeetingSummaryInput,
  MeetingSummaryOutput,
} from './types'
import { SYSTEM_PROMPT, MEETING_SUMMARY_SYSTEM } from './prompt'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export const groqProvider: AIProvider = {
  name: 'groq',
  async classifyIncidence(input: AIClassifyInput): Promise<AIClassifyOutput> {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY not configured')

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: input.description },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Groq API ${res.status}: ${errText.slice(0, 200)}`)
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('Groq returned empty content')

    return JSON.parse(content) as AIClassifyOutput
  },
  async summarizeMeeting(input: MeetingSummaryInput): Promise<MeetingSummaryOutput> {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error('GROQ_API_KEY not configured')

    const userMsg = [
      `Comunidad: ${input.communityName}`,
      `Fecha: ${input.meetingDate}`,
      `Título: ${input.title}`,
      '',
      'Transcripción:',
      input.transcript,
    ].join('\n')

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 2500,
        messages: [
          { role: 'system', content: MEETING_SUMMARY_SYSTEM },
          { role: 'user', content: userMsg },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`Groq summarize ${res.status}: ${errText.slice(0, 200)}`)
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = json.choices?.[0]?.message?.content?.trim() ?? ''
    if (!text) throw new Error('Groq returned empty summary')
    const fenceMatch = text.match(/^```(?:markdown|md)?\s*([\s\S]*?)```\s*$/)
    return { summary: fenceMatch ? fenceMatch[1].trim() : text }
  },
}
