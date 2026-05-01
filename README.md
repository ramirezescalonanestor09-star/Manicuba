# Manicuba

Plataforma SaaS multi-tenant para manicuris cubanas: gestiona clientas, recibe solicitudes
con fotos de inspiracion desde un enlace publico y envia cotizaciones por WhatsApp,
Telegram, correo, SMS o chat in-app. Multi-moneda **CUP / MLC / USD**.

El backend es **API-first** (NestJS + Prisma + PostgreSQL) para que en una segunda fase la
misma API alimente una app movil nativa (React Native + Expo).

## Estructura del monorepo

```
apps/
  api      NestJS REST + WebSocket
  web      Next.js (dashboard manicuri + paginas publicas + PWA)
  mobile   placeholder para futura React Native
packages/
  shared   schemas Zod, tipos TS, utils de moneda y share-links
```

## Requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker + docker compose

## Arranque rapido

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar Postgres + Redis
docker compose up -d

# 3. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Migrar y sembrar la base
pnpm --filter @manicuba/api prisma:generate
pnpm --filter @manicuba/api prisma:migrate
pnpm --filter @manicuba/api prisma:seed

# 5. Levantar todo (API en :4000, web en :3000)
pnpm dev
```

Credenciales del tenant demo creado por el seed:

- URL publica: <http://localhost:3000/m/salon-demo>
- Login dashboard: `demo@manicuba.app` / `manicuba123`

## Flujo principal

1. Manicuri se registra y obtiene un slug publico (`manicuba.app/m/<slug>`).
2. La clienta abre `/m/<slug>/agendar` y manda una solicitud con descripcion + hasta 5 fotos.
3. La manicuri recibe la solicitud en su panel, la revisa y arma una **cotizacion**
   (monto + moneda + mensaje + vigencia).
4. Comparte la cotizacion con un click via:
   - WhatsApp deep link (`wa.me`)
   - Telegram (`t.me/share/url`)
   - Correo (`mailto:`)
   - SMS (`sms:`)
   - Chat in-app dentro del enlace publico de seguimiento
5. La clienta abre `/r/<token>`, ve la cotizacion y puede **aceptar** (se crea la cita) o
   **rechazar/contraproponer** por chat.

## Funcionalidades destacadas

- **Multi-tenant** por `tenantId` con guard global JWT y auditoria de mutaciones criticas.
- **Multi-moneda** CUP, MLC y USD con formato es-CU.
- **Subida de imagenes** optimizada con Sharp; storage local **o** S3/R2 (`STORAGE_DRIVER`).
- **Chat in-app en tiempo real** via WebSocket (Socket.IO) con fallback a polling. Soporta
  imagenes adjuntas desde el lado de la manicuri.
- **Validacion de horarios**: bloquea citas solapadas y respeta las ventanas / excepciones
  configuradas por la manicuri.
- **Recordatorios automaticos** 24h antes (BullMQ + Redis), cancelables al reagendar.
- **Caja**: registra pago + propina + metodo por cita; reporte de ingresos, gastos y
  ganancia neta por moneda.
- **Plantillas de cotizacion** reutilizables, seleccionables al armar el mensaje.
- **Modo "Disponible ahora"** con expiracion automatica, visible en la pagina publica.
- **Backup exportable** en JSON (clientas, servicios, citas, gastos, plantillas, galeria).
- **Recuperacion de contrasena** via correo (token de 1 hora, hash SHA-256 en BD).
- **PWA con service worker**: cache del shell + cache-first de imagenes para zonas con
  conexion intermitente.
- **Adapter SMS** pluggable (`SMS_DRIVER=cubacel` listo para conectar API real).
- **Sistema de fidelizacion** con incremento automatico al cobrar.
- **Portafolio publico** con galeria.
- **Rate-limit** y captcha-friendly en endpoints publicos.

## Comandos utiles

```bash
pnpm dev                                 # API + web en watch
pnpm build                               # build de todo
pnpm typecheck                           # check TypeScript
pnpm --filter @manicuba/api test         # tests unitarios
pnpm --filter @manicuba/api prisma:migrate
```

## Verificacion end-to-end manual

1. `pnpm dev`
2. Abrir <http://localhost:3000/m/salon-demo/agendar> y enviar una solicitud con 1-2 fotos.
3. Iniciar sesion en <http://localhost:3000/login> con `demo@manicuba.app` / `manicuba123`.
4. Ir a *Solicitudes* → abrir la solicitud → cotizar (ej. 3500 CUP).
5. Click en **WhatsApp** y verificar que se abre `wa.me/<phone>?text=...` con el enlace
   `/r/<token>` correctamente.
6. Abrir `/r/<token>` en otra ventana, aceptar la cotizacion. La cita aparece en *Agenda*.
7. Probar el chat in-app desde ambos lados (clienta y manicuri).

## Roadmap

- App movil nativa (Expo) consumiendo la misma API.
- Push notifications.
- Integracion real con WhatsApp/Telegram via API oficial.
- Recordatorios automaticos via BullMQ + Redis (24h antes de la cita).
- Adapter SMS para Cubacel/ETECSA.
- Pagos cuando exista pasarela viable en Cuba.
- Render IA del diseño sobre la mano.
