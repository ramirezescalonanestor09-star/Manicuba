'use client';

import { useEffect, useRef, useState } from 'react';
import { publicApi } from '@/lib/api';

interface Message {
  id: string;
  fromType: 'CLIENT' | 'MANICURI' | 'SYSTEM';
  body: string;
  createdAt: string;
}

interface Thread {
  id: string;
  messages: Message[];
}

export function ClientChat({ threadToken }: { threadToken: string }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const t = await publicApi<Thread>(`/public/threads/${threadToken}/messages`);
      setThread(t);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [threadToken]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await publicApi(`/public/threads/${threadToken}/messages`, {
        method: 'POST',
        json: { body: body.trim() },
      });
      setBody('');
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3">
      <div
        ref={containerRef}
        className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl bg-rose-50/50 p-3"
      >
        {thread?.messages.length === 0 && (
          <p className="text-sm text-rose-900/60">Inicia la conversacion.</p>
        )}
        {thread?.messages.map((m) => (
          <div
            key={m.id}
            className={
              m.fromType === 'CLIENT'
                ? 'self-end max-w-[80%] rounded-2xl bg-rose-500 px-3 py-2 text-sm text-white'
                : 'self-start max-w-[80%] rounded-2xl bg-white px-3 py-2 text-sm text-rose-900 shadow-sm'
            }
          >
            {m.body}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="Escribe un mensaje..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !body.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
