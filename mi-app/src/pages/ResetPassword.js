// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import './ResetPassword.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    if (accessToken) {
      supabase.auth.setAuth(accessToken);
    }
  }, []);

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
    const { data: updatedUserData, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg('Error al actualizar la contraseña: ' + error.message);
    } else {
      if (email) {
        await updateCustomUserPassword(email, newPassword);
      }
      setResetSuccess(true);
    }
  };

  const handleAccept = () => {
    navigate('/');
  };

  const handleCancel = () => {
    setResetSuccess(false);
  };

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Restablecer Contraseña</h2>
        <form onSubmit={handleResetPassword}>
          <input
            type="text"
            placeholder="Correo o Usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-large"
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn">Actualizar contraseña</button>
        </form>
        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>

      {resetSuccess && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Contraseña actualizada correctamente.</h3>
            <div className="modal-buttons">
              <button onClick={handleAccept} className="btn">Aceptar</button>
              <button onClick={handleCancel} className="btn cancel-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
