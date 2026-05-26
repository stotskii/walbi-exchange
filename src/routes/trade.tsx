import {createFileRoute} from "@tanstack/react-router";
import {Card, Button} from "@heroui/react";

export const Route = createFileRoute("/trade")({
  component: TradePage,
});

// 4-zone trading layout (chart | orderbook | trade panel | positions).
// Mirrors Walbi's classical Trade view. Real charting will plug into the
// TradingView Charting Library (lazy-loaded chunk).

function TradePage() {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2 p-2 md:p-4">
      <div className="grid gap-2 md:grid-cols-[1fr_280px_320px]">
        <Card className="min-h-[420px] rounded-2xl">
          <Card.Header className="px-4 pt-3 text-sm text-muted">
            BTC/USD · 77 235,02 · <span className="text-success">+0,05%</span>
          </Card.Header>
          <Card.Content className="flex h-full items-center justify-center p-4 text-muted">
            [chart placeholder]
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header className="px-4 pt-3 text-sm text-muted">Стакан</Card.Header>
          <Card.Content className="space-y-1 p-3 font-mono text-xs">
            {[0.339, 0.338, 0.337, 0.336, 0.335].map((p) => (
              <div key={p} className="flex justify-between text-danger">
                <span>{p.toFixed(3)}</span>
                <span className="text-muted">7 710,62</span>
              </div>
            ))}
            <div className="my-1 text-center text-success">77 235,02</div>
            {[0.334, 0.333, 0.332, 0.331, 0.330].map((p) => (
              <div key={p} className="flex justify-between text-success">
                <span>{p.toFixed(3)}</span>
                <span className="text-muted">6 156,50</span>
              </div>
            ))}
          </Card.Content>
        </Card>

        <Card className="rounded-2xl">
          <Card.Header className="px-4 pt-3 text-sm">Открыть позицию</Card.Header>
          <Card.Content className="space-y-3 p-4 text-sm">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-secondary p-1">
              <button className="rounded-lg bg-surface px-3 py-1.5 text-xs">
                Рынок
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs text-muted">
                Лимит
              </button>
            </div>
            <Field label="Сумма" value="0,00" suffix="USDT" />
            <Field label="Плечо" value="×5" />
            <div className="flex gap-2 pt-2">
              <Button variant="primary" fullWidth>
                Лонг
              </Button>
              <Button variant="danger" fullWidth>
                Шорт
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <Card.Header className="px-4 pt-3 text-sm text-muted">Позиции</Card.Header>
        <Card.Content className="p-4 text-sm text-muted">
          Открытых позиций нет.
        </Card.Content>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-muted">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <input
          defaultValue={value}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {suffix ? (
          <span className="text-xs text-muted">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}
