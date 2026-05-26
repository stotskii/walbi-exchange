import {createFileRoute} from "@tanstack/react-router";
import {Card} from "@heroui/react";

export const Route = createFileRoute("/memepool")({
  component: MemepoolPage,
});

const TRENDING = [
  {symbol: "ASTEROID", name: "Asteroid", price: "0,01 $", change: "+29%"},
  {symbol: "AVICI", name: "Avici", price: "0,76 $", change: "+28%"},
  {symbol: "CARDS", name: "Collector Crypt", price: "0,15 $", change: "+16%"},
];

const POPULAR = [
  {symbol: "ALPIE", name: "Alpie", mcap: "521 тыс. $", price: "1,09 $", change: "+46%"},
  {symbol: "IBACK", name: "America Is Back", mcap: "1,2 млн $", price: "<0,01 $", change: "+39%"},
  {symbol: "AVA", name: "Ava AI", mcap: "6,9 млн $", price: "<0,01 $", change: "+3,6%"},
];

function MemepoolPage() {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Мемепул</h1>

      <Card className="rounded-2xl">
        <Card.Content className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">
            🔥 В тренде
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto">
            {TRENDING.map((t) => (
              <div
                key={t.symbol}
                className="w-44 shrink-0 rounded-xl bg-surface-secondary p-3"
              >
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted">{t.symbol}</div>
                <div className="mt-2 text-sm">{t.price}</div>
                <div className="text-xs text-success">{t.change}</div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card className="rounded-2xl">
        <Card.Header className="px-4 pt-3 text-sm">Популярные</Card.Header>
        <Card.Content className="p-0">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-4 py-2 text-left">Имя</th>
                <th className="px-4 py-2 text-right">Капитализация</th>
                <th className="px-4 py-2 text-right">Цена</th>
                <th className="px-4 py-2 text-right">24ч</th>
              </tr>
            </thead>
            <tbody>
              {POPULAR.map((row) => (
                <tr key={row.symbol} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted">{row.symbol}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{row.mcap}</td>
                  <td className="px-4 py-3 text-right">{row.price}</td>
                  <td className="px-4 py-3 text-right text-success">{row.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Content>
      </Card>
    </div>
  );
}
