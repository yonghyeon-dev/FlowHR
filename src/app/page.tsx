import Link from "next/link";

import { createTranslator } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default async function HomePage() {
  const showDevTools = isDevToolsEnabled();
  const locale = await getRequestLocale();
  const t = createTranslator(locale);

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR</p>
        <h1>{t("home.title")}</h1>
        <p className="hero-copy">{t("home.copy")}</p>
        <div className="hero-meta">
          <Link className="btn btn-primary" href="/admin">
            {t("home.cta.admin")}
          </Link>
          <Link className="btn btn-secondary" href="/employee">
            {t("home.cta.employee")}
          </Link>
          <Link className="btn btn-secondary" href="/employee/payslips">
            {t("home.cta.payslip")}
          </Link>
          <Link className="btn btn-secondary" href="/login">
            {t("home.cta.login")}
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>{t("home.admin.title")}</h2>
          <p className="small">{t("home.admin.copy")}</p>
          <Link className="btn btn-primary" href="/admin">
            {t("home.admin.open")}
          </Link>
        </article>

        <article className="panel">
          <h2>{t("home.employee.title")}</h2>
          <p className="small">{t("home.employee.copy")}</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/employee">
              /employee
            </Link>
            <Link className="btn btn-secondary" href="/employee/payslips">
              /employee/payslips
            </Link>
          </div>
        </article>

        {showDevTools ? (
          <article className="panel">
            <h2>{t("home.devtools.title")}</h2>
            <p className="small">{t("home.devtools.copy")}</p>
            <div className="actions">
              <Link className="btn btn-secondary" href="/ops/admin-console">
                Admin Console (legacy)
              </Link>
              <Link className="btn btn-secondary" href="/ops/mvp-console">
                MVP Console
              </Link>
              <Link className="btn btn-secondary" href="/ops/scheduling-cockpit">
                Scheduling Cockpit
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
