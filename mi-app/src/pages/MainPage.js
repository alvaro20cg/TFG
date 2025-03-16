import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import './MainPage.css';

const MainPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica si el usuario ya tomó una decisión sobre las cookies
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieModal(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieModal(false);
  };

  const handleRejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowCookieModal(false);
  };

  const handleIngresar = () => {
    setShowLogin(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // 1. Obtiene el email y el rol desde la tabla "users" usando el username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, role')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error('Error al obtener el usuario:', userError);
      alert('Usuario no encontrado');
      return;
    }

    // 2. Inicia sesión con Supabase Auth usando el email y la contraseña ingresada
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    });

    if (authError) {
      console.error('Error en el login:', authError);
      alert('Credenciales incorrectas');
      return;
    }

    console.log('Usuario autenticado:', authData.user);

    // 3. Redirige según el rol obtenido
    if (userData.role === 'admin') {
      navigate('/admin');
    } else if (userData.role === 'user') {
      navigate('/userresults');
    } else {
      alert('No tienes permisos.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    let emailToUse = '';
  
    // Si el input contiene "@", asumimos que es un correo
    if (forgotInput.includes('@')) {
      emailToUse = forgotInput;
    } else {
      // Si no, tratamos el input como un username y buscamos el email en la tabla "users"
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', forgotInput)
        .single();
  
      if (userError || !userData) {
        console.error('Error al obtener el usuario para recuperación:', userError);
        alert('Usuario no encontrado');
        return;
      }
      emailToUse = userData.email;
    }
  
    // Define la URL a la que se redirigirá al usuario tras hacer clic en el enlace del correo
    const redirectURL = window.location.origin + '/reset-password';
  
    // Enviar el correo de recuperación con el redirectTo configurado
    const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
      redirectTo: redirectURL,
    });
  
    if (error) {
      console.error('Error al enviar el correo de recuperación:', error);
      alert('No se pudo enviar el correo de recuperación');
      return;
    }
    alert('Correo de recuperación enviado');
    setShowForgotModal(false);
    setForgotInput('');
  };
  

  return (
    <div className="main-container">
      {!showLogin && (
        <>
          <h1 className="welcome">Bienvenido a Nuestra Aplicación</h1>
          <button className="ingresar-btn" onClick={handleIngresar}>
            Ingresar
          </button>
        </>
      )}

      {showLogin && (
        <div className="login-box">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nombre de Usuario:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn">
              Iniciar Sesión
            </button>
          </form>
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              className="forgot-password-btn"
              onClick={() => setShowForgotModal(true)}
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
            >
              ¿Se te olvidó la contraseña?
            </button>
          </div>
        </div>
      )}

      {/* Modal para la recuperación de contraseña */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Recuperar Contraseña</h3>
            <p>Ingresa tu usuario o correo:</p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="text"
                value={forgotInput}
                onChange={(e) => setForgotInput(e.target.value)}
                placeholder="Usuario o correo"
                required
              />
              <div style={{ marginTop: '10px' }}>
                <button type="submit" className="login-btn">Enviar</button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="login-btn"
                  style={{ marginLeft: '10px', background: 'gray' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de cookies */}
      {showCookieModal && (
        <div className="cookie-overlay">
          <div className="cookie-modal">
            <h2>Antes de continuar</h2>
            <p>
              Usamos cookies para mejorar tu experiencia. Si eliges "Aceptar todo", utilizaremos
              cookies y datos para:
            </p>
            <ul>
              <li>Proporcionar y mantener nuestros servicios</li>
              <li>Prevenir el spam, el fraude y los abusos</li>
              <li>Medir la interacción de la audiencia y estadísticas del sitio</li>
            </ul>
            <p>
              Si eliges "Rechazar todo", solo usaremos cookies esenciales para el funcionamiento de
              la aplicación.
            </p>
            <div className="cookie-buttons">
              <button onClick={handleRejectCookies}>Rechazar todo</button>
              <button onClick={handleAcceptCookies}>Aceptar todo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
