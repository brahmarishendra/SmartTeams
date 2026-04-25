import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ipuksbnsyqqssqtherbb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable__3hssEw8G0cZPUoJnPz16A_wGPanu8n';

export const supabase = createClient(supabaseUrl, supabaseKey);
