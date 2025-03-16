// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import './ResetPassword.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Extrae el token de la URL y lo establece en Supabase
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    if (accessToken) {
      supabase.auth.setAuth(accessToken);
    }
  }, []);

  // Función para actualizar el campo "password" en la tabla "users"
  const updateCustomUserPassword = async (email, newPassword) => {
    const { data, error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('email', email);
    if (error) {
      console.error('Error actualizando la contraseña en la tabla users:', error);
    } else {
      console.log('Contraseña actualizada en la tabla users:', data);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    // Actualiza la contraseña en Supabase Auth
    const { data: updatedUserData, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg('Error al actualizar la contraseña: ' + error.message);
    } else {
      // Se obtiene el email del usuario actualizado
      const user = updatedUserData.user;
      if (user && user.email) {
        // Actualiza la contraseña en la tabla personalizada "users"
        await updateCustomUserPassword(user.email, newPassword);
      }
      setResetSuccess(true);
    }
  };

  const handleAccept = () => {
    navigate('/');
  };

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Restablecer Contraseña</h2>
        <form onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Actualizar contraseña</button>
        </form>
        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>

      {resetSuccess && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Contraseña actualizada correctamente.</h3>
            <button onClick={handleAccept}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
