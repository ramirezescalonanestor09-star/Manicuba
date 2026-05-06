import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Camera,
  CreditCard,
  Globe,
  MessagesSquare,
  Shield,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div>
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md">
              <Sparkles size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight">Manicuba</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost text-sm">
              Entrar
            </Link>
            <Link href="/registro" className="btn-primary text-sm">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 md:px-6 md:pt-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="animate-fade-up">
              <span className="chip-primary">Hecho en Cuba, para Cuba</span>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                <span className="heading-grad">Tu salon</span>, en el bolsillo de cada clienta.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-fg-soft">
                Recibe solicitudes con fotos de inspiracion, cotiza al instante y agenda sin
                lios. CUP, MLC y USD. Funciona aunque tu internet ande lento.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/registro" className="btn-primary">
                  Empieza gratis
                  <ArrowRight size={16} />
                </Link>
                <Link href="/m/salon-demo" className="btn-ghost">
                  Ver demo
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-fg-muted">
                <span className="flex items-center gap-2">
                  <Shield size={14} /> Sin tarjeta de credito
                </span>
                <span className="flex items-center gap-2">
                  <Globe size={14} /> Tu enlace publico propio
                </span>
              </div>
            </div>

            <div className="relative animate-fade-up [animation-delay:120ms]">
              <PreviewCard />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight md:text-4xl">
            Todo lo que necesitas, <span className="heading-grad">nada de mas</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-fg-soft">
            Disenado para el dia a dia de la manicuri cubana. Cero curva de aprendizaje.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Camera size={20} />}
              title="Solicitudes con fotos"
              text="Tu clienta sube hasta 5 fotos de inspiracion y cuenta lo que quiere. Tu cotizas al ver el detalle."
            />
            <Feature
              icon={<MessagesSquare size={20} />}
              title="WhatsApp, Telegram y mas"
              text="Envia la cotizacion al instante con un click — wa.me, t.me, correo o SMS prellenados."
            />
            <Feature
              icon={<CreditCard size={20} />}
              title="Multi-moneda"
              text="Cobra en CUP, MLC o USD. Configura tus tasas y la app sugiere conversiones."
            />
            <Feature
              icon={<Calendar size={20} />}
              title="Agenda con conflictos"
              text="Bloquea horarios, evita citas solapadas y manda recordatorio 24h antes."
            />
            <Feature
              icon={<PiggyBankIcon />}
              title="Caja con ingresos y gastos"
              text="Registra pagos, propinas y materiales. Mira tu ganancia neta por moneda."
            />
            <Feature
              icon={<WifiOff size={20} />}
              title="Funciona con poco internet"
              text="PWA instalable, fotos optimizadas y cache para zonas con conexion intermitente."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
          <div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-primary-soft to-accent-soft p-10 text-center md:p-14">
            <h3 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Listo para profesionalizar tu salon?
            </h3>
            <p className="max-w-xl text-fg-soft">
              Crea tu cuenta en 30 segundos y obten un enlace para compartir hoy mismo en tus
              redes.
            </p>
            <Link href="/registro" className="btn-primary mt-2">
              Crear mi cuenta gratis
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-fg-muted">
        <p>
          Hecho con cariño para las manicuris cubanas. Manicuba {new Date().getFullYear()}.
        </p>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card card-hover">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-fg-soft">{text}</p>
    </div>
  );
}

function PiggyBankIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
      <path d="M2 9v1c0 1.1.9 2 2 2h1" />
      <path d="M16 11h0" />
    </svg>
  );
}
