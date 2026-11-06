import React, { useEffect, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { AppleMarkWhite, GoogleMarkWhite } from "./components/AuthIosIcons";
import { IosGlassPillStack } from "./components/IosGlassPillStack";
import {
  parseReferralCodeFromUrl,
  getStoredReferralCode,
  storeReferralCode,
  fetchReferralPeek,
  type ReferralPeek,
  type UserSession,
  getStoredUser,
  saveUserSession,
  TESTFLIGHT_URL,
} from "./lib/api";
import { beginGoogleLogin, exchangeGoogleCode } from "./lib/google-oauth";
import { signInWithAppleWeb } from "./lib/apple-oauth";

export const App: React.FC = () => {
  const [peekData, setPeekData] = useState<ReferralPeek | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserSession | null>(null);
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  useEffect(() => {
    // 1. Resolve referral code
    const urlCode = parseReferralCodeFromUrl();
    const resolvedCode = urlCode || getStoredReferralCode() || "8ty";
    if (urlCode) {
      storeReferralCode(urlCode);
    }

    // 2. Check for OAuth callback in query parameters
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    const authState = params.get("state");

    if (authCode && authState) {
      setAuthLoading(true);
      exchangeGoogleCode(authCode, authState)
        .then((res) => {
          const user: UserSession = {
            token: res.token,
            name: res.name || "Друг",
            email: res.email,
            isNewUser: res.isNewUser,
            referralStatus: res.referralStatus,
            referralMessage: res.referralMessage,
            inviterName: res.inviterName,
          };
          saveUserSession(user);
          setAuthenticatedUser(user);
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

  const handleAppleClick = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await signInWithAppleWeb();
      const user: UserSession = {
        token: res.token,
        name: res.name || "Друг",
        email: res.email,
        isNewUser: res.isNewUser,
        referralStatus: res.referralStatus,
        referralMessage: res.referralMessage,
        inviterName: res.inviterName,
      };
      saveUserSession(user);
      setAuthenticatedUser(user);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Ошибка авторизации через Apple ID";
      if (!/popup_closed_by_user/i.test(msg)) {
        setAuthError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const inviterName = peekData?.inviter_name || null;
  const rewardAmount = peekData?.reward_credits || 1000;

  return (
    <div className="relative w-full h-dvh max-h-dvh flex flex-col justify-between bg-white text-black overflow-hidden font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
      {/* Top Section: Radial Gradient with Perspective Glass Pills Stack */}
      <div
        className="relative w-full flex-1 min-h-0 flex flex-col items-center justify-end rounded-b-[44px] overflow-hidden"
        style={{
          background:
            "radial-gradient(130% 90% at 50% 0%, #1500E6 0%, #3D10EB 35%, #7010F5 65%, #A24BFE 90%, #E8EBFF 100%)",
        }}
      >
        <IosGlassPillStack />
      </div>

      {/* Bottom Section: Pure White Card */}
      <div className="w-full flex-shrink-0 bg-white px-7 pt-4 pb-8 sm:pb-10 flex flex-col items-center max-w-md mx-auto">
        {authenticatedUser ? (
          /* Post-Authentication Screen -> State-dependent */
          <div className="w-full flex flex-col items-center text-center py-2 animate-in fade-in duration-300">
            {authenticatedUser.referralStatus === "self_referral" ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#402BFF]/10 text-[#402BFF] font-semibold text-[13px] mb-3">
                  <span>ℹ️</span>
                  <span>Ваша реферальная ссылка</span>
                </div>

                <h2 className="text-[22px] font-bold tracking-tight text-[#0B0B0E] mb-1">
                  Вы уже в 8ty!
                </h2>

                <p className="text-[14px] text-[#6E6E73] mb-5 leading-snug max-w-[320px]">
                  Это ваша личная ссылка. Поделитесь ею с друзьями, чтобы получать по {rewardAmount.toLocaleString("ru-RU")} бонусов за каждого приглашённого!
                </p>

                <div className="w-full flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="w-full h-[52px] rounded-full bg-[#402BFF] hover:bg-[#3824E5] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white font-semibold text-[16px] shadow-md shadow-[#402BFF]/20 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4 stroke-[2]" />}
                    <span>{copied ? "Ссылка скопирована!" : "Скопировать ссылку"}</span>
                  </button>

                  <a
                    href={TESTFLIGHT_URL}
                    className="w-full h-[48px] rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[#0B0B0E] font-medium text-[15px] cursor-pointer"
                  >
                    <Download className="w-4 h-4 stroke-[2]" />
                    <span>Открыть приложение</span>
                  </a>
                </div>
              </>
            ) : authenticatedUser.referralStatus === "registered_web" || authenticatedUser.referralStatus === "rewarded" || authenticatedUser.isNewUser === true ? (
              /* New user (friend) -> +1000 bonuses! */
              <>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#00FFA3]/20 text-[#008A55] font-semibold text-[13px] mb-3">
                  <span>✓</span>
                  <span>+{rewardAmount.toLocaleString("ru-RU")} бонусов зачислено</span>
                </div>

                <h2 className="text-[22px] font-bold tracking-tight text-[#0B0B0E] mb-1">
                  {authenticatedUser.name ? `Привет, ${authenticatedUser.name}!` : "Всё готово!"}
                </h2>

                <p className="text-[14px] text-[#6E6E73] mb-5 leading-snug">
                  Установите приложение 8ty для iOS и войдите в аккаунт, чтобы активировать бонусы.
                </p>

                <a
                  href={TESTFLIGHT_URL}
                  className="w-full h-[54px] rounded-full bg-[#F600FF] hover:bg-[#E000E8] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-white font-semibold text-[17px] shadow-lg shadow-[#F600FF]/30 cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Установить приложение</span>
                </a>
              </>
            ) : (
              /* Existing user -> Already registered */
              <>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FF9500]/15 text-[#C97000] font-semibold text-[13px] mb-3">
                  <span>✓</span>
                  <span>Аккаунт уже зарегистрирован</span>
                </div>

                <h2 className="text-[22px] font-bold tracking-tight text-[#0B0B0E] mb-1">
                  {authenticatedUser.name ? `С возвращением, ${authenticatedUser.name}!` : "Вы уже с нами!"}
                </h2>

                <p className="text-[14px] text-[#6E6E73] mb-5 leading-snug max-w-[320px]">
                  Вы уже зарегистрированы в 8ty. Реферальный бонус начисляется новым пользователям при первой регистрации.
                </p>

                <a
                  href={TESTFLIGHT_URL}
                  className="w-full h-[52px] rounded-full bg-[#402BFF] hover:bg-[#3824E5] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-white font-semibold text-[16px] shadow-md shadow-[#402BFF]/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2]" />
                  <span>Открыть приложение</span>
                </a>
              </>
            )}
          </div>
        ) : (
          /* Native iOS Authorization Screen matching Screenshot 2 */
          <div className="w-full flex flex-col items-center">
            {/* Optional Inviter Label */}
            {inviterName && (
              <div className="text-center mb-3">
                <p className="text-[13.5px] font-medium text-[#6E6E73] flex items-center justify-center gap-1.5">
                  <span>Вас пригласил {inviterName}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#00FFA3]/20 text-[#008A55]">
                    • +{rewardAmount.toLocaleString("ru-RU")} бонусов
                  </span>
                </p>
              </div>
            )}

            {/* Provider Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={authLoading}
                className="w-full h-[52px] rounded-full bg-[#402BFF] hover:bg-[#3824E5] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-white font-medium text-[17px] shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <GoogleMarkWhite className="w-[20px] h-[20px]" />
                <span>{authLoading ? "Входим…" : "Продолжить с Google"}</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleAppleClick}
                disabled={authLoading}
                className="w-full h-[52px] rounded-full bg-[#402BFF] hover:bg-[#3824E5] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-white font-medium text-[17px] shadow-sm disabled:opacity-60 cursor-pointer"
              >
                <AppleMarkWhite className="w-[18px] h-[22px]" />
                <span>Продолжить с Apple ID</span>
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <p className="mt-2 text-center text-xs text-red-500 font-medium">
                {authError}
              </p>
            )}

            {/* Legal Disclaimer Footer */}
            <p className="mt-4 text-center text-[11.5px] leading-[1.38] text-[#AEAFB2] max-w-[315px] mx-auto select-none">
              Нажимая «Продолжить», я даю согласие на обработку моих персональных данных в соответствии с{" "}
              <button
                type="button"
                onClick={() => setLegalModal("privacy")}
                className="underline underline-offset-2 hover:text-[#7A7B7E] transition-colors inline cursor-pointer"
              >
                Согласием на обработку персональных данных
              </button>{" "}
              и принимаю условия{" "}
              <button
                type="button"
                onClick={() => setLegalModal("terms")}
                className="underline underline-offset-2 hover:text-[#7A7B7E] transition-colors inline cursor-pointer"
              >
                Пользовательского соглашения
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Simple Legal Modal Sheet if requested */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-3">
              {legalModal === "privacy"
                ? "Политика конфиденциальности"
                : "Пользовательское соглашение"}
            </h3>
            <div className="flex-1 overflow-y-auto text-sm text-[#48484A] leading-relaxed space-y-2 pr-1">
              <p>
                Сервис 8ty обрабатывает персональные данные в строгом соответствии с применимым законодательством.
                Мы не передаем ваши данные третьим лицам для рекламных целей.
              </p>
              <p>
                Авторизуясь в сервисе, вы подтверждаете согласие с условиями обслуживания и правилами конфиденциальности.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="mt-4 w-full h-11 rounded-full bg-[#402BFF] text-white font-medium text-sm"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
