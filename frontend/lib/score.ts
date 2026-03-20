/** Performance colors: green ≥8, amber ≥5, red <5 */
export function getScoreTier(score: number | null | undefined): "green" | "amber" | "red" {
  if (score == null || Number.isNaN(score)) return "amber";
  if (score >= 8) return "green";
  if (score >= 5) return "amber";
  return "red";
}

export const scoreStyles = {
  green: {
    text: "text-[#10B981]",
    bg: "bg-[#F0FDF4]",
    border: "border-[#10B981]",
    bar: "bg-[#10B981]",
    topBorder: "border-t-[#10B981]",
  },
  amber: {
    text: "text-[#F59E0B]",
    bg: "bg-[#FFFBEB]",
    border: "border-[#F59E0B]",
    bar: "bg-[#F59E0B]",
    topBorder: "border-t-[#F59E0B]",
  },
  red: {
    text: "text-[#EF4444]",
    bg: "bg-[#FEF2F2]",
    border: "border-[#EF4444]",
    bar: "bg-[#EF4444]",
    topBorder: "border-t-[#EF4444]",
  },
} as const;

export function getScoreClasses(score: number | null | undefined) {
  return scoreStyles[getScoreTier(score)];
}
