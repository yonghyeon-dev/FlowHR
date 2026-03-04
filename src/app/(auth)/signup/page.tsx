"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase/client";

const metadataRoles = ["admin", "manager", "employee", "payroll_operator"] as const;
type MetadataRole = (typeof metadataRoles)[number];

function toSignupErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("user already registered")) {
    return "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정해 주세요.";
  }
  if (normalized.includes("password should be at least")) {
    return "비밀번호는 최소 6자 이상이어야 합니다.";
  }
  if (normalized.includes("unable to validate email address")) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (normalized.includes("signup is disabled")) {
    return "현재 회원가입이 비활성화되어 있습니다. 관리자에게 문의해 주세요.";
  }

  return "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function readAppMetadataString(app: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = app[key];
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return null;
}

function normalizeMetadataRole(value: unknown): MetadataRole | null {
  if (typeof value !== "string") {
    return null;
  }
  return (metadataRoles as readonly string[]).includes(value) ? (value as MetadataRole) : null;
}

function createEmployeeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `EMP-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  }
  return `EMP-${Date.now()}`;
}

async function readResponseBody(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function toApiErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") {
    return fallback;
  }
  const value = (body as Record<string, unknown>).error;
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  return value.trim();
}

async function createOrganizationRecord(accessToken: string, name: string): Promise<string> {
  const response = await fetch("/api/people/organizations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ name })
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(toApiErrorMessage(body, "organization create failed"));
  }

  const organization = (body as { organization?: { id?: unknown } } | null)?.organization;
  const organizationId = typeof organization?.id === "string" ? organization.id.trim() : "";
  if (!organizationId) {
    throw new Error("organization create failed");
  }
  return organizationId;
}

async function createEmployeeRecord(input: {
  accessToken: string;
  organizationId: string;
  email: string;
  employeeId: string;
}) {
  const response = await fetch("/api/people/employees", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.accessToken}`
    },
    body: JSON.stringify({
      id: input.employeeId,
      organizationId: input.organizationId,
      email: input.email,
      active: true
    })
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(toApiErrorMessage(body, "employee create failed"));
  }

  const employee = (body as { employee?: { id?: unknown } } | null)?.employee;
  const employeeId = typeof employee?.id === "string" ? employee.id.trim() : "";
  if (!employeeId) {
    throw new Error("employee create failed");
  }
  return employeeId;
}

async function setupMetadata(input: {
  accessToken: string;
  role: MetadataRole;
  organizationId: string;
  actorId?: string;
}) {
  const payload: Record<string, unknown> = {
    role: input.role,
    organization_id: input.organizationId
  };
  if (input.actorId) {
    payload.actor_id = input.actorId;
  }

  const response = await fetch("/api/auth/setup-metadata", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.accessToken}`
    },
    body: JSON.stringify(payload)
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(toApiErrorMessage(body, "metadata setup failed"));
  }
}

export default function SignupPage() {
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedOrganization = organizationName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedOrganization) {
      setErrorMessage("조직명을 입력해 주세요.");
      setSuccessMessage(null);
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage("이메일을 입력해 주세요.");
      setSuccessMessage(null);
      return;
    }
    if (!password) {
      setErrorMessage("비밀번호를 입력해 주세요.");
      setSuccessMessage(null);
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setSuccessMessage(null);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            organization_name: trimmedOrganization,
            role: "admin"
          }
        }
      });

      if (error) {
        throw error;
      }

      const accessToken = data.session?.access_token?.trim() ?? "";
      if (accessToken) {
        const app = (data.user?.app_metadata ?? {}) as Record<string, unknown>;
        const existingOrganizationId = readAppMetadataString(app, "organization_id", "organizationId");
        const existingRole = normalizeMetadataRole(app.role) ?? (existingOrganizationId ? "employee" : "admin");

        let organizationId = existingOrganizationId;
        let actorId: string | undefined;
        let role: MetadataRole = existingRole;

        if (!organizationId) {
          organizationId = await createOrganizationRecord(accessToken, trimmedOrganization);
          actorId = await createEmployeeRecord({
            accessToken,
            organizationId,
            email: trimmedEmail.toLowerCase(),
            employeeId: createEmployeeId()
          });
          role = "admin";
        }

        await setupMetadata({
          accessToken,
          role,
          organizationId,
          actorId
        });
      }

      setSuccessMessage("가입이 완료되었습니다. 이메일 인증 링크를 확인한 뒤 로그인해 주세요.");
    } catch (error) {
      setErrorMessage(toSignupErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR</p>
        <h1>회원가입</h1>
        <p className="hero-copy">조직 첫 사용자를 등록합니다. 최초 등록 계정은 관리자 권한으로 시작합니다.</p>
        <div className="hero-meta">
          <Link className="btn btn-secondary" href="/">
            홈으로
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>새 계정 만들기</h2>
          <p className="small">조직명, 이메일, 비밀번호를 입력해 주세요.</p>

          <form onSubmit={(event) => void signUp(event)}>
            <div className="input-grid">
              <label className="full">
                조직명
                <input
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="예: FlowHR Corp"
                  autoComplete="organization"
                />
              </label>
              <label>
                이메일
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </label>
              <label>
                비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="new-password"
                />
              </label>
              <label>
                비밀번호 확인
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="********"
                  autoComplete="new-password"
                />
              </label>
            </div>

            {errorMessage ? (
              <p className="small" style={{ color: "var(--danger)" }}>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="small" style={{ color: "var(--ok)" }}>
                {successMessage}
              </p>
            ) : null}

            <div className="actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending || !organizationName.trim() || !email.trim() || !password || !passwordConfirm}
              >
                회원가입
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h2>이미 계정이 있나요?</h2>
          <p className="small">기존 계정이 있다면 로그인 페이지에서 바로 로그인할 수 있습니다.</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/login">
              로그인으로 이동
            </Link>
            <Link className="btn btn-secondary" href="/forgot-password">
              비밀번호 찾기
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
