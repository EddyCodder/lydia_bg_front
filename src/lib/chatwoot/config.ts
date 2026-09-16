/**
 * Interruptor para la conexion real a Chatwoot. Por defecto apagado: sin
 * credenciales configuradas, insistir con fetch + reintentos solo agrega
 * demora antes de caer al mock (CRM-9). Poner
 * NEXT_PUBLIC_CHATWOOT_ENABLED=true en .env.local junto con
 * CHATWOOT_BASE_URL/CHATWOOT_API_TOKEN/CHATWOOT_ACCOUNT_ID cuando haya una
 * instancia real para probar.
 */
export const CHATWOOT_ENABLED = process.env.NEXT_PUBLIC_CHATWOOT_ENABLED === "true";
