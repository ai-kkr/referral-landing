import { getApiBaseUrl, getStoredReferralCode } from "./api";

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state?: string;
          nonce?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            code: string;
            id_token: string;
            state?: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
            email?: string;
          };
        }>;
      };
    };
  }
}

export function appleClientId(): string {
  return (
    import.meta.env.VITE_APPLE_CLIENT_ID?.trim() ||
    "com.aikkr.Workspace.web"
  );
}

export function appleRedirectUri(): string {
  return `${window.location.origin}/auth/apple/callback`;
}

export async function signInWithAppleWeb(): Promise<{
  token: string;
  name?: string;
  email?: string;
  isNewUser?: boolean;
  referralStatus?: string | null;
  referralMessage?: string | null;
  inviterName?: string | null;
}> {
  if (!window.AppleID) {
    throw new Error("Apple Sign In SDK еще не загрузился. Пожалуйста, обновите страницу.");
  }

  const clientId = appleClientId();
  const inviteToken = getStoredReferralCode();
  const apiBase = getApiBaseUrl();

  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: appleRedirectUri(),
    state: inviteToken || undefined,
    usePopup: true,
  });

  const res = await window.AppleID.auth.signIn();

  const fullName = [res.user?.name?.firstName, res.user?.name?.lastName]
    .filter(Boolean)
    .join(" ") || undefined;
  const email = res.user?.email || undefined;

  const backendRes = await fetch(`${apiBase}/auth/apple/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      rqUID: crypto.randomUUID(),
    },
    body: JSON.stringify({
      identityToken: res.authorization.id_token,
      authorizationCode: res.authorization.code,
      fullName,
      email,
      inviteToken: inviteToken || undefined,
    }),
  });

  if (!backendRes.ok) {
    const errorBody = await backendRes.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Ошибка авторизации Apple (HTTP ${backendRes.status})`);
  }

  const data = await backendRes.json();
  return {
    token: data.accessToken || data.token || "token",
    name:
      fullName ||
      data.profile?.displayName ||
      (data.profile?.email ? data.profile.email.split("@")[0] : undefined),
    email: email || data.profile?.email,
    isNewUser: data.isNewUser,
    referralStatus: data.referralStatus,
    referralMessage: data.referralMessage,
    inviterName: data.inviterName,
  };
}
