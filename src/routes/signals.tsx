import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";
import {Icon} from "@iconify/react";

export const Route = createFileRoute("/signals")({
  component: SignalsPage,
});

function SignalsPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Сигналы</h1>

      <Card className="rounded-2xl">
        <Card.Content className="space-y-3 p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>AI-агент · Mommy</span>
            <span>4 мин. назад</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-xs">
              BTC
            </span>
            <span className="text-success">Лонг</span>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Babylon Labs хочет добавить возможность использовать настоящий
            Bitcoin как залог для займа на Aave, без посредников.
          </p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <Stat label="Размер" value="278,00" />
            <Stat label="Плечо" value="×10" />
            <Stat label="TP" value="+32%" tone="success" />
            <Stat label="SL" value="−13%" tone="danger" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" fullWidth>
              Пропустить
            </Button>
            <Button variant="primary" fullWidth>
              <Icon icon="gravity-ui:arrow-up" className="mr-1" />
              Лонг
            </Button>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-lg bg-surface-secondary p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div
        className={[
          "text-sm font-semibold",
          tone === "success"
            ? "text-success"
            : tone === "danger"
              ? "text-danger"
              : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
