import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase'; // Asegúrate de que la ruta sea correcta
import Header from '../components/Header';
import './RegisterPatient.css';

const RegisterPatient = () => {
  const navigate = useNavigate();

  // Estados para los campos del formulario
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  // Validación básica del email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validación de la contraseña: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número.
  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  // Función para capitalizar nombres: primera letra en mayúscula, el resto en minúscula.
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar que todos los campos estén completos
    if (!username || !firstName || !lastName || !email || !password) {
      setPopupMessage('Por favor, completa todos los campos.');
      setShowPopup(true);
      return;
    }

    // Validar el correo electrónico
    if (!validateEmail(email)) {
      setPopupMessage('El correo electrónico no es válido.');
      setShowPopup(true);
      return;
    }

    // Validar la contraseña
    if (!validatePassword(password)) {
      setPopupMessage(
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.'
      );
      setShowPopup(true);
      return;
    }
    
    // Capitalizar el primer nombre y apellido
    const formattedFirstName = capitalize(firstName);
    const formattedLastName = capitalize(lastName);

    // Insertar el registro en la tabla "users"
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          first_name: formattedFirstName,
          last_name: formattedLastName,
          email,
          password, // En producción, se debe hashear la contraseña
        },
      ]);

    if (error) {
      console.error('Error al registrar paciente:', error);
      setPopupMessage('Error al registrar paciente: ' + error.message);
    } else {
      setPopupMessage('Paciente registrado con éxito.');
      // Limpiar el formulario
      setUsername('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
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

        <label htmlFor="password">Contraseña:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="register-btn">
          Registrar
        </button>
      </form>
      <button className="back-btn" onClick={handleBack}>
        Aceptar
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
