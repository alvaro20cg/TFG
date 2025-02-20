import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase'; // Asegúrate de que esta ruta sea correcta
import './MainPage.css';

const MainPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleIngresar = () => {
    setShowLogin(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // Consulta a la tabla "users" para verificar las credenciales.
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', usuario)
      .eq('password', password)
      .single();

    if (error || !data) {
      console.error('Error en el login:', error);
      alert('Credenciales incorrectas');
      return;
    }

    // Según el rol, redirige:
    if (data.role === 'admin') {
      navigate('/admin');
    } else if (data.role === 'user') {
      navigate('/userresults');
    } else {
      alert('No tienes permisos de administrador.');
    }
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
              <label htmlFor="usuario">Usuario:</label>
              <input
                type="text"
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="login-btn">
              Iniciar Sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MainPage;
