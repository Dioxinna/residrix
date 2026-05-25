// Transcripción de audio vía Groq Whisper Large v3 Turbo.
// Anthropic no ofrece STT en su API, así que la transcripción es
// groq-only. El resumen posterior sí pasa por el AIProvider configurado.

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3-turbo'

export interface TranscriptionResult {
  text: string
  durationSeconds: number | null
  language: string | null
}

export async function transcribeAudio(
  audio: Blob,
  filename: string,
): Promise<TranscriptionResult> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY not configured — required for transcription')

  const form = new FormData()
  form.append('file', audio, filename)
  form.append('model', WHISPER_MODEL)
  form.append('language', 'es')
  form.append('response_format', 'verbose_json')
  // Temperature 0 = más conservador; menos alucinaciones en silencios.
  form.append('temperature', '0')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Groq Whisper ${res.status}: ${errText.slice(0, 300)}`)
  }

  const json = (await res.json()) as {
    text?: string
    duration?: number
    language?: string
  }

  if (!json.text) throw new Error('Groq Whisper returned no text')

  return {
    text: json.text.trim(),
    durationSeconds: typeof json.duration === 'number' ? Math.round(json.duration) : null,
    language: json.language ?? null,
  }
}
