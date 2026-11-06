# Referral landing 8ty

Vite + React; сборка — `pnpm build`, локальный запуск — `pnpm dev`.

Регистрация нового пользователя по реферальной ссылке через Google или Apple
сохраняет привязку со статусом `registered_web`. На лендинге показано, что бонус
ожидает первого входа в тот же аккаунт в приложении 8ty для iOS. Только статус
`rewarded` подтверждает начисление. При первом iOS-входе бэкенд начисляет бонус
приглашённому и пригласившему; повторный вход не дублирует начисление.

Статусы `self_referral` и `already_registered` не обещают новый бонус.
`isNewUser` сам по себе не подтверждает начисление. API: `VITE_KKR_API_BASE`;
OAuth — `/auth/google/callback`, `/auth/apple/callback`, проверка ссылки —
`GET /api/v2/referral/peek/{code}`.
