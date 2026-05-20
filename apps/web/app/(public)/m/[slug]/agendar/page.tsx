'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  Heart,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

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
  const [previews, setPreviews] = useState<string[]>([]);
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
    const list = e.target.files ? Array.from(e.target.files).slice(0, 5) : [];
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(idx: number) {
    setFiles((curr) => curr.filter((_, i) => i !== idx));
    setPreviews((curr) => curr.filter((_, i) => i !== idx));
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
      setTimeout(() => router.push(`/r/${json.publicToken}`), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg">
          <Check size={32} />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">Solicitud enviada!</h1>
        <p className="mt-3 text-fg-soft">
          Te llevamos a tu pagina de seguimiento. Guarda este enlace por si acaso:
        </p>
        <p className="mt-3 break-all rounded-2xl bg-surface-2 px-3 py-2 text-xs text-primary">
          {SITE_URL}/r/{done.token}
        </p>
      </main>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href={`/m/${params.slug}`} className="flex items-center gap-2 text-fg-soft hover:text-fg">
            <ChevronLeft size={18} />
            <span className="text-sm">Volver</span>
          </Link>
          <span className="text-sm font-semibold">Pedir cotizacion</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-20 pt-6 md:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Cuentanos <span className="heading-grad">tu inspiracion</span>
        </h1>
        <p className="mt-2 text-fg-soft">
          Sube fotos, describe tu idea y recibe una cotizacion personalizada.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <Section
            step={1}
            icon={<Heart size={16} />}
            title="Quien eres?"
            description="Para poder contactarte con la cotizacion."
          >
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
                  placeholder="+53 5555 1234"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="label">Correo (opcional)</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
          </Section>

          <Section
            step={2}
            icon={<Sparkles size={16} />}
            title="Que quieres?"
            description="Mientras mas detalles, mas precisa la cotizacion."
          >
            <textarea
              className="input min-h-[120px]"
              required
              placeholder="Cuentanos colores, estilo, longitud, ocasion..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Alergias o cuidados</label>
                <input
                  className="input"
                  placeholder="ej: alergica al acrilico"
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
                  placeholder="Opcional"
                  value={form.budgetEstimate}
                  onChange={(e) => update('budgetEstimate', e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section
            step={3}
            icon={<Camera size={16} />}
            title="Fotos de inspiracion"
            description="Hasta 5 fotos. JPG, PNG o WebP."
          >
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-border-strong bg-surface-2 px-4 py-8 text-center transition hover:border-primary hover:bg-primary-soft/40">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="hidden"
              />
              <Upload className="mx-auto text-fg-muted" size={28} />
              <p className="mt-2 text-sm font-medium">Toca para subir fotos</p>
              <p className="mt-1 text-xs text-fg-muted">o arrastra desde tu galeria</p>
            </label>
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img
                      src={src}
                      alt=""
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-fg text-bg shadow-md"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            step={4}
            icon={<Calendar size={16} />}
            title="Cuando y como"
            description="Tus preferencias para que la manicuri se adapte."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Moneda preferida</label>
                <select
                  className="select"
                  value={form.preferredCurrency}
                  onChange={(e) => update('preferredCurrency', e.target.value as never)}
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
                  className="select"
                  value={form.preferredChannel}
                  onChange={(e) => update('preferredChannel', e.target.value as never)}
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
            <div className="mt-4">
              <label className="label">Fecha y hora preferidas (opcional)</label>
              <input
                className="input"
                type="datetime-local"
                value={form.requestedSlot}
                onChange={(e) => update('requestedSlot', e.target.value)}
              />
            </div>
          </Section>

          <label className="card flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={form.consentContact}
              onChange={(e) => update('consentContact', e.target.checked)}
            />
            <span className="text-fg-soft">
              Acepto que la manicuri me contacte por mi telefono o correo para esta solicitud.
            </span>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full justify-center text-base"
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Section({
  step,
  icon,
  title,
  description,
  children,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-fg-muted">Paso {step}</p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-fg-soft">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
