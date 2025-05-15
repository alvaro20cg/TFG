// src/pages/MainPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import './MainPage.css';

const MainPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setShowCookieModal(true);
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowCookieModal(false);
  };
  const handleRejectCookies = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowCookieModal(false);
  };

  const handleIngresar = () => setShowLogin(true);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, role')
      .eq('username', username)
      .single();
    if (userError || !userData) {
      alert('Usuario no encontrado');
      return;
    }
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password,
    });
    if (authError) {
      alert('Credenciales incorrectas');
      return;
    }
    if (userData.role === 'admin') navigate('/admin');
    else if (userData.role === 'user') navigate('/userresults');
    else alert('No tienes permisos.');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    let emailToUse = '';
    if (forgotInput.includes('@')) {
      emailToUse = forgotInput;
    } else {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', forgotInput)
        .single();
      if (userError || !userData) {
        alert('Usuario no encontrado');
        return;
      }
      emailToUse = userData.email;
    }
    const redirectURL = window.location.origin + '/reset-password';
    const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
      redirectTo: redirectURL,
    });
    if (error) {
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
          <div className="side-buttons">
            <button className="side-btn" onClick={handleIngresar}>
              Ingresar
            </button>
            <button className="side-btn" onClick={() => setShowAbout(true)}>
              Quiénes Somos
            </button>
            <button className="side-btn" onClick={() => setShowTests(true)}>
              Nuestros Test
            </button>
            <button className="side-btn" onClick={() => setShowContact(true)}>
              Contacto
            </button>
          </div>
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
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn">Iniciar Sesión</button>
          </form>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
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

      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Recuperar Contraseña</h3>
            <p>Ingresa tu usuario o correo:</p>
            <form onSubmit={handleForgotPassword}>
              <input
                type="text"
                value={forgotInput}
                onChange={e => setForgotInput(e.target.value)}
                placeholder="Usuario o correo"
                required
              />
              <div style={{ marginTop: 10 }}>
                <button type="submit" className="login-btn">Enviar</button>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="login-btn-cancelar"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCookieModal && (
        <div className="cookie-overlay">
          <div className="cookie-modal">
            <h2>Antes de continuar</h2>
            <p>Usamos cookies para mejorar tu experiencia. Si eliges "Aceptar todo", utilizaremos cookies y datos para:</p>
            <ul>
              <li>Proporcionar y mantener nuestros servicios</li>
              <li>Prevenir el spam, el fraude y los abusos</li>
              <li>Medir la interacción de la audiencia y estadísticas del sitio</li>
            </ul>
            <p>Si eliges "Rechazar todo", solo usaremos cookies esenciales para el funcionamiento de la aplicación.</p>
            <div className="cookie-buttons">
              <button onClick={handleRejectCookies}>Rechazar todo</button>
              <button onClick={handleAcceptCookies}>Aceptar todo</button>
            </div>
          </div>
        </div>
      )}

      {/* Modales comic */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="comic-modal" onClick={e => e.stopPropagation()}>
            <h3>Quiénes Somos</h3>
            <p>Aquí va la información de tu equipo, misión, visión…</p>
            <button onClick={() => setShowAbout(false)}>Cerrar</button>
          </div>
        </div>
      )}
      {showTests && (
        <div className="modal-overlay" onClick={() => setShowTests(false)}>
          <div className="comic-modal" onClick={e => e.stopPropagation()}>
            <h3>Nuestros Test</h3>
            <p>Descripción de tus tests psicológicos, links, etc.</p>
            <button onClick={() => setShowTests(false)}>Cerrar</button>
          </div>
        </div>
      )}
      {showContact && (
        <div className="modal-overlay" onClick={() => setShowContact(false)}>
          <div className="comic-modal" onClick={e => e.stopPropagation()}>
            <h3>Contacto</h3>
            <p>Tus datos de contacto, formulario, email…</p>
            <button onClick={() => setShowContact(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;
