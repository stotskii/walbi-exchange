import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";

export const Route = createFileRoute("/predictions")({
  component: PredictionsPage,
});

function PredictionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Прогнозы</h1>

      <Card className="rounded-2xl">
        <Card.Header className="px-4 pt-3 text-sm text-muted">
          Текущий блок · #596266 · 00:58
        </Card.Header>
        <Card.Content className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Pool side="long" amount="14 $" share={14 / 27} />
            <Pool side="short" amount="13 $" share={13 / 27} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat label="Твоя доля" value="0" />
            <Stat label="Получишь" value="0" />
            <Stat label="Участников" value="3" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="danger-soft" fullWidth>
              Шорт
            </Button>
            <Button variant="primary" fullWidth>
              Лонг
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function Pool({
  side,
  amount,
  share,
}: {
  side: "long" | "short";
  amount: string;
  share: number;
}) {
  const isLong = side === "long";
  return (
    <div
      className={[
        "rounded-xl p-3",
        isLong ? "bg-success/10" : "bg-danger/10",
      ].join(" ")}
    >
      <div
        className={[
          "text-xs uppercase tracking-wide",
          isLong ? "text-success" : "text-danger",
        ].join(" ")}
      >
        {isLong ? "Лонг" : "Шорт"}
      </div>
      <div className="mt-1 text-lg font-semibold">{amount}</div>
      <div className="mt-2 h-1 overflow-hidden rounded bg-surface-secondary">
        <div
          className={[
            "h-full",
            isLong ? "bg-success" : "bg-danger",
          ].join(" ")}
          style={{width: `${Math.round(share * 100)}%`}}
        />
      </div>
    </div>
  );
}

function Stat({label, value}: {label: string; value: string}) {
  return (
    <div className="rounded-lg bg-surface-secondary p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
