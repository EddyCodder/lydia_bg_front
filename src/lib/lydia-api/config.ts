/**
 * Interruptor para la conexion real al backend de Lydia (Evolution API,
 * lydia_bg_back). Por defecto apagado: sin credenciales/instancia
 * configuradas, insistir con fetch + reintentos solo agrega demora antes de
 * caer al mock (CRM-9, mantenido en CRM-12). Poner
 * NEXT_PUBLIC_LYDIA_API_ENABLED=true en .env.local junto con
 * EVOLUTION_API_URL/EVOLUTION_API_KEY/EVOLUTION_INSTANCE_NAME una vez que
 * haya un numero de WhatsApp conectado a la instancia (ver manager de
 * Evolution API) -- antes de eso no hay conversaciones reales que mostrar.
 */
export const LYDIA_API_ENABLED = process.env.NEXT_PUBLIC_LYDIA_API_ENABLED === "true";
