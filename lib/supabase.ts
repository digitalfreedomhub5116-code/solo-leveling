import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwebpxmkpampjevmhuhm.supabase.co';
const supabaseKey = 'sb_publishable_lSyjluaV-jBzOiGP0gxAaw_vjzq6J5l';

export const supabase = createClient(supabaseUrl, supabaseKey);