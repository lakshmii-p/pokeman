export interface TypeTheme {
  bg: string; // solid background for chips
  text: string; // text-on-bg color
  glow: string; // rgba glow used for card hover/shadow
  ring: string; // border/ring color
}

// Deliberate, saturated per-type palette. Kept distinct from the generic
// "single accent" look because the brief requires a full type-color system.
export const TYPE_THEME: Record<string, TypeTheme> = {
  normal: { bg: "#A0A29F", text: "#1c1f28", glow: "rgba(160,162,159,0.45)", ring: "#A0A29F" },
  fire: { bg: "#FF9C54", text: "#1c1f28", glow: "rgba(255,110,53,0.55)", ring: "#FF6E35" },
  water: { bg: "#4D90D5", text: "#0b1220", glow: "rgba(77,144,213,0.55)", ring: "#4D90D5" },
  electric: { bg: "#F4D23C", text: "#1c1f28", glow: "rgba(244,210,60,0.6)", ring: "#F4D23C" },
  grass: { bg: "#63BC5A", text: "#0b1220", glow: "rgba(99,188,90,0.55)", ring: "#63BC5A" },
  ice: { bg: "#74D0C3", text: "#0b1220", glow: "rgba(116,208,195,0.55)", ring: "#74D0C3" },
  fighting: { bg: "#CE416B", text: "#f5f4f0", glow: "rgba(206,65,107,0.55)", ring: "#CE416B" },
  poison: { bg: "#B567CE", text: "#f5f4f0", glow: "rgba(181,103,206,0.55)", ring: "#B567CE" },
  ground: { bg: "#D97C4A", text: "#1c1f28", glow: "rgba(217,124,74,0.55)", ring: "#D97C4A" },
  flying: { bg: "#8FA8DE", text: "#0b1220", glow: "rgba(143,168,222,0.55)", ring: "#8FA8DE" },
  psychic: { bg: "#F97294", text: "#1c1f28", glow: "rgba(249,114,148,0.55)", ring: "#F97294" },
  bug: { bg: "#A2B723", text: "#0b1220", glow: "rgba(162,183,35,0.55)", ring: "#A2B723" },
  rock: { bg: "#C5B57C", text: "#1c1f28", glow: "rgba(197,181,124,0.55)", ring: "#C5B57C" },
  ghost: { bg: "#7B62A3", text: "#f5f4f0", glow: "rgba(123,98,163,0.6)", ring: "#7B62A3" },
  dragon: { bg: "#5D6FE0", text: "#f5f4f0", glow: "rgba(93,111,224,0.6)", ring: "#5D6FE0" },
  dark: { bg: "#5B5468", text: "#f5f4f0", glow: "rgba(91,84,104,0.6)", ring: "#5B5468" },
  steel: { bg: "#84A7B5", text: "#0b1220", glow: "rgba(132,167,181,0.55)", ring: "#84A7B5" },
  fairy: { bg: "#EC9AC7", text: "#1c1f28", glow: "rgba(236,154,199,0.55)", ring: "#EC9AC7" },
};

export const TYPE_ICON: Record<string, string> = {
  normal: "⚪",
  fire: "🔥",
  water: "💧",
  electric: "⚡",
  grass: "🌿",
  ice: "❄️",
  fighting: "👊",
  poison: "☠️",
  ground: "⛰️",
  flying: "🪽",
  psychic: "🔮",
  bug: "🐛",
  rock: "🪨",
  ghost: "👻",
  dragon: "🐉",
  dark: "🌙",
  steel: "⚙️",
  fairy: "✨",
};

export function themeFor(type: string): TypeTheme {
  return TYPE_THEME[type] ?? TYPE_THEME.normal;
}
