// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mobyvbkgiiusemgcaogp.supabase.co';
// Asegúrate de tener un archivo .env con SUPABASE_KEY=tu_clave_publica
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; 
// Nota: Create React App requiere que las variables de entorno comiencen con REACT_APP_
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
