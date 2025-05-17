import { createClient } from '@supabase/supabase-js';

console.log("=== DEBUG ENV ===");
console.log("REACT_APP_SUPABASE_URL", process.env.REACT_APP_SUPABASE_URL);
console.log("REACT_APP_SUPABASE_ANON_KEY", process.env.REACT_APP_SUPABASE_ANON_KEY);


const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log("URL =", SUPABASE_URL);
console.log("KEY =", SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("Created supabase client:", supabase);    
