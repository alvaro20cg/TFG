// src/pages/Admin.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();

  const goToRegisterPatient = () => {
    navigate('/register-patient');
  };

  const goToConfigurarTest = () => {
    navigate('/configurar-test');
  };

  const goToViewPatients = () => {
    navigate('/view-patients');
  };

  // Nuevo handler para resultados
  const goToViewResults = () => {
    navigate('/view-results');
  };

  return (
    <>
      <Header />
      <div className="admin-container">
        <h1>Panel de Administración</h1>
        <p>Elige una opción:</p>
        <div className="admin-options">
          <button className="admin-btn" onClick={goToRegisterPatient}>
            Registrar Paciente
          </button>
          <button className="admin-btn" onClick={goToConfigurarTest}>
            Configurar Test
          </button>
          <button className="admin-btn" onClick={goToViewPatients}>
            Ver Pacientes
          </button>
          <button className="admin-btn" onClick={goToViewResults}>
            Ver Resultados
          </button>
        </div>
      </div>
    </>
  );
};

export default Admin;
