// Fixed color palette for participants
// All classes must be statically defined for Tailwind purging
export const PALETTE = [
  {
    key: "pink",
    bg: "bg-pink-950/80",
    text: "text-pink-300",
    textMuted: "text-pink-400/80",
    percentText: "text-pink-400/60",
    btn: "bg-pink-500 shadow-pink-500/30",
    btnInactive: "text-pink-400",
    bar: "bg-pink-400/80",
    dot: "bg-pink-400",
  },
  {
    key: "blue",
    bg: "bg-blue-950/80",
    text: "text-blue-300",
    textMuted: "text-blue-400/80",
    percentText: "text-blue-400/60",
    btn: "bg-blue-500 shadow-blue-500/30",
    btnInactive: "text-blue-400",
    bar: "bg-blue-400/80",
    dot: "bg-blue-400",
  },
  {
    key: "green",
    bg: "bg-green-950/80",
    text: "text-green-300",
    textMuted: "text-green-400/80",
    percentText: "text-green-400/60",
    btn: "bg-green-500 shadow-green-500/30",
    btnInactive: "text-green-400",
    bar: "bg-green-400/80",
    dot: "bg-green-400",
  },
  {
    key: "purple",
    bg: "bg-purple-950/80",
    text: "text-purple-300",
    textMuted: "text-purple-400/80",
    percentText: "text-purple-400/60",
    btn: "bg-purple-500 shadow-purple-500/30",
    btnInactive: "text-purple-400",
    bar: "bg-purple-400/80",
    dot: "bg-purple-400",
  },
  {
    key: "amber",
    bg: "bg-amber-950/80",
    text: "text-amber-300",
    textMuted: "text-amber-400/80",
    percentText: "text-amber-400/60",
    btn: "bg-amber-500 shadow-amber-500/30",
    btnInactive: "text-amber-400",
    bar: "bg-amber-400/80",
    dot: "bg-amber-400",
  },
  {
    key: "cyan",
    bg: "bg-cyan-950/80",
    text: "text-cyan-300",
    textMuted: "text-cyan-400/80",
    percentText: "text-cyan-400/60",
    btn: "bg-cyan-500 shadow-cyan-500/30",
    btnInactive: "text-cyan-400",
    bar: "bg-cyan-400/80",
    dot: "bg-cyan-400",
  },
];

export function getColor(key) {
  return PALETTE.find((c) => c.key === key) || PALETTE[0];
}
