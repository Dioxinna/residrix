import { describe, expect, it } from 'vitest'
import { SYSTEM_PROMPT, MEETING_SUMMARY_SYSTEM } from './prompt'

describe('SYSTEM_PROMPT (incidence classification)', () => {
  it('asks for strict JSON output', () => {
    expect(SYSTEM_PROMPT).toMatch(/JSON/)
  })
  it('documents all four urgency levels', () => {
    for (const level of ['low', 'medium', 'high', 'critical']) {
      expect(SYSTEM_PROMPT).toContain(level)
    }
  })
  it('lists the provider types the schema allows', () => {
    for (const p of ['plumber', 'electrician', 'elevator_technician', 'general_maintenance']) {
      expect(SYSTEM_PROMPT).toContain(p)
    }
  })
  it('explains the group_key convention', () => {
    expect(SYSTEM_PROMPT).toMatch(/group_key/)
  })
})

describe('MEETING_SUMMARY_SYSTEM', () => {
  it('enforces the four required markdown sections', () => {
    expect(MEETING_SUMMARY_SYSTEM).toContain('## Resumen ejecutivo')
    expect(MEETING_SUMMARY_SYSTEM).toContain('## Temas tratados')
    expect(MEETING_SUMMARY_SYSTEM).toContain('## Acuerdos')
    expect(MEETING_SUMMARY_SYSTEM).toContain('## Pendientes')
  })
  it('forbids hallucinating facts', () => {
    expect(MEETING_SUMMARY_SYSTEM).toMatch(/No inventes/i)
  })
  it('demands markdown-only output (no code fence)', () => {
    expect(MEETING_SUMMARY_SYSTEM).toMatch(/SOLO el markdown/i)
  })
})
