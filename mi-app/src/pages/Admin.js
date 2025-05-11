// src/pages/Admin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const goToConfigurarTest = () => {
    closeModal();
    navigate('/configurar-test');  // Apunta a ConfigurarTest.js
  };
  const goToConfigurarLetras = () => {
    closeModal();
    navigate('/configurar-letras');  // Apunta a ConfigurarLetras.js
  }

  return (
    <>
      <Header />
      <div className="admin-container">
        <h1>Panel de Administración</h1>
        <p>Elige una opción:</p>
        <div className="admin-options">
          <button className="admin-btn" onClick={() => navigate('/register-patient')}>
            Registrar Paciente
          </button>
          <button className="admin-btn" onClick={openModal}>
            Configurar Test
          </button>
          <button className="admin-btn" onClick={() => navigate('/view-patients')}>
            Ver Pacientes
          </button>
          <button className="admin-btn" onClick={() => navigate('/view-results')}>
            Ver Resultados
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>¿Qué tipo de test quieres configurar?</h2>
            <div className="modal-buttons">
              <button className="admin-btn" onClick={goToConfigurarTest}>
                Cara
              </button>
              <button className="admin-btn" onClick={goToConfigurarLetras}>
                Letras
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Admin;
