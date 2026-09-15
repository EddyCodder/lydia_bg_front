@AGENTS.md

---

# lydia_bg_front — notas de Brittany Group

Fork propio de [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) (CRM-8, 2026-09-15; carpeta y repo renombrados el mismo día de `chatwoot_brittanygroup` a `lydia_bg_front`). Reemplaza a la imagen `chatwoot/chatwoot:latest` de Docker Hub que usa `CRM_brittanygroup/docker-compose.yml` — ese cambio (buildear desde este fork en vez de pullear la imagen oficial) todavía no está hecho.

**Ojo con el nombre**: pese a "front", esto es el fork de Chatwoot (Ruby on Rails, con su propia UI Vue embebida) — no es un frontend Next.js. El front real de Lydia (lo que ven las asesoras en el navegador) está en `CRM_brittanygroup/frontend/`.

Ver `CRM_brittanygroup/CLAUDE.md` para el contexto completo del proyecto CRM (Chatwoot + Evolution API + Lydia). Para comandos de desarrollo/build/test propios de Chatwoot, ver `AGENTS.md` arriba (documentación original del proyecto, no tocada).

## Remotos

- `origin` → `EddyCodder/lydia_bg_front` (el fork, donde se pushea).
- `upstream` → `chatwoot/chatwoot` (el oficial, para traer actualizaciones: `git fetch upstream` + merge/rebase).

## ⚠️ Licencia — leer antes de tocar código

- El core es **MIT**.
- El directorio **`enterprise/`** tiene su propia licencia (Chatwoot Enterprise): exige una suscripción paga de Chatwoot para uso en producción. **No activar ni depender de nada de `enterprise/`** sin confirmar que hay una suscripción vigente.

## Flujo

Igual que el resto del ecosistema Brittany: ningún cambio de código sin ticket `CRM-` primero (ver `docs_ragnargroup/flujo_desarrollo.md` y el `CLAUDE.md` del workspace).
