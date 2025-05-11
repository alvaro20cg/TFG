// src/pages/ConfigurarLetras.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './ConfigurarLetras.css';

const ConfigurarLetras = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [testNames, setTestNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el modal de confirmación
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingName, setPendingName] = useState('');

  // 1. Carga de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'user');
      if (error) {
        console.error('Error al cargar usuarios:', error);
        setError('No se pudieron cargar los usuarios.');
      } else {
        setUsers(data);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleNameChange = (userId, value) => {
    setTestNames(prev => ({ ...prev, [userId]: value }));
  };

  // Inserta el test en Supabase
  const insertTest = async (userId, nombre) => {
    const now = Date.now();
    const { error } = await supabase
      .from('test')
      .insert([{
        user_id: userId,
        nombre,
        test_type: 'letras',
        configuration: { startTime: now },
        status: 'pendiente'
      }]);

    if (error) {
      console.error('Error al activar test:', error);
      alert('Hubo un error al guardar el test');
    } else {
      alert(`Test "${nombre}" activado para el usuario ${userId}`);
      // limpiar campo
      setTestNames(prev => ({ ...prev, [userId]: '' }));
    }
  };

  // 2. Handler principal de “Activar”
  const handleActivate = async (userId) => {
    const nombre = (testNames[userId] || '').trim();
    if (!nombre) {
      alert('Debes escribir un nombre para el test');
      return;
    }

    // Comprobar tests pendientes
    const { data: existing, error: fetchErr } = await supabase
      .from('test')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pendiente');

    if (fetchErr) {
      console.error('Error al comprobar tests existentes:', fetchErr);
      alert('No se pudo verificar los tests pendientes');
      return;
    }

    if (existing.length > 0) {
      // Ya hay un test pendiente: abrimos modal
      setPendingUser(userId);
      setPendingName(nombre);
      setShowConfirm(true);
    } else {
      // No hay pendientes, insertamos directamente
      await insertTest(userId, nombre);
    }
  };

  // 3. Confirmar desde el modal
  const confirmActivate = async () => {
    setShowConfirm(false);
    await insertTest(pendingUser, pendingName);
    setPendingUser(null);
    setPendingName('');
  };

  const cancelActivate = () => {
    setShowConfirm(false);
    setPendingUser(null);
    setPendingName('');
  };

  if (loading) return <p>Cargando usuarios…</p>;
  if (error)   return <p className="error">{error}</p>;

  return (
    <div className="config-container">
      <h1>Configurar Test de Letras</h1>
      <table className="config-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre del Test</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.first_name} {u.last_name} ({u.email})</td>
              <td>
                <input
                  type="text"
                  placeholder="Escribe nombre..."
                  value={testNames[u.id] || ''}
                  onChange={e => handleNameChange(u.id, e.target.value)}
                />
              </td>
              <td>
                <button
                  className="admin-btn"
                  onClick={() => handleActivate(u.id)}
                >
                  Activar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showConfirm && (
        <div className="modal-overlay" onClick={cancelActivate}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Usuario con test pendiente</h2>
            <p>Este usuario ya tiene un test pendiente. ¿Deseas continuar y crear otro o cancelar?</p>
            <div className="modal-buttons">
              <button className="admin-btn" onClick={confirmActivate}>
                Seguir
              </button>
              <button className="admin-btn" onClick={cancelActivate}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => navigate(-1)} className="back-btn">
        Atrás
      </button>
    </div>
  );
};

export default ConfigurarLetras;
