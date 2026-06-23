import { SIGNAL_CATEGORY_LABELS, type SignalCategory } from "@signalscout/shared";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const CATEGORY_TONE: Record<SignalCategory, BadgeTone> = {
  hiring_surge: "accent",
  team_expansion: "accent",
  leadership_hire: "info",
  first_role_of_type: "info",
  tech_adoption: "amber",
  geographic_expansion: "amber",
  not_a_match: "neutral",
};

export function CategoryBadge({ category }: { category: SignalCategory }) {
  return <Badge tone={CATEGORY_TONE[category]}>{SIGNAL_CATEGORY_LABELS[category]}</Badge>;
}
