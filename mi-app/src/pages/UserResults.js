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

  // Obtener el user_id del usuario actual al cargar el componente
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error al obtener el usuario:", error);
      } else if (user) {
        console.log("Usuario autenticado:", user); 
        console.log("Email del usuario:", user.email); 
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (userError) {
          console.error("Error al obtener el ID del usuario:", userError);
        } else {
          console.log("ID del usuario encontrado:", userData?.id); 
          setUserId(userData?.id);
        }
      } else {
        console.log("No hay usuario autenticado.");
      }
    };
    fetchUserId();
  }, []);

  // Función para obtener los tests pendientes del usuario actual
  const fetchTests = async () => {
    if (!userId) {
      console.log("userId es null, no se puede obtener los tests.");
      return;
    }

    const { data, error } = await supabase
      .from('test')
      .select('*')
      .eq('status', 'pendiente')
      .eq('user_id', userId);

    if (error) {
      console.error("Error al obtener tests:", error);
    } else {
      console.log("Tests obtenidos:", data); 
      setTests(data);
    }
  };

  const handleViewResults = () => {
    alert("Aquí se mostrarán los resultados.");
  };

  const handlePerformTest = () => {
    console.log("Obteniendo tests para el usuario con ID:", userId); 
    fetchTests();
    setShowTestsModal(true);
  };

  // Agregamos testId al objeto state enviado a TestPage
  const handleTestClick = (test) => {
    navigate('/testpage', { state: { ...test.configuration, testId: test.id } });
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
