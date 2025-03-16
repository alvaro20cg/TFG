import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import Header from '../components/Header';
import './RegisterPatient.css';

const RegisterPatient = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!username || !firstName || !lastName || !email) {
      setPopupMessage('Por favor, completa todos los campos.');
      setShowPopup(true);
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setPopupMessage('El correo electrónico no es válido.');
      setShowPopup(true);
      setIsSubmitting(false);
      return;
    }

    const formattedFirstName = capitalize(firstName);
    const formattedLastName = capitalize(lastName);
    const generatedPassword = generatePassword();

    // Espera 2 segundos para no exceder el límite de solicitudes
    setTimeout(async () => {
      // 1. Registrar el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: generatedPassword
      });
      if (authError) {
        console.error('Error al registrar en Auth:', authError);
        setPopupMessage('Error al registrar en Auth: ' + authError.message);
        setShowPopup(true);
        setIsSubmitting(false);
        return;
      }
      console.log('Usuario creado en Auth:', authData.user);

      // 2. Insertar el usuario en la tabla "users" con todos los campos requeridos
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            user_id: authData.user.id, // Enlace con Supabase Auth
            username,
            first_name: formattedFirstName,
            last_name: formattedLastName,
            email,
            password: generatedPassword, // Se inserta la contraseña generada (idealmente no en texto plano)
            role: 'user'
          }
        ])
        .single();

      if (userError) {
        console.error('Error al guardar en la tabla users:', userError);
        setPopupMessage('Error al guardar en la tabla users: ' + userError.message);
      } else {
        setPopupMessage(
          'Paciente registrado con éxito.\nLa contraseña generada es: ' + generatedPassword
        );
        // Limpiar los campos del formulario
        setUsername('');
        setFirstName('');
        setLastName('');
        setEmail('');
      }
      setShowPopup(true);
      setIsSubmitting(false);
    }, 2000);
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

        <button type="submit" className="register-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Registrar'}
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
