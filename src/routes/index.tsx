import {createFileRoute} from "@tanstack/react-router";

import {AgentsList} from "../components/AIHub/AgentsList";
import {MetaChat} from "../components/AIHub/MetaChat";
import {AgentDetail} from "../components/AIHub/AgentDetail";

// AI Hub — central command center. 3-column on desktop, single column on
// mobile (chat takes priority; agents/context accessible via separate routes).

export const Route = createFileRoute("/")({
  component: AIHubPage,
});

function AIHubPage() {
  return (
    <div className="mx-auto grid w-full max-w-screen-2xl gap-3 p-3 md:grid-cols-[240px_1fr_300px] md:p-4">
      <aside className="hidden md:block">
        <AgentsList />
      </aside>

      <section className="min-h-[calc(100svh-180px)]">
        <MetaChat />
      </section>

      <aside className="hidden md:block">
        <AgentDetail />
      </aside>
    </div>
  );
}
