import {Icon} from "@iconify/react";
import {Card, Button} from "@heroui/react";
import {PanelChrome} from "./PanelChrome";
import {AgentAvatar} from "../AIHub/AgentAvatar";

const MENU = [
  {icon: "gravity-ui:person", label: "Аккаунт"},
  {icon: "gravity-ui:shield-check", label: "Безопасность", hint: "2FA выключен", warn: true},
  {icon: "gravity-ui:identification", label: "Верификация (KYC)", hint: "Не пройдена"},
  {icon: "gravity-ui:key", label: "API-ключи"},
  {icon: "gravity-ui:globe", label: "Язык", hint: "Русский"},
  {icon: "gravity-ui:moon", label: "Тема", hint: "Тёмная"},
  {icon: "gravity-ui:gear", label: "Настройки торговли"},
  {icon: "gravity-ui:circle-question", label: "Помощь и обратная связь"},
  {icon: "gravity-ui:arrow-right-from-square", label: "Выйти", danger: true},
];

export function ProfilePanel() {
  return (
    <PanelChrome title="Профиль">
      <div className="space-y-4 p-4">
        <Card className="rounded-2xl">
          <Card.Content className="flex items-center gap-3 p-4">
            <AgentAvatar name="Sergey Stotskii" size={48} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Sergey Stotskii</div>
              <div className="truncate text-[11px] text-muted">stotskii@gmail.com</div>
              <div className="mt-1 flex items-center gap-1 text-[10px]">
                <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-success">Активен</span>
                <span className="rounded-full bg-surface-secondary px-1.5 py-0.5 text-muted">ID #2194502</span>
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
            <Button variant="outline" size="sm" fullWidth>
              Управлять подпиской
            </Button>
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Content className="divide-y divide-border p-0">
            {MENU.map((m) => (
              <button
                key={m.label}
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
