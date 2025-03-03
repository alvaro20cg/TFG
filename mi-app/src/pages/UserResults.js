import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import Header from '../components/Header';
import './UserResults.css';

const UserPanel = () => {
  const navigate = useNavigate();
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [tests, setTests] = useState([]);

  // Función para obtener los tests pendientes del usuario
  const fetchTests = async () => {
    const { data, error } = await supabase
      .from('test') // Asegúrate de usar el nombre correcto de la tabla
      .select('*')
      .eq('status', 'pendiente'); // Filtra por tests pendientes

    if (error) {
      console.error("Error al obtener tests:", error);
    } else {
      setTests(data);
    }
  };

  const handleViewResults = () => {
    alert("Aquí se mostrarán los resultados.");
  };

  // Al hacer clic en "Realizar Test" se obtiene la lista de tests y se muestra el modal
  const handlePerformTest = () => {
    fetchTests();
    setShowTestsModal(true);
  };

  // Al seleccionar un test se navega a TestPage.js con la configuración del test
  const handleTestClick = (test) => {
    navigate('/testpage', { state: test.configuration });
  };

  const handleCloseModal = () => {
    setShowTestsModal(false);
  };

  return (
    <>
      <Header />
      <div className="admin-container">
        <h1>Panel de Usuario</h1>
        <div className="admin-options">
          <button className="admin-btn" onClick={handleViewResults}>
            Ver Resultados
          </button>
          <button className="admin-btn" onClick={handlePerformTest}>
            Realizar Test
          </button>
        </div>
      </div>
      
      {showTestsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Tests Disponibles</h3>
            {tests.length > 0 ? (
              <ul className="tests-list">
                {tests.map((test) => (
                  <li key={test.id} className="test-item">
                    <span>Test ID: {test.id}</span>
                    <button className="start-test-btn" onClick={() => handleTestClick(test)}>
                      Iniciar Test
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay tests disponibles</p>
            )}
            <button className="close-modal-btn" onClick={handleCloseModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UserPanel;
