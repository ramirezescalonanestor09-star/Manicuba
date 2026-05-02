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
# 1. Instalar dependencias (esto tambien ejecuta `prisma generate` automaticamente)
pnpm install

# 2. Construir el paquete compartido la primera vez
pnpm --filter @manicuba/shared build

# 3. Levantar Postgres + Redis
docker compose up -d

# 4. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 5. Migrar y sembrar la base
pnpm --filter @manicuba/api prisma:migrate
pnpm --filter @manicuba/api prisma:seed

# 6. Levantar todo (API en :4000, web en :3000)
pnpm dev
```

> Si ves errores de import como `Cannot find module '@manicuba/shared'` o
> `@prisma/client did not initialize yet`, mira la seccion de **Resolucion de
> problemas** mas abajo.

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

## Endurecimiento de produccion

- **Helmet** + **compression** activados.
- **CORS** controlado por `CORS_ALLOWED_ORIGINS` (separado por coma; `*` solo en dev).
- **Filtro global de excepciones** mapea Prisma (P2002 conflict, P2025 not found) y
  `HttpException` a un cuerpo JSON consistente: `{ statusCode, message, details? }`.
- **Health check** publico en `GET /api/health` con verificacion de DB.
- **Shutdown hooks** habilitados para cerrar Prisma/BullMQ/sockets de forma limpia.
- **Path traversal** en storage local resuelto con `path.resolve` + verificacion de
  prefijo.
- **Refresco automatico de access token** en el cliente web con cola single-flight; al
  fallar el refresh redirige a `/login` solo si la ruta lo requiere.

## Verificacion

```bash
pnpm --filter @manicuba/shared test          # tests unitarios (phone, currency, share-links)
pnpm --filter @manicuba/api test              # AvailabilityService.assertSlotFree (jest)
curl http://localhost:4000/api/health         # health check
```

## Resolucion de problemas comunes

**1. `Cannot find module '@manicuba/shared'` cuando arranca la API**

El paquete `@manicuba/shared` se exporta desde `dist/`, asi que **necesita estar
construido al menos una vez** antes de levantar la API. Esto pasa solo si saltaste
turbo y ejecutaste `nest start` directo. Solucion:

```bash
pnpm --filter @manicuba/shared build
# o simplemente
pnpm dev      # turbo construye shared antes de arrancar dev
```

**2. `@prisma/client did not initialize yet` o `Cannot find module '.prisma/client'`**

Falta correr `prisma generate`. Lo agregamos como `postinstall`, pero si lo viste antes
de eso, ejecutalo a mano:

```bash
pnpm --filter @manicuba/api prisma:generate
```

**3. Errores de native build en `argon2` o `sharp`**

Son binarios nativos. Necesitas Python 3 y herramientas de build (en Linux:
`build-essential`, en macOS: `xcode-select --install`). Si pnpm con symlinks falla:

```bash
pnpm install --shamefully-hoist
```

**4. CI falla con `ERR_PNPM_NO_LOCKFILE`**

No hay `pnpm-lock.yaml` commiteado. Genera uno localmente con `pnpm install`, commitealo,
y cambia el workflow de CI de `--no-frozen-lockfile` a `--frozen-lockfile`.

**5. Peer dep warnings de React 18 con Next 15**

Son warnings, no errores. Next 15 admite React 18.3.x oficialmente. Ignoralos.

**6. `EADDRINUSE :4000` o `:3000`**

Otro proceso escuchando. `lsof -i :4000` (o `:3000`) para encontrarlo, o cambia
`PORT` en `apps/api/.env`.

**7. `ECONNREFUSED 127.0.0.1:5432` / `:6379`**

Postgres o Redis no levantados:

```bash
docker compose up -d
docker compose logs postgres redis      # ver que estan ok
```

## Roadmap

- App movil nativa (Expo) consumiendo la misma API.
- Push notifications.
- Integracion real con WhatsApp/Telegram via API oficial.
- Recordatorios automaticos via BullMQ + Redis (24h antes de la cita).
- Adapter SMS para Cubacel/ETECSA.
- Pagos cuando exista pasarela viable en Cuba.
- Render IA del diseño sobre la mano.
