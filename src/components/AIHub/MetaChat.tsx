import {useEffect, useMemo, useRef, useState} from "react";
import {Button} from "@heroui/react";
import {Icon} from "@iconify/react";
import {useQuery} from "@tanstack/react-query";

import {MOCK_MESSAGES} from "../../lib/mock/data";
import type {ChatMessage as UiMessage} from "../../lib/mock/types";
import {AgentAvatar} from "./AgentAvatar";
import {relativeTime} from "../../lib/format";
import {api} from "../../lib/api/rest";
import {sendChatMessage, subscribeChatMessages} from "../../lib/api/ws";
import {useToasts} from "../../store/toast";
import type {ChatMessage as WalbiMessage} from "../../lib/api/walbi-types";

// META AGENT id seems to be 1 in cerberus.yaml schema (chat:meta:get conversation
// users include the "agent" with id 1). If that ever changes, the chat send
// will surface an error from the server — we toast it.
const META_AGENT_ID = 1;

interface MessageListResponse {
  list?: Array<{
    message_uid?: string;
    external_uid?: string;
    content?: string;
    created_at?: number;
    sender?: {id: number; role: "user" | "agent"};
  }>;
  next_cursor?: string;
}

function toUi(m: NonNullable<MessageListResponse["list"]>[number]): UiMessage {
  return {
    id: m.message_uid ?? m.external_uid ?? String(Math.random()),
    agentId: "meta",
    role: m.sender?.role ?? "agent",
    text: m.content ?? "",
    timestamp: (m.created_at ?? Date.now() / 1000) * 1000,
  };
}

function walbiMsgToUi(m: WalbiMessage): UiMessage {
  return {
    id: m.message_uid,
    agentId: "meta",
    role: m.sender?.role ?? "agent",
    text: m.content,
    timestamp: m.created_at * 1000,
  };
}

export function MetaChat() {
  const push = useToasts((s) => s.push);
  const [draft, setDraft] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [extras, setExtras] = useState<UiMessage[]>([]);

  // 1. fetch meta conversation uid
  const meta = useQuery({
    queryKey: ["chat", "meta"],
    queryFn: () => api.chat.metaConversation(),
    staleTime: 60_000,
  });
  const conversationUid = meta.data?.conversation?.conversation_uid;

  // 2. fetch history once we know the uid
  const history = useQuery({
    queryKey: ["chat", "messages", conversationUid],
    queryFn: () =>
      api.chat.messageList(conversationUid!, undefined, 50) as Promise<MessageListResponse>,
    enabled: !!conversationUid,
    staleTime: 30_000,
  });

  // 3. live updates over WS
  useEffect(() => {
    if (!conversationUid) return;
    const off = subscribeChatMessages((m) => {
      if (m.conversation_uid !== conversationUid) return;
      setExtras((prev) => {
        if (prev.find((x) => x.id === m.message_uid)) return prev;
        return [...prev, walbiMsgToUi(m)];
      });
    });
    return off;
  }, [conversationUid]);

  const messages = useMemo<UiMessage[]>(() => {
    const live = [...(history.data?.list ?? []).map(toUi), ...extras]
      .sort((a, b) => a.timestamp - b.timestamp);
    return live.length > 0 ? live : MOCK_MESSAGES;
  }, [history.data, extras]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || !conversationUid) return;
    const external_uid = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 6);
    // optimistic
    setExtras((prev) => [
      ...prev,
      {
        id: external_uid,
        agentId: "meta",
        role: "user",
        text,
        timestamp: Date.now(),
      },
    ]);
    setDraft("");
    try {
      await sendChatMessage({
        agent_id: META_AGENT_ID,
        conversation_uid: conversationUid,
        content: text,
        external_uid,
      });
    } catch (err) {
      push({
        tone: "danger",
        title: "Не отправилось",
        description: String((err as Error)?.message ?? err),
      });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <AgentAvatar name="Мета чат" size={32} />
        <div className="flex-1">
          <div className="text-sm font-medium">
            Мета чат
            {history.data ? (
              <span className="ml-2 text-[10px] text-success">live</span>
            ) : meta.isLoading ? (
              <span className="ml-2 text-[10px] text-muted">…</span>
            ) : null}
          </div>
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
          {["Покажи PnL за неделю", "Включи Mommy", "Закрой все позиции по BTC"].map((s) => (
            <button
              key={s}
              onClick={() => setDraft(s)}
              className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={conversationUid ? "Сообщение или команда…" : "Загрузка чата…"}
            disabled={!conversationUid}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted disabled:opacity-50"
          />
          <Button
            isIconOnly
            variant="primary"
            size="sm"
            onPress={() => void send()}
            isDisabled={!conversationUid || !draft.trim()}
            aria-label="Отправить"
          >
            <Icon icon="gravity-ui:arrow-up" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({message, showThinking}: {message: UiMessage; showThinking: boolean}) {
  const isUser = message.role === "user";
  return (
    <div className={["flex gap-2", isUser ? "flex-row-reverse" : ""].join(" ")}>
      {!isUser ? <AgentAvatar name="Meta" size={28} /> : null}
      <div className={["flex flex-col gap-1", isUser ? "items-end" : "items-start"].join(" ")}>
        <div
          className={[
            "max-w-[480px] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
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
        <span className="px-1 text-[10px] text-muted">{relativeTime(message.timestamp)}</span>
      </div>
    </div>
  );
}
