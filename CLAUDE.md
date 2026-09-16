# lydia_bg_front

Frontend de Lydia (CRM WhatsApp de Brittany Group): Next.js/TypeScript/Tailwind v4 — bandeja de conversaciones, pipeline de leads, calendario, automatizaciones e insights. Consume la API de `lydia_bg_back` (Evolution API, fork propio).

## Historia (CRM-11)

Hasta el 2026-09-16 este repo era un fork de [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) (Ruby on Rails), usado como bandeja compartida multi-agente. Se descartó: su build de Docker tardaba 20+ minutos por la gema `grpc` (integración con Dialogflow, sin uso real), y el proyecto ya tenía un frontend propio (Next.js, hecho en `CRM_brittanygroup/frontend/`, tickets CRM-7/8/9) más avanzado en UX que la bandeja de Chatwoot. Se decidió migrar lo útil de Chatwoot a ese frontend propio en vez de seguir cargando con todo Chatwoot, y ese frontend pasó a vivir en este repo (reemplazando el código de Chatwoot). El historial de Chatwoot queda en el `git log` de este repo por si hace falta consultar algo puntual.

`CRM_brittanygroup` (el repo donde vivía este frontend) se eliminó por completo — no tenía nada más relevante para Brittany (el resto era CRM_lab, un proyecto sin relación, que ya vive aparte).

## Estado de la conexión a datos (CRM-9, CRM-11, CRM-12)

- El inbox (`src/lib/chatwoot/`) todavía habla el protocolo de la Application API de Chatwoot, apagado por defecto (`NEXT_PUBLIC_CHATWOOT_ENABLED=false` en `.env.example` — sin eso, cae a datos de ejemplo en vez de romperse). Esto es intencional por ahora: **CRM-11 solo movió el código, no reemplazó las llamadas** — sirve para no bloquear el deploy mientras se construye el backend real.
- Pipelines, leads, calendario, automatizaciones e insights siguen sobre `src/lib/mock-data.ts`, sin persistencia real.
- **CRM-12** (siguiente paso, backlog): construir en `lydia_bg_back` los endpoints que hoy daría Chatwoot (conversaciones, asignación de agente, notas internas, estado leído/labels) y apuntar `src/lib/chatwoot/` ahí en vez de a una instancia de Chatwoot. Evaluar entonces si conviene renombrar esa carpeta.

## Despliegue

VPS de Brittany (`144.91.113.27`), Docker, dominio `crm.brittanygroup.edu.pe`. El `docker-compose.yml` de la stack completa (frontend + Evolution API + Postgres + Redis) vive en `lydia_bg_back/deploy/lydia-prod/` (ver ese `DEPLOYMENT.md`) — este repo solo aporta su propio `Dockerfile` y el workflow de CI (`.github/workflows/deploy.yml`, solo `main`, sin selector de entorno).

## Flujo

Igual que el resto del ecosistema Brittany: ningún cambio de código sin ticket `CRM-` primero.
