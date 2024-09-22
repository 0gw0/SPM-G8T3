import { createClient } from "@supabase/supabase-js";

// Supabase URL and Key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);
