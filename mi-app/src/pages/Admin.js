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
    navigate('/configurar-test'); // Actualiza la ruta a 'configurar-test'
  };

  const goToViewPatients = () => {
    navigate('/view-patients');
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
            Configurar Test {/* Cambiado de "Realizar Test" a "Configurar Test" */}
          </button>
          <button className="admin-btn" onClick={goToViewPatients}>
            Ver Pacientes
          </button>
        </div>
      </div>
    </>
  );
};

export default Admin;
