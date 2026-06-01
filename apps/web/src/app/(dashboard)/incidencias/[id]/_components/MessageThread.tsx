'use client'

import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  profiles: { full_name: string; role: string } | null
}

interface Props {
  incidenceId: string
  initialMessages: Message[]
  aiResponse?: string
}

export function MessageThread({ incidenceId, initialMessages, aiResponse }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel(`incidence-messages-${incidenceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'incidence_messages',
        filter: `incidence_id=eq.${incidenceId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('incidence_messages')
          .select('*, profiles!sender_id(full_name, role)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages((prev) => [...prev, data as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [incidenceId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(isInternal: boolean) {
    if (!content.trim()) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }
    await supabase.from('incidence_messages').insert({
      incidence_id: incidenceId,
      sender_id: user.id,
      content: content.trim(),
      is_internal: isInternal,
    })
    setContent('')
    setSending(false)
  }

  return (
    <section className="glass rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[color:var(--glass-border)]">
        <h2 className="text-ink font-semibold text-sm">Mensajes ({messages.length})</h2>
      </div>

      <div className="divide-y divide-[color:var(--glass-border)] max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <p className="px-6 py-8 text-center text-ink-faint text-sm">No hay mensajes aún</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn('px-6 py-4', msg.is_internal && 'bg-amber-950/20')}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-ink text-xs font-medium">{msg.profiles?.full_name ?? 'Sistema'}</span>
              {msg.is_internal && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-1.5 py-0.5 rounded">
                  Nota interna
                </span>
              )}
              <span className="text-ink-faint text-xs ml-auto">
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
            <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-[color:var(--glass-border)] space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje al vecino..."
          rows={3}
          className="w-full glass-strong border border-[color:var(--glass-border)] rounded-lg px-3 py-2.5 text-ink placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
        />
        {aiResponse && !content && (
          <button onClick={() => setContent(aiResponse)} className="text-violet-400 text-xs hover:text-brand-soft transition-colors">
            ✦ Usar respuesta IA
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => sendMessage(false)}
            disabled={sending || !content.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            Enviar al vecino
          </button>
          <button
            onClick={() => sendMessage(true)}
            disabled={sending || !content.trim()}
            className="px-4 bg-amber-900/50 hover:bg-amber-900/70 disabled:opacity-50 disabled:cursor-not-allowed text-amber-400 text-sm font-medium rounded-lg py-2 border border-amber-800/50 transition-colors"
          >
            Nota interna
          </button>
        </div>
      </div>
    </section>
  )
}
