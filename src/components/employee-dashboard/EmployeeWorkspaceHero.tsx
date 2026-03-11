import Link from "next/link";

type EmployeeWorkspaceHeroAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type EmployeeWorkspaceHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  sourceHint?: string | null;
  returnHref: string;
  returnLabel: string;
  actions?: EmployeeWorkspaceHeroAction[];
  metaLabel?: string | null;
};

export function EmployeeWorkspaceHero({
  eyebrow,
  title,
  description,
  sourceHint,
  returnHref,
  returnLabel,
  actions = [],
  metaLabel
}: EmployeeWorkspaceHeroProps) {
  return (
    <section className="hero-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="hero-copy">{description}</p>
      {sourceHint ? <p className="small muted">{sourceHint}</p> : null}
      <div className="hero-meta">
        {metaLabel ? <span>{metaLabel}</span> : null}
        <Link className="btn btn-primary" href={returnHref}>
          {returnLabel}
        </Link>
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            className={action.tone === "primary" ? "btn btn-primary" : "btn btn-secondary"}
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
