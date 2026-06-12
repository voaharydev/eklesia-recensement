import { Badge } from "@/components/ui/badge";
import type { Person } from "@/types/database";

type SpiritualBadgesProps = {
  person: Pick<
    Person,
    "is_baptized" | "is_mpandray" | "is_mpiandry" | "is_mpamaky_teny"
  >;
  labels: {
    baptized: string;
    mpandray: string;
    mpiandry: string;
    mpamakyTeny: string;
  };
};

export function SpiritualBadges({ person, labels }: SpiritualBadgesProps) {
  const badges = [
    { key: "baptized", label: labels.baptized, show: person.is_baptized },
    { key: "mpandray", label: labels.mpandray, show: person.is_mpandray },
    { key: "mpiandry", label: labels.mpiandry, show: person.is_mpiandry },
    {
      key: "mpamakyTeny",
      label: labels.mpamakyTeny,
      show: person.is_mpamaky_teny,
    },
  ].filter((b) => b.show);

  if (badges.length === 0) {
    return <span className="text-sm text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <Badge key={badge.key} variant="success">
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
