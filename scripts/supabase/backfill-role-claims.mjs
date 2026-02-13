#!/usr/bin/env node

import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const allowedRoles = new Set([
  "admin",
  "manager",
  "employee",
  "payroll_operator",
  "system"
]);

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function readArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }
  return process.argv[index + 1];
}

function resolveRole(user, defaultRole) {
  const canonical = user?.app_metadata?.role;
  if (typeof canonical === "string" && allowedRoles.has(canonical)) {
    return {
      role: canonical,
      source: "app_metadata.role",
      updateNeeded: false
    };
  }

  const candidates = [
    { value: user?.user_metadata?.role, source: "user_metadata.role" },
    { value: user?.app_metadata?.user_role, source: "app_metadata.user_role" },
    { value: user?.user_metadata?.user_role, source: "user_metadata.user_role" }
  ];

  for (const candidate of candidates) {
    if (typeof candidate.value === "string" && allowedRoles.has(candidate.value)) {
      return {
        role: candidate.value,
        source: candidate.source,
        updateNeeded: true
      };
    }
  }

  return {
    role: defaultRole,
    source: "default",
    updateNeeded: true
  };
}

async function main() {
  const apply = hasFlag("--apply");
  const enforce = hasFlag("--enforce");
  const verbose = hasFlag("--verbose");
  const dryRun = hasFlag("--dry-run") || !apply;
  const perPage = Number.parseInt(readArg("--per-page", "200"), 10);
  const defaultRole = readArg("--default-role", "employee");
  const previewLimit = Number.parseInt(readArg("--preview-limit", "20"), 10);

  if (!Number.isInteger(perPage) || perPage <= 0) {
    throw new Error("--per-page must be a positive integer");
  }
  if (!Number.isInteger(previewLimit) || previewLimit <= 0) {
    throw new Error("--preview-limit must be a positive integer");
  }
  if (!allowedRoles.has(defaultRole)) {
    throw new Error(`--default-role must be one of: ${Array.from(allowedRoles).join(", ")}`);
  }

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!projectUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const preview = [];
  let totalUsers = 0;
  let alreadyCanonical = 0;
  let pendingFix = 0;
  let updated = 0;
  let failed = 0;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (error) {
      throw new Error(`listUsers failed at page ${page}: ${error.message}`);
    }

    const users = data?.users ?? [];
    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      totalUsers += 1;
      const resolution = resolveRole(user, defaultRole);

      if (!resolution.updateNeeded) {
        alreadyCanonical += 1;
        continue;
      }

      pendingFix += 1;
      if (preview.length < previewLimit || verbose) {
        preview.push({
          id: user.id,
          email: user.email ?? "(no-email)",
          nextRole: resolution.role,
          source: resolution.source
        });
      }

      if (!apply) {
        continue;
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...(user.app_metadata ?? {}),
          role: resolution.role
        }
      });

      if (updateError) {
        failed += 1;
        console.error(`update failed: ${user.id} (${user.email ?? "no-email"}) - ${updateError.message}`);
      } else {
        updated += 1;
      }
    }

    if (users.length < perPage) {
      break;
    }
  }

  console.log("Role claim governance summary");
  console.log(`- mode: ${apply ? "apply" : "dry-run"}${enforce ? " + enforce" : ""}`);
  console.log(`- total users: ${totalUsers}`);
  console.log(`- already canonical: ${alreadyCanonical}`);
  console.log(`- pending fix: ${pendingFix}`);
  if (apply) {
    console.log(`- updated: ${updated}`);
    console.log(`- failed updates: ${failed}`);
  }

  if (preview.length > 0) {
    console.log(`- preview (${preview.length}${verbose ? "" : ` / up to ${previewLimit}`})`);
    for (const row of preview) {
      console.log(`  - ${row.id} ${row.email} -> ${row.nextRole} (${row.source})`);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  if (enforce && pendingFix > 0 && !apply) {
    console.error("enforce mode failed: users exist without canonical app_metadata.role");
    process.exitCode = 1;
  }

  if (dryRun && !enforce) {
    console.log("dry-run completed. Re-run with --apply to persist updates.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
