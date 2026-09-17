import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * LYD-2: verifica el ID token que devuelve Firebase Auth (Google Sign-In)
 * contra el JWKS publico de Google -- mismo mecanismo que firebase-admin
 * usa por debajo, sin necesitar una service account (credencial que no se
 * puede provisionar desde aca). Firebase ID tokens son JWTs estandar
 * firmados por la cuenta de servicio "securetoken", verificables con
 * iss/aud fijos por proyecto.
 */

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const ALLOWED_EMAIL_DOMAIN = "brittanygroup.edu.pe";

export interface GoogleIdentity {
  email: string;
  name: string;
}

export class InvalidIdTokenError extends Error {}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (!FIREBASE_PROJECT_ID) {
    throw new Error("Falta configurar NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    }));
  } catch {
    throw new InvalidIdTokenError("Token invalido o expirado");
  }

  const email = typeof payload.email === "string" ? payload.email : null;
  const emailVerified = payload.email_verified === true;
  const name = typeof payload.name === "string" ? payload.name : email;

  if (!email || !emailVerified) {
    throw new InvalidIdTokenError("Email no verificado");
  }
  // El parametro hd del picker de Google (client.ts) es UX, no seguridad --
  // esta es la validacion real de dominio.
  if (!email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    throw new InvalidIdTokenError(`Dominio no permitido: ${email}`);
  }

  return { email, name: name ?? email };
}
