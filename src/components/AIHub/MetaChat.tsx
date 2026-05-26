import {useEffect, useRef, useState} from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";

import {MOCK_MESSAGES} from "../../lib/mock/data";
import type {ChatMessage} from "../../lib/mock/types";
import {AgentAvatar} from "./AgentAvatar";
import {relativeTime} from "../../lib/format";

const REPLY_TEMPLATES = [
  "Принято. Запрашиваю agent/session/list/v1 и собираю агрегат…",
  "Готово ✓ Стратегия активирована. Буду пинговать при открытии/закрытии позиций.",
  "Сейчас на рынке умеренный рост BTC (+0.7%). Рекомендую следить за volume на 15M.",
  "Включил пайплайн. Первая позиция откроется как только индикаторы дадут подтверждение.",
];

export function MetaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [draft, setDraft] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      agentId: "meta",
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setDraft("");

    // simulate agent reply
    window.setTimeout(() => {
      const reply: ChatMessage = {
        id: String(Date.now() + 1),
        agentId: "meta",
        role: "agent",
        text: REPLY_TEMPLATES[Math.floor(Math.random() * REPLY_TEMPLATES.length)],
        timestamp: Date.now(),
        thinking:
          "Парсю запрос → определяю intent → выбираю tool из MCP → формирую ответ с верифицированными цифрами",
      };
      setMessages((m) => [...m, reply]);
    }, 900);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <AgentAvatar name="Мета чат" size={32} />
        <div className="flex-1">
          <div className="text-sm font-medium">Мета чат</div>
          <div className="text-[10px] text-muted">
            Универсальный командный интерфейс для всех агентов
          </div>
        </div>
        <button
          className="rounded p-1.5 text-muted hover:bg-surface-secondary"
          onClick={() => setShowThinking((v) => !v)}
          title="Показать мысли"
        >
          <Icon
            icon={showThinking ? "gravity-ui:eye" : "gravity-ui:eye-slash"}
            className="size-4"
          />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <Bubble key={m.id} message={m} showThinking={showThinking} />
        ))}
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {["Покажи PnL за неделю", "Включи Mommy", "Закрой все позиции по BTC"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setDraft(s)}
                className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-foreground"
              >
                {s}
              </button>
            ),
          )}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Сообщение или команда…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <Button isIconOnly variant="primary" size="sm" onPress={send} aria-label="Отправить">
            <Icon icon="gravity-ui:arrow-up" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({message, showThinking}: {message: ChatMessage; showThinking: boolean}) {
  const isUser = message.role === "user";
  return (
    <div
      className={["flex gap-2", isUser ? "flex-row-reverse" : ""].join(" ")}
    >
      {!isUser ? <AgentAvatar name="Meta" size={28} /> : null}
      <div className={["flex flex-col gap-1", isUser ? "items-end" : "items-start"].join(" ")}>
        <div
          className={[
            "max-w-[480px] rounded-2xl px-3 py-2 text-sm",
            isUser
              ? "rounded-tr-sm bg-accent text-white"
              : "rounded-tl-sm bg-surface-secondary",
          ].join(" ")}
        >
          {message.text}
        </div>
        {showThinking && message.thinking && !isUser ? (
          <div className="max-w-[480px] rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] text-muted">
            <div className="mb-0.5 font-medium text-muted">мысли:</div>
            {message.thinking}
          </div>
        ) : null}
        <span className="px-1 text-[10px] text-muted">
          {relativeTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
