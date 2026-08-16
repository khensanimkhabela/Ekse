import Link from "next/link";
import type { ComponentType } from "react";

/**
 * Full-width rounded rectangle, primary-blue fill, bold white label.
 * Used for provinces, towns, genres, event types, and the profile menu.
 */
const pillClasses =
  "w-full bg-primary text-white font-heading font-bold text-lg rounded-pill px-6 py-4 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-transform";

export function ListPill({
  label,
  href,
  icon: Icon,
  onClick,
}: {
  label: string;
  /** Omit (and omit onClick) for a terminal leaf item — no further drill-down screen exists in the design reference. */
  href?: string;
  icon?: ComponentType<{ className?: string }>;
  /** For actions rather than navigation (e.g. logout). Takes precedence over href. */
  onClick?: () => void;
}) {
  const content = (
    <>
      {Icon ? <Icon className="w-5 h-5 shrink-0" /> : null}
      <span>{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={pillClasses}>
        {content}
      </button>
    );
  }

  if (!href) {
    return <div className={pillClasses}>{content}</div>;
  }

  return (
    <Link href={href} className={pillClasses}>
      {content}
    </Link>
  );
}
