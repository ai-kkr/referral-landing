export interface ReferralPeek {
  valid: boolean;
  code: string;
  inviter_name: string;
  reward_credits: number;
}

const STORAGE_KEY = "kkr:referral_code";
const AUTH_TOKEN_KEY = "kkr:auth_token";
const USER_KEY = "kkr:auth_user";

export function getStoredReferralCode(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeReferralCode(code: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, code);
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export function parseReferralCodeFromUrl(): string | null {
  const url = new URL(window.location.href);
  
  // 1. Check search params: ?code=XYZ or ?refer_id=XYZ
  const queryCode = url.searchParams.get("code") || url.searchParams.get("refer_id");
  if (queryCode && queryCode.trim()) {
    return queryCode.trim();
  }

  // 2. Check path: /invite/:code
  const pathParts = url.pathname.split("/").filter(Boolean);
  const inviteIndex = pathParts.indexOf("invite");
  if (inviteIndex !== -1 && pathParts[inviteIndex + 1]) {
    return decodeURIComponent(pathParts[inviteIndex + 1]).trim();
  }

  return null;
}

export function getApiBaseUrl(): string {
  return (
    import.meta.env.VITE_KKR_API_BASE?.replace(/\/$/, "") ||
    import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
    ""
  );
}

export async function fetchReferralPeek(code: string): Promise<ReferralPeek | null> {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/api/v2/referral/peek/${encodeURIComponent(code)}`, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return {
      valid: Boolean(data.valid),
      code: String(data.code || code),
      inviter_name: String(data.inviter_name || "друга"),
      reward_credits: Number(data.reward_credits || 1000),
    };
  } catch {
    // In offline or local preview, provide fallback
    return {
      valid: true,
      code,
      inviter_name: "друга",
      reward_credits: 1000,
    };
  }
}

export interface UserSession {
  token: string;
  name?: string;
  email?: string;
}

export function getStoredUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserSession(user: UserSession): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_TOKEN_KEY, user.token);
  } catch {
    // ignore
  }
}

export const TESTFLIGHT_URL =
  import.meta.env.VITE_TESTFLIGHT_URL || "https://testflight.apple.com/join/RcxSZjuP";
