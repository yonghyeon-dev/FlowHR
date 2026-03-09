"use client";

import Link from "next/link";

type EmployeeContractsInboxHeaderProps = {
  title: string;
  description: string;
  sourceHint: string | null;
  returnLabel: string | null;
};

export function EmployeeContractsInboxHeader({
  title,
  description,
  sourceHint,
  returnLabel
}: EmployeeContractsInboxHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
        {sourceHint ? <p className="small muted">{sourceHint}</p> : null}
      </div>
      <div className="page-actions">
        {returnLabel ? (
          <Link className="btn btn-secondary" href="/employee">
            {returnLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
