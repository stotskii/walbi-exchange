import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

// Multi-sub-account architecture (Walbi insight #10):
//   Funding / Trading / AI Agents / Memepool — each card drills into its own
//   sub-tab. Aggregated stats appear in the hero.

const ACCOUNTS = [
  {name: "Фандинговый", balance: "59 014,00 $", share: "61,58%", color: "bg-accent"},
  {name: "Торговый", balance: "5 554,20 $", share: "5,79%", color: "bg-success"},
  {name: "Мемепул", balance: "0,00 $", share: "0,00%", color: "bg-warning"},
  {name: "ИИ-агенты", balance: "31 270,80 $", share: "32,63%", color: "bg-danger"},
];

function WalletPage() {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Кошелек</h1>

      <Card className="rounded-2xl">
        <Card.Content className="space-y-4 p-4">
          <div>
            <div className="text-xs text-muted">Предполагаемая общая стоимость</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-semibold">95 848,00</span>
              <span className="text-muted">USD</span>
            </div>
            <div className="text-xs text-danger">−87,03 USD (−0,09%)</div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:max-w-md">
            <Action icon="gravity-ui:arrow-down-to-line" label="Депозит" />
            <Action icon="gravity-ui:arrow-up-from-line" label="Вывести" />
            <Action icon="gravity-ui:arrows-rotate-left" label="Перевод" />
            <Action icon="gravity-ui:circles-3-plus" label="Своп" />
          </div>
        </Card.Content>
      </Card>

      <div>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-muted">
          Распределение
        </h2>
        <div className="grid gap-3 md:grid-cols-4">
          {ACCOUNTS.map((acc) => (
            <Card key={acc.name} className="rounded-2xl">
              <Card.Content className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span
                    className={["inline-block size-2.5 rounded-full", acc.color].join(" ")}
                  />
                  {acc.name}
                </div>
                <div className="mt-2 text-lg font-semibold">{acc.balance}</div>
                <div className="text-xs text-muted">{acc.share}</div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Action({icon, label}: {icon: string; label: string}) {
  return (
    <Button
      variant="ghost"
      className="flex h-auto flex-col items-center gap-1 py-3"
      size="sm"
    >
      <Icon icon={icon} className="size-5" />
      <span className="text-xs">{label}</span>
    </Button>
  );
}
