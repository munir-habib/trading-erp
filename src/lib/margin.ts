export function marginColor(percent: number): "green" | "amber" | "red" {
  if (percent >= 15) return "green";
  if (percent >= 5) return "amber";
  return "red";
}

export const MARGIN_COLOR_CLASS: Record<string, string> = {
  green: "text-emerald-500",
  amber: "text-amber-500",
  red: "text-destructive",
};
