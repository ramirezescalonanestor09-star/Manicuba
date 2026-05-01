'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { API_URL, SITE_URL } from '@/lib/api';

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  description: string;
  allergiesNote: string;
  budgetEstimate: string;
  preferredCurrency: 'CUP' | 'MLC' | 'USD' | '';
  preferredChannel: 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'SMS' | 'INAPP' | '';
  requestedSlot: string;
  consentContact: boolean;
}

export default function AgendarPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ token: string } | null>(null);

  const [form, setForm] = useState<FormState>({
    fullName: '',
    phone: '',
    email: '',
    description: '',
    allergiesNote: '',
    budgetEstimate: '',
    preferredCurrency: '',
    preferredChannel: '',
    requestedSlot: '',
    consentContact: false,
  });

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm({ ...form, [k]: v });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list.slice(0, 5));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        description: form.description,
        allergiesNote: form.allergiesNote || undefined,
        budgetEstimate: form.budgetEstimate ? Number(form.budgetEstimate) : undefined,
        preferredCurrency: form.preferredCurrency || undefined,
        preferredChannel: form.preferredChannel || undefined,
        requestedSlot: form.requestedSlot
          ? new Date(form.requestedSlot).toISOString()
          : undefined,
        consentContact: form.consentContact,
      };
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      files.forEach((f) => fd.append('images', f));

      const res = await fetch(`${API_URL}/api/public/tenants/${params.slug}/requests`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const json = await res.json();
      setDone({ token: json.publicToken });
      setTimeout(() => router.push(`/r/${json.publicToken}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-rose-700">Solicitud enviada!</h1>
        <p className="mt-3 text-rose-900/80">
          Te llevaremos a tu pagina de seguimiento. Tambien puedes guardar este enlace:
        </p>
        <p className="mt-3 break-all text-sm text-rose-700">
          {SITE_URL}/r/{done.token}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold text-rose-700">Pedir cotizacion</h1>
      <p className="mt-2 text-rose-900/80">
        Cuentanos que disenas, sube fotos de inspiracion y te contactamos con un precio.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tu nombre</label>
            <input
              className="input"
              required
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Telefono</label>
            <input
              className="input"
              required
              placeholder="+53..."
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Correo (opcional)</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Que disenas?</label>
          <textarea
            className="input min-h-[100px]"
            required
            placeholder="Cuentanos colores, estilo, longitud, ocasion..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Fotos de inspiracion (hasta 5)</label>
          <input type="file" accept="image/*" multiple onChange={onFileChange} />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-rose-900/60">{files.length} foto(s) seleccionadas</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Alergias o cuidados</label>
            <input
              className="input"
              value={form.allergiesNote}
              onChange={(e) => update('allergiesNote', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Presupuesto aprox</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.budgetEstimate}
              onChange={(e) => update('budgetEstimate', e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Moneda preferida</label>
            <select
              className="input"
              value={form.preferredCurrency}
              onChange={(e) => update('preferredCurrency', e.target.value as any)}
            >
              <option value="">Sin preferencia</option>
              <option value="CUP">CUP</option>
              <option value="MLC">MLC</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="label">Como prefieres que te contactemos?</label>
            <select
              className="input"
              value={form.preferredChannel}
              onChange={(e) => update('preferredChannel', e.target.value as any)}
            >
              <option value="">Cualquiera</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
              <option value="EMAIL">Correo</option>
              <option value="SMS">SMS</option>
              <option value="INAPP">Aqui mismo (chat)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Fecha y hora preferidas (opcional)</label>
          <input
            className="input"
            type="datetime-local"
            value={form.requestedSlot}
            onChange={(e) => update('requestedSlot', e.target.value)}
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.consentContact}
            onChange={(e) => update('consentContact', e.target.checked)}
          />
          <span>Acepto que la manicuri me contacte por mi telefono o correo.</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </main>
  );
}
