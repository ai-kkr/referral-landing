import React, { useEffect, useState } from "react";
import { Check, ArrowRight, Download, Sparkles } from "lucide-react";
import { AvatarCollage } from "./components/AvatarCollage";
import {
  parseReferralCodeFromUrl,
  getStoredReferralCode,
  storeReferralCode,
  fetchReferralPeek,
  type ReferralPeek,
  getStoredUser,
  saveUserSession,
  TESTFLIGHT_URL,
} from "./lib/api";
import { beginGoogleLogin, exchangeGoogleCode } from "./lib/google-oauth";

export const App: React.FC = () => {
  const [referralCode, setReferralCode] = useState<string>("8ty");
  const [peekData, setPeekData] = useState<ReferralPeek | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    // 1. Resolve referral code
    const urlCode = parseReferralCodeFromUrl();
    const resolvedCode = urlCode || getStoredReferralCode() || "8ty";
    setReferralCode(resolvedCode);
    if (urlCode) {
      storeReferralCode(urlCode);
    }

    // 2. Check for OAuth callback in query parameters
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    const authState = params.get("state");
    const authSuccess = params.get("auth_success");
    const userNameParam = params.get("user_name");

    if (authSuccess) {
      // Mock / preview callback
      const user = { name: userNameParam ? decodeURIComponent(userNameParam) : "Друг" };
      saveUserSession({ token: "token", name: user.name });
      setAuthenticatedUser(user);
      return;
    }

    if (authCode && authState) {
      setAuthLoading(true);
      exchangeGoogleCode(authCode, authState)
        .then((res) => {
          const user = { name: res.name || "Друг" };
          saveUserSession({ token: res.token, name: user.name });
          setAuthenticatedUser(user);
          // Clean up URL query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err: Error) => {
          setAuthError(err.message || "Не удалось завершить авторизацию");
        })
        .finally(() => {
          setAuthLoading(false);
        });
      return;
    }

    // 3. Check existing saved session
    const existing = getStoredUser();
    if (existing) {
      setAuthenticatedUser(existing);
    }

    // 4. Fetch peek info
    fetchReferralPeek(resolvedCode).then((info) => {
      if (info) {
        setPeekData(info);
      }
    });
  }, []);

  const handleGoogleClick = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await beginGoogleLogin();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка запуска входа Google";
      setAuthError(msg);
      setAuthLoading(false);
    }
  };

  const handleAppleClick = () => {
    // For Apple ID on mobile web landing, if configured, trigger Apple OAuth or notify
    setAuthLoading(true);
    // Simulating instant authorization for web preview or redirecting
    setTimeout(() => {
      const user = { name: "Пользователь Apple" };
      saveUserSession({ token: "apple-token-" + Date.now(), name: user.name });
      setAuthenticatedUser(user);
      setAuthLoading(false);
    }, 600);
  };

  const handleInstallClick = () => {
    window.location.href = TESTFLIGHT_URL;
  };

  const inviterName = peekData?.inviter_name || "друга";
  const rewardAmount = peekData?.reward_credits || 1000;

  return (
    <div className="relative min-h-dvh flex flex-col justify-between bg-gradient-to-b from-[#402BFF]/15 via-[#F2F2F7] to-[#F2F2F7] text-[#0B0B0E] px-4 py-6 sm:py-10 max-w-md mx-auto">
      {/* Top Brand Pill Header */}
      <header className="flex items-center justify-between w-full px-2 pt-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#402BFF] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-base tracking-tighter">8</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#0B0B0E]">8ty</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-black/5 text-xs font-medium text-neutral-600 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#402BFF]" />
          <span>iOS Приглашение</span>
        </div>
      </header>

      {/* Main Container Card */}
      <main className="flex-1 flex flex-col items-center justify-center w-full my-auto">
        {/* Floating Avatar Collage matching iOS */}
        <div className="w-full relative -mb-4">
          <AvatarCollage seed={referralCode} />
        </div>

        {/* Dynamic Card Content: Unauthenticated vs Authenticated */}
        {!authenticatedUser ? (
          <div className="w-full flex flex-col items-center text-center mt-2 px-2">
            {/* Title with SF Pro expanded look */}
            <div className="flex flex-col items-center font-bold tracking-tight text-[30px] sm:text-[34px] leading-[1.08] text-[#0B0B0E]">
              <span>Делитесь</span>
              <span>приложением</span>
              <span>с друзьями</span>
            </div>

            {/* Reward Pill Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/50 text-[#008A55] font-semibold text-sm">
              <span>+{rewardAmount.toLocaleString("ru-RU")} бонусов</span>
            </div>

            {/* Subtitle / Description */}
            <p className="mt-3 text-neutral-600 text-[15px] sm:text-base leading-snug max-w-[320px]">
              {peekData?.inviter_name ? (
                <>
                  Приглашение от <span className="font-semibold text-[#0B0B0E]">{inviterName}</span>. Авторизуйтесь, чтобы получить бонусы.
                </>
              ) : (
                "Авторизуйтесь, чтобы закрепить за собой бонусы при регистрации."
              )}
            </p>

            {/* Error Message if any */}
            {authError && (
              <div className="w-full mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-center">
                {authError}
              </div>
            )}

            {/* Auth Buttons */}
            <div className="w-full flex flex-col gap-2.5 mt-8 px-2">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={authLoading}
                className="w-full h-[54px] rounded-full bg-white hover:bg-neutral-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-black/10 shadow-sm font-semibold text-[15px] text-[#0B0B0E]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading ? "Авторизация..." : "Войти через Google"}</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleAppleClick}
                disabled={authLoading}
                className="w-full h-[54px] rounded-full bg-[#0B0B0E] hover:bg-neutral-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-white shadow-md font-semibold text-[15px]"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.85-11.7-14.44-6.42-10.23-11.27-21.6-14.54-34.13-3.27-12.52-4.9-24.32-4.9-35.39 0-14.58 3.63-26.68 10.9-36.31 7.27-9.63 16.5-14.58 27.69-14.86 4.79 0 10.36 1.34 16.71 4.02 6.36 2.68 10.33 4.08 11.91 4.2 1.9-.35 6.08-1.87 12.54-4.56 6.46-2.69 12.02-3.88 16.71-3.56 12.63.76 22.8 5.25 30.5 13.48-11.01 6.64-16.39 15.86-16.14 27.68.25 9.79 4.12 18.06 11.61 24.81 7.49 6.74 16.36 10.74 26.61 12-2.17 6.64-4.78 13.06-7.84 19.26zm-29.69-114.7c0 6.63-2.48 12.78-7.44 18.45-5.98 6.75-13.19 10.72-21.63 10.72-.25-.87-.38-1.63-.38-2.28 0-6.41 2.65-12.82 7.95-18.45 2.83-3.04 6.27-5.59 10.32-7.65 4.05-2.07 7.78-3.17 11.18-3.32.01.84.01 1.68 0 2.53z" />
                </svg>
                <span>Войти с Apple</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Success Screen with Single Clean CTA */
          <div className="w-full flex flex-col items-center text-center mt-2 px-2 animate-in fade-in zoom-in-95 duration-500">
            {/* Success Checkmark Badge */}
            <div className="w-16 h-16 rounded-full bg-[#00FFA3] flex items-center justify-center text-[#0B0B0E] shadow-lg shadow-[#00FFA3]/30 mb-4">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <h2 className="font-bold tracking-tight text-[28px] sm:text-[32px] leading-tight text-[#0B0B0E]">
              Вы успешно
              <br />
              зарегистрировались!
            </h2>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/50 text-[#008A55] font-semibold text-sm">
              <span>+{rewardAmount.toLocaleString("ru-RU")} бонусов зарезервировано</span>
            </div>

            <p className="mt-4 text-neutral-600 text-[15px] sm:text-base leading-snug max-w-[300px]">
              Установите приложение и войдите под своим аккаунтом, чтобы получить начисление.
            </p>

            {/* Prominent Single CTA Button matching iOS .workspaceInk */}
            <div className="w-full mt-8 px-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full h-[64px] sm:h-[70px] rounded-full bg-[#0B0B0E] hover:bg-neutral-900 active:scale-[0.97] transition-all flex items-center justify-center gap-3 text-white shadow-xl shadow-black/15 font-semibold text-[17px] sm:text-[18px] group"
              >
                <Download className="w-5 h-5 text-[#00FFA3] group-hover:translate-y-0.5 transition-transform" />
                <span>Установить приложение</span>
                <ArrowRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center pt-6 pb-2 text-xs text-neutral-400">
        <span>8ty • Путешествия с персональным агентом</span>
      </footer>
    </div>
  );
};

