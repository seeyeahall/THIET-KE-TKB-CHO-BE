import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client: SupabaseClient | null = null;

function makeMockClient() {
  return {
    auth: {
      signInWithPassword: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      signUp: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      upsert: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      eq: function() { return this; },
      is: function() { return this; },
      order: function() { return this; },
      limit: function() { return this; },
      single: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
    functions: {
      invoke: async () => ({ data: null, error: new Error('Supabase not configured') }),
    },
    rpc: async () => ({ data: null, error: new Error('Supabase not configured') }),
    storage: {
      from: () => ({
        createSignedUploadUrl: async () => ({ data: null, error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  if (!supabaseUrl || !supabaseKey) {
    return makeMockClient();
  }

  _client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}

export const supabase = getSupabaseClient();
