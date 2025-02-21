import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mobyvbkgiiusemgcaogp.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; // Usamos el prefijo REACT_APP_
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
