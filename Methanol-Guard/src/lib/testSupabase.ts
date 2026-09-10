import { supabase } from './supabase';

export async function testSupabaseConnection() {
  const { error } = await supabase
    .from('tests')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Supabase connection error:', error);
    return false;
  }

  console.log('Supabase connection successful!');
  return true;
}