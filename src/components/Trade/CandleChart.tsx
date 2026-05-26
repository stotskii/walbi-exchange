import {useEffect, useRef} from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";

import {mockCandles, PAIRS} from "../../lib/mock/data";

// Lightweight-charts is the FOSS sibling of the TradingView Charting Library.
// Same render quality, no license, ~45 KB gz. Loaded as a separate chunk via
// route-level code-splitting (this component is only imported in /trade).

interface Props {
  pair: string;
  height?: number;
}

export function CandleChart({pair, height = 380}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: {color: "transparent"},
        textColor: "rgba(255,255,255,0.55)",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: {color: "rgba(255,255,255,0.04)"},
        horzLines: {color: "rgba(255,255,255,0.04)"},
      },
      rightPriceScale: {borderVisible: false},
      timeScale: {borderVisible: false, timeVisible: true},
      crosshair: {mode: 1},
      handleScale: true,
      handleScroll: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.resize(containerRef.current.clientWidth, height);
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current) return;
    const pairData = PAIRS.find((p) => p.symbol === pair);
    if (!pairData) return;
    const candles = mockCandles(pairData.price).map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })) satisfies CandlestickData[];
    seriesRef.current.setData(candles);
    chartRef.current?.timeScale().fitContent();

    // Simulate live updates: append a tiny tick every second
    const id = window.setInterval(() => {
      const last = candles[candles.length - 1];
      const drift = (Math.random() - 0.5) * pairData.price * 0.0005;
      const updated: CandlestickData = {
        time: last.time,
        open: last.open,
        high: Math.max(last.high, last.close + Math.max(0, drift)),
        low: Math.min(last.low, last.close + Math.min(0, drift)),
        close: +(last.close + drift).toFixed(pairData.price < 1 ? 6 : 2),
      };
      candles[candles.length - 1] = updated;
      seriesRef.current?.update(updated);
    }, 1000);

    return () => window.clearInterval(id);
  }, [pair]);

  return <div ref={containerRef} className="h-full w-full" />;
}
