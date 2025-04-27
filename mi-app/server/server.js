const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const https = require('https');
require('dotenv').config();  // Cargar variables de entorno desde el archivo .env

const app = express();
app.use(bodyParser.json());

// Configuración de Supabase
const supabaseUrl = 'https://mobyvbkgiiusemgcaogp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY; // Clave de Supabase desde .env
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de nodemailer (usando las credenciales de .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // SMTP de Gmail u otro proveedor
  port: process.env.SMTP_PORT || 587, // Puerto TLS (587) o 465 para SSL
  secure: process.env.SMTP_SECURE === 'true', // true para SSL, false para TLS
  auth: {
    user: process.env.SMTP_USER, // Tu correo electrónico
    pass: process.env.SMTP_PASS, // Contraseña de aplicación
  },
});

// Verificar si la configuración de nodemailer está funcionando correctamente
transporter.verify((error, success) => {
  if (error) {
    console.error('Error en la configuración de nodemailer:', error);
  } else {
    console.log('La configuración de nodemailer es exitosa:', success);
  }
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

  // Verificar si el correo electrónico ya está registrado
  const { data, error: existingUserError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (data) {
    return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
  }

  // Generar la contraseña aleatoria
  const password = generatePassword();

  // Insertar en la tabla "users"
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([{
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      password, // En producción, se debe hashear la contraseña
      role: 'user',
    }])
    .single();

  if (insertError) {
    console.error('Error registrando paciente:', insertError);
    return res.status(500).json({ message: 'Error al registrar paciente', error: insertError.message });
  }

  // Configurar el correo a enviar
  const mailOptions = {
    from: '"Mi App" <no-reply@miapp.com>', // Remitente
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
    return res.json({ message: 'Paciente registrado con éxito y correo enviado.', data: newUser });
  });
});

// Configura el servidor HTTPS
const PORT = process.env.PORT || 3001;

// Lee el certificado y la llave (asegúrate de que estos archivos existan)
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Servidor HTTPS corriendo en https://localhost:${PORT}`);
});
