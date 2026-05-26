import {Icon} from "@iconify/react";
import {Card, Button} from "@heroui/react";
import {useQuery} from "@tanstack/react-query";
import {PanelChrome} from "./PanelChrome";
import {AgentAvatar} from "../AIHub/AgentAvatar";
import {useToasts} from "../../store/toast";
import {api} from "../../lib/api/rest";

interface MenuItem {
  icon: string;
  label: string;
  hint?: string;
  warn?: boolean;
  danger?: boolean;
  toastTitle?: string;
  toastBody?: string;
}

const MENU: MenuItem[] = [
  {icon: "gravity-ui:person", label: "Аккаунт", toastTitle: "Управление аккаунтом", toastBody: "Раздел в разработке"},
  {icon: "gravity-ui:shield-check", label: "Безопасность", hint: "2FA выключен", warn: true, toastTitle: "Включи 2FA", toastBody: "Защити аккаунт за 30 секунд через Google Authenticator"},
  {icon: "gravity-ui:identification", label: "Верификация (KYC)", hint: "Не пройдена", toastTitle: "Пройди KYC", toastBody: "Доступ к выводам > $1000/день требует верификации"},
  {icon: "gravity-ui:key", label: "API-ключи", toastTitle: "API-ключи", toastBody: "Создание ключей в разработке"},
  {icon: "gravity-ui:globe", label: "Язык", hint: "Русский", toastTitle: "Язык интерфейса", toastBody: "Доступно: Русский, English"},
  {icon: "gravity-ui:moon", label: "Тема", hint: "Тёмная", toastTitle: "Тема", toastBody: "Светлая тема в разработке"},
  {icon: "gravity-ui:gear", label: "Настройки торговли", toastTitle: "Настройки торговли", toastBody: "Скоро: видимость стакана, дефолтное плечо, подтверждения"},
  {icon: "gravity-ui:circle-question", label: "Помощь и обратная связь", toastTitle: "Поддержка", toastBody: "Напиши в Telegram @walbicom или открой чат поддержки"},
  {icon: "gravity-ui:arrow-right-from-square", label: "Выйти", danger: true, toastTitle: "Сессия завершена", toastBody: "Заглушка — в demo нет авторизации"},
];

export function ProfilePanel() {
  const push = useToasts((s) => s.push);

  // LIVE data: hits /api/walbi/user/profile/v1 via proxy → walbi-mcp → gw.walbi.com
  const profile = useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => api.user.profile(),
    staleTime: 5 * 60_000,
  });

  const displayName = profile.data?.name ?? "Walbi user";
  const displayEmail = profile.data?.email ?? "";
  const displayId = profile.data?.user_id;
  const isLoading = profile.isLoading;
  const isError = profile.isError;

  return (
    <PanelChrome title="Профиль">
      <div className="space-y-4 p-4">
        <Card className="rounded-2xl">
          <Card.Content className="flex items-center gap-3 p-4">
            {profile.data?.picture ? (
              <img
                src={profile.data.picture}
                alt={displayName}
                className="size-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <AgentAvatar name={displayName} size={48} />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {isLoading ? "…" : displayName}
              </div>
              <div className="truncate text-[11px] text-muted">
                {isLoading ? "загрузка…" : displayEmail || "—"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px]">
                <span
                  className={[
                    "rounded-full px-1.5 py-0.5",
                    isError
                      ? "bg-danger/15 text-danger"
                      : isLoading
                        ? "bg-surface-secondary text-muted"
                        : "bg-success/15 text-success",
                  ].join(" ")}
                >
                  {isError ? "Offline" : isLoading ? "…" : "Live"}
                </span>
                {displayId ? (
                  <span className="rounded-full bg-surface-secondary px-1.5 py-0.5 text-muted">
                    ID #{displayId}
                  </span>
                ) : null}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="space-y-3 p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Подписка</div>
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Walbi Pro</span>
              <span className="text-xs text-muted">до 24.06.2026</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onPress={() => push({title: "Управление подпиской", description: "Раздел в разработке", tone: "info"})}
            >
              Управлять подпиской
            </Button>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="divide-y divide-border p-0">
            {MENU.map((m) => (
              <button
                key={m.label}
                onClick={() =>
                  push({
                    title: m.toastTitle ?? m.label,
                    description: m.toastBody,
                    tone: m.danger ? "danger" : m.warn ? "info" : "info",
                  })
                }
                className={[
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-secondary",
                  m.danger ? "text-danger" : "",
                ].join(" ")}
              >
                <Icon
                  icon={m.icon}
                  className={[
                    "size-4 shrink-0",
                    m.warn ? "text-warning" : m.danger ? "text-danger" : "text-muted",
                  ].join(" ")}
                />
                <span className="flex-1">{m.label}</span>
                {m.hint ? (
                  <span className={["text-[10px]", m.warn ? "text-warning" : "text-muted"].join(" ")}>
                    {m.hint}
                  </span>
                ) : null}
                {!m.danger ? (
                  <Icon icon="gravity-ui:chevron-right" className="size-3.5 text-muted" />
                ) : null}
              </button>
            ))}
          </Card.Content>
        </Card>

        <div className="pt-2 text-center text-[10px] text-muted">
          Walbi Exchange · v3.0.0 · Production
        </div>
      </div>
    </PanelChrome>
  );
}
