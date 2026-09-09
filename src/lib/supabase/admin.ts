import { createClient } from '@supabase/supabase-js';

// Node 20 SSR compatibility: polyfill globalThis.WebSocket for @supabase/realtime-js if not present
if (typeof window === 'undefined' && !globalThis.WebSocket) {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

// Privileged service role client for background tasks and webhook handlers ONLY
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-pixellar.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
