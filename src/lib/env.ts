import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1)
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

let cachedPublic: PublicEnv | null = null;
let cachedServer: ServerEnv | null = null;

function formatInvalidKeys(issues: Array<{ path: Array<string | number> }>) {
  return issues.map((issue) => issue.path.join(".")).join(", ");
}

export function getPublicEnv(): PublicEnv {
  if (cachedPublic) {
    return cachedPublic;
  }

  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });

  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${formatInvalidKeys(parsed.error.issues)}`);
  }

  cachedPublic = parsed.data;
  return cachedPublic;
}

export function getServerEnv(): ServerEnv {
  if (cachedServer) {
    return cachedServer;
  }

  const parsed = serverSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${formatInvalidKeys(parsed.error.issues)}`);
  }

  cachedServer = parsed.data;
  return cachedServer;
}
