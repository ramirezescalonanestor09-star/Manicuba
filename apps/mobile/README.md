# Manicuba Mobile (Expo / React Native)

Carpeta reservada para la aplicacion movil nativa que consumira la misma API que la web.

Plan:

- Stack: Expo + React Native + React Query.
- Reutilizar `@manicuba/shared` para schemas Zod y tipos TS.
- Pantallas iniciales:
  1. Login + registro.
  2. Bandeja de solicitudes (push notifications).
  3. Detalle de solicitud + cotizar + compartir nativo (WhatsApp, Telegram, SMS).
  4. Agenda diaria.
  5. Galeria / portafolio.
- Push: Expo Notifications para avisos cuando llega una solicitud nueva.
- Storage: SecureStore para tokens; offline cache con React Query persist.

Cuando se inicie, se debe agregar como workspace en `pnpm-workspace.yaml` (ya esta cubierto por
`apps/*`) y crear el proyecto con `pnpm create expo-app .`.
