import {useEffect} from "react";
import {AnimatePresence, motion} from "framer-motion";

import {useUI} from "../../store/ui";
import {EarnHub, EarnReferral, EarnMiner, EarnVouchers, EarnAirdrops, EarnAirdropDetail, EarnTasks} from "./EarnPanels";
import {InboxPanel} from "./InboxPanel";
import {AppStoresPanel} from "./AppStoresPanel";
import {ProfilePanel} from "./ProfilePanel";

// Right-side stack-navigated sidebars. Mirrors Walbi's pattern: each panel
// has its own back/close, history maintained via Zustand.

export function SidebarHost() {
  const panel = useUI((s) => s.panel);
  const closePanel = useUI((s) => s.closePanel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel]);

  // Lock body scroll while panel open (mobile)
  useEffect(() => {
    if (panel) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [panel]);

  return (
    <AnimatePresence>
      {panel ? (
        <>
          <motion.div
            key="scrim"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.15}}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closePanel}
          />
          <motion.aside
            key="panel"
            initial={{x: "100%"}}
            animate={{x: 0}}
            exit={{x: "100%"}}
            transition={{type: "spring", damping: 30, stiffness: 280}}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            <PanelRouter />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function PanelRouter() {
  const panel = useUI((s) => s.panel);
  switch (panel) {
    case "earn":
      return <EarnHub />;
    case "earn-referral":
      return <EarnReferral />;
    case "earn-miner":
      return <EarnMiner />;
    case "earn-vouchers":
      return <EarnVouchers />;
    case "earn-airdrops":
      return <EarnAirdrops />;
    case "earn-airdrop-detail":
      return <EarnAirdropDetail />;
    case "earn-tasks":
      return <EarnTasks />;
    case "inbox":
      return <InboxPanel />;
    case "app-stores":
      return <AppStoresPanel />;
    case "profile":
      return <ProfilePanel />;
    default:
      return null;
  }
}
