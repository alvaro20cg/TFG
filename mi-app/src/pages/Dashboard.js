import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleRegistrarPaciente = () => {
    // Redirige a la página de registro de pacientes
    navigate('/register-patient');
  };

  const handleRealizarTest = () => {
    // Redirige a la página para realizar test
    navigate('/realizar-test');
  };

  return (
    <div className="dashboard-container">
      <h1>Bienvenido, admin!</h1>
      <div className="button-group">
        <button className="dashboard-btn" onClick={handleRegistrarPaciente}>
          Registrar Paciente
        </button>
        <button className="dashboard-btn" onClick={handleRealizarTest}>
          Realizar Test
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
