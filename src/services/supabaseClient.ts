import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workers')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase health check error:', error);
      return false;
    }
    
    console.log('✓ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};