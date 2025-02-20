import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './UserResults.css';

const UserResults = () => {
  const navigate = useNavigate();

  const handleViewResults = () => {
    // Aquí puedes redirigir a otra ruta o mostrar los resultados
    alert("Aquí se mostrarán los resultados.");
  };

  return (
    <>
      <Header />
      <div className="user-results-container">
        <button className="view-results-btn" onClick={handleViewResults}>
          Ver Resultados
        </button>
      </div>
    </>
  );
};

export default UserResults;
