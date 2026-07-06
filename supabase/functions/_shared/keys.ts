/** Resolve Supabase API keys — publishable/secret (current) with legacy anon/service_role fallback. */

function getKeyFromJsonEnv(envName: string, name = 'default'): string | null {
  const raw = Deno.env.get(envName);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[name] ?? parsed.default ?? null;
  } catch {
    return null;
  }
}

export function getPublishableKey(name = 'default'): string {
  return (
    getKeyFromJsonEnv('SUPABASE_PUBLISHABLE_KEYS', name) ||
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ||
    Deno.env.get('SUPABASE_ANON_KEY') ||
    ''
  );
}

export function getSecretKey(name = 'default'): string {
  return (
    getKeyFromJsonEnv('SUPABASE_SECRET_KEYS', name) ||
    Deno.env.get('SUPABASE_SECRET_KEY') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    ''
  );
}

/** Authorize service-to-service calls with secret key (apikey header; legacy Bearer fallback). */
export function authorizeSecretRequest(req: Request, name = 'default'): boolean {
  const secretKey = getSecretKey(name);
  if (!secretKey) return false;

  const apikey = req.headers.get('apikey');
  if (apikey === secretKey) return true;

  const auth = req.headers.get('Authorization') ?? '';
  const bearer = auth.replace(/^Bearer\s+/i, '').trim();
  return bearer === secretKey;
}