// Motion tokens — single source of truth, per Premium Web 2026 guide §3.
//
// Rules enforced here:
//   • Springs only for shared-layout & physical metaphors.
//   • CSS transitions for hover/focus (expo-out).
//   • No bounce / elastic / back in B2B.
//   • Transform + opacity only — width/height/padding never animated.
//   • One signature moment per section, not pollination.

export const spring = {
  /** Button tap — snappy, no overshoot */
  button: {type: "spring", stiffness: 400, damping: 17, mass: 1},
  /** Toggle / switch — instant, no bounce */
  toggle: {type: "spring", stiffness: 700, damping: 30, mass: 1},
  /** Modal / drawer enter — confident, no overshoot */
  modal: {type: "spring", stiffness: 300, damping: 30, mass: 1},
  /** Soft content (cards, lists) — elegant */
  soft: {type: "spring", stiffness: 120, damping: 20, mass: 1},
  /** Hero — Apple-buttery */
  hero: {type: "spring", stiffness: 50, damping: 20, mass: 1},
  /** Drag release — physical impulse */
  drag: {type: "spring", stiffness: 100, damping: 10, mass: 1},
} as const;

/** cubic-bezier curves — expo-out is the only acceptable default. */
export const ease = {
  /** expo-out — the only acceptable default for ease-out */
  out: [0.16, 1, 0.3, 1] as const,
  /** "apple-ish" — for shared-layout transitions */
  apple: [0.32, 0.72, 0, 1] as const,
  /** quick — for tiny micro-actions */
  quick: [0.4, 0, 0.2, 1] as const,
  /** NEVER use linear on UI (only for marquees / progress bars) */
  linearMarquee: "linear" as const,
};

/** Duration tokens (ms).  >400ms on hover/click = sluggish. */
export const dur = {
  xs: 120, // micro
  s: 200, // standard
  m: 320, // medium content
  l: 520, // marketing moment
  xl: 800, // hero, sparingly
} as const;

/** Stagger between children (ms). */
export const stagger = {
  tight: 30,
  default: 40,
  loose: 80,
} as const;

/** Page-arrival viewport for scroll reveals — once, margin offset. */
export const viewportOnce = {once: true, margin: "-80px"} as const;
