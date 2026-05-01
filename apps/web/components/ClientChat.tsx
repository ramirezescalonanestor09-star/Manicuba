'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { publicApi } from '@/lib/api';
import { connectSocket } from '@/lib/socket';

interface Attachment {
  id: string;
  storageKey: string;
}

interface Message {
  id: string;
  fromType: 'CLIENT' | 'MANICURI' | 'SYSTEM';
  body: string;
  createdAt: string;
  attachments?: Attachment[];
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
  const socketRef = useRef<Socket | null>(null);

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
    const socket = connectSocket({ publicToken: threadToken });
    socketRef.current = socket;
    socket.on('new-message', (msg: Message) => {
      setThread((t) =>
        t && !t.messages.find((m) => m.id === msg.id)
          ? { ...t, messages: [...t.messages, msg] }
          : t,
      );
    });
    socket.on('disconnect', () => {});
    const fallback = setInterval(load, 30_000);
    return () => {
      clearInterval(fallback);
      socket.disconnect();
    };
  }, [threadToken]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-message', { body: text });
      setBody('');
    } else {
      try {
        await publicApi(`/public/threads/${threadToken}/messages`, {
          method: 'POST',
          json: { body: text },
        });
        setBody('');
        load();
      } catch {
        /* ignore */
      }
    }
    setSending(false);
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
            {m.body && <p>{m.body}</p>}
            {m.attachments && m.attachments.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {m.attachments.map((a) => (
                  <a key={a.id} href={`/files/${a.storageKey}`} target="_blank" rel="noreferrer">
                    <img
                      src={`/files/${a.storageKey}`}
                      alt=""
                      className="h-24 w-full rounded-lg object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
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
