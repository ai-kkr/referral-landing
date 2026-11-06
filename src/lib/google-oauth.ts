import { getApiBaseUrl, getStoredReferralCode } from "./api";

const PKCE_VERIFIER_KEY = "oauth:google:verifier";
const PKCE_STATE_KEY = "oauth:google:state";

function randomUrlSafe(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64Url(buf);
}

function base64Url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Base64Url(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64Url(digest);
}

export function googleClientId(): string {
  return (
    import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    "880442601175-qq11oc9mhh7m4h08tngh2bad65497rog.apps.googleusercontent.com"
  );
}

export function googleRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

export async function beginGoogleLogin(): Promise<void> {
  const clientId = googleClientId();
  const verifier = randomUrlSafe(32);
  const state = randomUrlSafe(16);
  const challenge = await sha256Base64Url(verifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(PKCE_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  window.location.assign(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}

export async function exchangeGoogleCode(
  code: string,
  state: string,
): Promise<{
  token: string;
  name?: string;
  email?: string;
  isNewUser?: boolean;
  referralStatus?: string | null;
  referralMessage?: string | null;
  inviterName?: string | null;
}> {
  const expectedState = sessionStorage.getItem(PKCE_STATE_KEY);
  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);

  if (!codeVerifier || !expectedState || state !== expectedState) {
    throw new Error("Неверный state OAuth. Попробуйте войти снова.");
  }

  const inviteToken = getStoredReferralCode();
  const apiBase = getApiBaseUrl();

  const res = await fetch(`${apiBase}/auth/google/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      rqUID: crypto.randomUUID(),
    },
    body: JSON.stringify({
      code,
      codeVerifier,
      redirectUri: googleRedirectUri(),
      ...(inviteToken ? { inviteToken } : {}),
    }),
  });

  sessionStorage.removeItem(PKCE_STATE_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Ошибка авторизации (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    token: data.accessToken || data.token || "token",
    name: data.profile?.displayName || data.user?.displayName || data.user?.name,
    email: data.profile?.email,
    isNewUser: data.isNewUser,
    referralStatus: data.referralStatus,
    referralMessage: data.referralMessage,
    inviterName: data.inviterName,
  };
}
