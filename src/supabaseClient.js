import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);      
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY); 
