import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase'; // Asegúrate de que la ruta sea correcta
import Header from '../components/Header';
import './RegisterPatient.css';

const RegisterPatient = () => {
  const navigate = useNavigate();

  // Estados para los campos del formulario (sin contraseña)
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  // Función para validar el email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Función para capitalizar nombres y apellidos: primera letra mayúscula, resto minúsculas.
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función para generar una contraseña aleatoria (ejemplo de 8 caracteres)
  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de campos requeridos
    if (!username || !firstName || !lastName || !email) {
      setPopupMessage('Por favor, completa todos los campos.');
      setShowPopup(true);
      return;
    }

    // Validación del correo electrónico
    if (!validateEmail(email)) {
      setPopupMessage('El correo electrónico no es válido.');
      setShowPopup(true);
      return;
    }

    // Capitalizar nombres y apellidos
    const formattedFirstName = capitalize(firstName);
    const formattedLastName = capitalize(lastName);

    // Generar la contraseña automáticamente
    const generatedPassword = generatePassword();

    // Insertar en la tabla "users" (la tabla ya debe estar creada en Supabase)
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          first_name: formattedFirstName,
          last_name: formattedLastName,
          email,
          password: generatedPassword, // En producción, hashea la contraseña antes de guardarla.
          role: 'user'  // Asumimos que el nuevo usuario es "user"
        },
      ])
      .single();

    if (error) {
      console.error('Error al registrar paciente:', error);
      setPopupMessage('Error al registrar paciente: ' + error.message);
    } else {
      setPopupMessage(
        'Paciente registrado con éxito.\nLa contraseña generada es: ' + generatedPassword
      );
      // Limpiar el formulario
      setUsername('');
      setFirstName('');
      setLastName('');
      setEmail('');
    }
    setShowPopup(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="register-patient-container">
      <Header />
      <h2>Registrar Paciente</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Usuario:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label htmlFor="firstName">Nombre:</label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <label htmlFor="lastName">Apellido:</label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <label htmlFor="email">Correo Electrónico:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit" className="register-btn">
          Registrar
        </button>
      </form>
      <button className="back-btn" onClick={handleBack}>
        Atrás
      </button>

      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{popupMessage}</h3>
            <button className="popup-btn" onClick={closePopup}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPatient;
