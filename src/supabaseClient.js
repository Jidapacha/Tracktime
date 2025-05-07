// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Ensure you're using environment variables for sensitive data (e.g., .env file)
const SUPABASE_URL = 'https://ukdachhtnvhoxaospqls.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZGFjaGh0bnZob3hhb3NwcWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNDU1NDUsImV4cCI6MjA2MDkyMTU0NX0.tHns58dgK_OgGS4YWBt7SCA3Er7Pmw9JlECEH7pt5j8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

