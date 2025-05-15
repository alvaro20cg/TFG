// src/pages/UserPanel.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import Header from '../components/Header';
import './UserResults.css';

const UserPanel = () => {
  const navigate = useNavigate();
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [tests, setTests] = useState([]);
  const [userId, setUserId] = useState(null);

  // 1. Obtener el user_id del usuario autenticado
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error al obtener el usuario:', authError);
        return;
      }
      // Traemos todas las filas que coincidan y elegimos la primera
      const { data: rows, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email);
      if (userError) {
        console.error('Error al obtener el ID del usuario:', userError);
      } else if (rows && rows.length > 0) {
        setUserId(rows[0].id);
      } else {
        console.warn('No se encontró ningún usuario con ese email.');
      }
    };
    fetchUserId();
  }, []);

  // 2. Obtener TODOS los tests del usuario (sin filtrar por estado)
  const fetchTests = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('test')
      .select('id, nombre, test_type, status, configuration')
      .eq('user_id', userId);
    if (error) {
      console.error('Error al obtener tests:', error);
    } else {
      setTests(data);
    }
  };

  // 3. Cargar tests y abrir modal
  const handlePerformTest = async () => {
    await fetchTests();
    setShowTestsModal(true);
  };

  // 4. Navegar a la página del test según su tipo
  const handleTestClick = (test) => {
    const navState = { state: { ...test.configuration, testId: test.id } };
    if (test.test_type === 'letras') {
      navigate('/testpage2', navState);
    } else {
      // para caras u otros tipos
      navigate('/testpage', navState);
    }
  };

  const handleCloseModal = () => {
    setShowTestsModal(false);
  };

  const handleViewResults = () => {
    navigate('/results');
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Tests Disponibles</h3>
            {tests.length > 0 ? (
              <ul className="tests-list">
                {tests.map(test => (
                  <li key={test.id} className="test-item">
                    <div>
                      <strong>{test.nombre}</strong>{' '}
                      <small>
                        (ID: {test.id} ― {test.test_type} ― {test.status})
                      </small>
                    </div>
                    <button
                      className="back-btn"
                      onClick={() => handleTestClick(test)}
                    >
                      Iniciar Test
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay tests disponibles para ti.</p>
            )}
            <button className="back-btn" onClick={handleCloseModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UserPanel;
