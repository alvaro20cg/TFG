// src/pages/ViewPatients.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './ViewPatients.css';
import supabase from '../config/supabase';

const ViewPatients = () => {
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({ id: '', name: '', email: '', role: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [patientResults, setPatientResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'user');
      if (error) {
        console.error('Error al obtener pacientes:', error);
        setError(error.message);
      } else {
        setPatients(data);
      }
    };
    fetchPatients();
  }, []);

  // Función para traducir roles
  const translateRole = (role) => {
    if (role === 'user') return 'Usuario';
    return role;
  };

  // Opciones únicas para cada desplegable
  const idOptions    = [...new Set(patients.map(p => p.id.toString()))];
  const nameOptions  = [...new Set(patients.map(p => `${p.first_name} ${p.last_name}`))];
  const emailOptions = [...new Set(patients.map(p => p.email))];
  const roleOptions  = [...new Set(patients.map(p => p.role))];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Filtrado exacto según desplegables
  const filteredPatients = patients.filter(patient => {
    const idMatch    = !filters.id    || patient.id.toString() === filters.id;
    const fullName   = `${patient.first_name} ${patient.last_name}`;
    const nameMatch  = !filters.name  || fullName === filters.name;
    const emailMatch = !filters.email || patient.email === filters.email;
    const roleMatch  = !filters.role  || patient.role === filters.role;
    return idMatch && nameMatch && emailMatch && roleMatch;
  });

  const handleEdit = (patient) => {
    setEditData({ ...patient });
    setIsEditing(true);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('users')
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
      })
      .eq('id', editData.id);

    if (error) {
      console.error('Error al actualizar paciente:', error);
    } else {
      setIsEditing(false);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'user');
      if (fetchError) {
        console.error('Error al recargar pacientes:', fetchError);
      } else {
        setPatients(data);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = (patient) => {
    setSelectedPatient(patient);
    setConfirmDelete(true);
  };

  const confirmDeletion = async () => {
    if (!selectedPatient) return;
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', selectedPatient.id);

    if (error) {
      console.error('Error al eliminar paciente:', error);
    } else {
      setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
      setConfirmDelete(false);
      setSelectedPatient(null);
    }
  };

  const cancelDeletion = () => {
    setConfirmDelete(false);
    setSelectedPatient(null);
  };

  // Modal de resultados (sin botón que lo abra)
  const fetchPatientResults = async (patientId) => {
    const { data: testsData, error: testsError } = await supabase
      .from('test')
      .select('id')
      .eq('user_id', patientId);

    if (testsError) {
      console.error('Error al obtener tests del paciente:', testsError);
      return;
    }
    if (!testsData.length) {
      setPatientResults([]);
      setShowResultsModal(true);
      return;
    }

    const testIds = testsData.map(t => t.id);
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .in('test_id', testIds);

    if (error) {
      console.error('Error al obtener resultados:', error);
    } else {
      setPatientResults(data);
      setShowResultsModal(true);
    }
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
    setPatientResults([]);
    setSelectedPatient(null);
  };

  const handleBack = () => navigate(-1);

  return (
    <>
      <div className="view-patients-container">
        <Header />
        <h1>Ver Pacientes</h1>
        {error && <p className="error-message">{error}</p>}

        {confirmDelete && (
          <div className="confirm-delete">
            <p>¿Estás seguro de que deseas eliminar este paciente?</p>
            <button onClick={confirmDeletion}>Confirmar</button>
            <button onClick={cancelDeletion}>Cancelar</button>
          </div>
        )}

        <table className="patients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
            <tr className="filter-row">
              <th>
                <select name="id" value={filters.id} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  {idOptions.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </th>
              <th>
                <select name="name" value={filters.name} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  {nameOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </th>
              <th>
                <select name="email" value={filters.email} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  {emailOptions.map(email => <option key={email} value={email}>{email}</option>)}
                </select>
              </th>
              <th>
                <select name="role" value={filters.role} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  {roleOptions.map(role => (
                    <option key={role} value={role}>{translateRole(role)}</option>
                  ))}
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>
                    {isEditing && editData.id === patient.id ? (
                      <>
                        <input
                          type="text"
                          name="first_name"
                          value={editData.first_name}
                          onChange={handleChange}
                        />
                        <input
                          type="text"
                          name="last_name"
                          value={editData.last_name}
                          onChange={handleChange}
                        />
                      </>
                    ) : (
                      `${patient.first_name} ${patient.last_name}`
                    )}
                  </td>
                  <td>
                    {isEditing && editData.id === patient.id ? (
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        disabled
                      />
                    ) : (
                      patient.email
                    )}
                  </td>
                  <td>{translateRole(patient.role)}</td>
                  <td>
                    {isEditing && editData.id === patient.id ? (
                      <>
                        <button onClick={handleSave}>Guardar</button>
                        <button onClick={() => handleDelete(patient)}>Eliminar</button>
                      </>
                    ) : (
                      <button onClick={() => handleEdit(patient)}>Editar</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No hay pacientes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>

        <button className="back-btn" onClick={handleBack}>
          Atrás
        </button>

        {showResultsModal && (
          <div className="results-modal">
            <div className="modal-content">
              <h2>Resultados de {selectedPatient.first_name} {selectedPatient.last_name}</h2>
              {patientResults.length > 0 ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>ID Test</th>
                      <th>Duración</th>
                      <th>Aciertos</th>
                      <th>Errores</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientResults.map(result => (
                      <tr key={result.id}>
                        <td>{result.test_id}</td>
                        <td>{result.duration} ms</td>
                        <td>{result.correct_count}</td>
                        <td>{result.error_count}</td>
                        <td>{new Date(result.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No se encontraron resultados para este paciente.</p>
              )}
              <button className="close-modal-btn" onClick={closeResultsModal}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewPatients;
