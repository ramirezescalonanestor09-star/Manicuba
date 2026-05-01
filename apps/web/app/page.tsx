import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold text-rose-700">Manicuba</h1>
      <p className="mt-3 text-lg text-rose-900/80">
        La plataforma cubana para manicuris: gestiona tus clientas, recibe solicitudes con
        fotos de inspiracion y cotiza al instante via WhatsApp, Telegram, correo o SMS.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link className="card hover:shadow-md" href="/registro">
          <h2 className="text-xl font-semibold text-rose-700">Soy manicuri</h2>
          <p className="mt-2 text-sm text-rose-900/70">
            Crea tu enlace publico, organiza tu agenda y cobra mejor.
          </p>
          <span className="mt-4 inline-block text-rose-600">Crear cuenta gratis →</span>
        </Link>
        <Link className="card hover:shadow-md" href="/m/salon-demo">
          <h2 className="text-xl font-semibold text-rose-700">Soy clienta</h2>
          <p className="mt-2 text-sm text-rose-900/70">
            Mira un perfil de manicuri demo y prueba el formulario de solicitud.
          </p>
          <span className="mt-4 inline-block text-rose-600">Ver demo →</span>
        </Link>
      </div>

      <div className="mt-10 card">
        <h3 className="text-lg font-semibold text-rose-700">Hecho pensando en Cuba</h3>
        <ul className="mt-3 space-y-1 text-sm text-rose-900/80">
          <li>• Multi-moneda CUP, MLC y USD.</li>
          <li>• Funciona con conexiones lentas (PWA optimizada).</li>
          <li>• Compartir cotizaciones via WhatsApp/Telegram sin pasarela.</li>
          <li>• Backup exportable de tus clientas.</li>
        </ul>
      </div>
    </main>
  );
}
