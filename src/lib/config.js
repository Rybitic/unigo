// Supabase project settings (Project Settings → API in the Supabase dashboard).
// The anon/publishable key is meant to be public: row-level security in
// supabase/schema.sql is what protects the data.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
