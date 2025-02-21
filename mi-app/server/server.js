const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();  // Cargar variables de entorno desde el archivo .env

const app = express();
app.use(bodyParser.json());

// Configuración de Supabase
const supabaseUrl = 'https://mobyvbkgiiusemgcaogp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY; // Clave de Supabase desde .env
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de nodemailer (usando las credenciales de .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // SMTP de Gmail
  port: process.env.SMTP_PORT || 587, // Puerto TLS (587)
  secure: process.env.SMTP_SECURE === 'true', // Si usas SSL, usa 465, sino 587 para TLS
  auth: {
    user: process.env.SMTP_USER, // Tu correo electrónico
    pass: process.env.SMTP_PASS, // Contraseña de aplicación
  },
});

// Función para generar una contraseña aleatoria (8 caracteres hexadecimales)
function generatePassword() {
  return crypto.randomBytes(4).toString('hex');
}

// Endpoint para registrar un paciente
app.post('/api/register-patient', async (req, res) => {
  const { username, firstName, lastName, email } = req.body;

  // Validar campos requeridos
  if (!username || !firstName || !lastName || !email) {
    return res.status(400).json({ message: 'Faltan campos requeridos.' });
  }

  // Generar la contraseña aleatoria
  const password = generatePassword();

  // Insertar en la tabla "users" (asegúrate de que la tabla tenga las columnas: username, first_name, last_name, email, password, role)
  const { data, error } = await supabase
    .from('users')
    .insert([{
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password, // En producción, se debe hashear la contraseña
      role: 'user', // Asumimos que el nuevo paciente tiene rol "user"
    }])
    .single();

  if (error) {
    console.error('Error registrando paciente:', error);
    return res.status(500).json({ message: 'Error al registrar paciente', error: error.message });
  }

  // Configurar el correo a enviar
  const mailOptions = {
    from: '"Mi App" <no-reply@miapp.com>', // Remitente, puedes cambiar esto
    to: email,
    subject: 'Tu contraseña para Mi App',
    html: `<p>Hola ${firstName},</p>
           <p>Tu cuenta ha sido registrada exitosamente. Tu contraseña es: <strong>${password}</strong></p>
           <p>Por favor, cámbiala después de iniciar sesión.</p>`,
  };

  // Enviar el correo
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error enviando correo:', err);
      return res.status(500).json({ message: 'Error al enviar el correo', error: err.message });
    }
    return res.json({ message: 'Paciente registrado con éxito y correo enviado.', data });
  });
});

// Inicia el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
