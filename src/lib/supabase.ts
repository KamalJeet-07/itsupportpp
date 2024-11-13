import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cvsczsswoejnshlosvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c2N6c3N3b2VqbnNobG9zdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0NzYzODYsImV4cCI6MjA0NzA1MjM4Nn0.pNyUZta_OqCMnp7ekjoeGENHF1EPaaH8wXAF6ooJRnU';

export const supabase = createClient(supabaseUrl, supabaseKey);