import Link from "next/link";
import type { Activity, Profile } from "@/lib/database.types";
import { barBackground, relativniDatum } from "@/lib/ui";
import { CATEGORY_EMOJI, CATEGORY_LABEL, EFFORT_LABEL } from "@/lib/enums";

type Props = {
  activity: Activity;
  members: Profile[];
  children?: React.ReactNode;
};

// Kartica aktivnosti sa akcentnom trakom predlagača (ili gradijentom kad je „naše").
export default function Kartica({ activity, members, children }: Props) {
  const predlagac = members.find((m) => m.id === activity.created_by);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-surface">
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: barBackground(activity, members) }}
        aria-hidden
      />
      <div className="p-4 pl-6">
        <Link href={`/aktivnost/${activity.id}`} className="block">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold leading-tight">
              {activity.title}
            </h3>
            <span className="shrink-0 text-xl" aria-hidden>
              {CATEGORY_EMOJI[activity.category]}
            </span>
          </div>
          {activity.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {activity.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{CATEGORY_LABEL[activity.category]}</span>
            <span>· {EFFORT_LABEL[activity.effort]}</span>
            {activity.deadline && (
              <span className="text-warning">
                · rok {relativniDatum(activity.deadline)}
              </span>
            )}
            {predlagac?.display_name && (
              <span>· dodao/la {predlagac.display_name}</span>
            )}
          </div>
        </Link>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </article>
  );
}
