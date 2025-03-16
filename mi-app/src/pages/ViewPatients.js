import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './ViewPatients.css';
import supabase from '../config/supabase';

const ViewPatients = () => {
  const [patients, setPatients] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);
  // Estados para el modal de resultados
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
        console.error('Error fetching patients:', error);
        setError(error.message);
      } else {
        setPatients(data);
      }
    };

    fetchPatients();
  }, []);

  const handleEdit = (patient) => {
    setEditData({ ...patient });
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Actualiza solo los campos editables en la tabla "users"
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
        console.error('Error al obtener los pacientes actualizados:', fetchError);
      } else {
        setPatients(data);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = (patient) => {
    setSelectedPatient(patient);
    setConfirmDelete(true);
  };

  const confirmDeletion = async () => {
    if (selectedPatient) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedPatient.id);

      if (error) {
        console.error('Error al eliminar paciente:', error);
      } else {
        setPatients(patients.filter((patient) => patient.id !== selectedPatient.id));
        setConfirmDelete(false);
        setSelectedPatient(null);
      }
    }
  };

  const cancelDeletion = () => {
    setConfirmDelete(false);
    setSelectedPatient(null);
  };

  // Función para obtener los resultados del paciente.
  // Primero se consulta la tabla "test" para obtener los test_ids del paciente,
  // y luego se consultan los resultados de esos tests en "test_results".
  const fetchPatientResults = async (patientId) => {
    // Obtener los tests del paciente
    const { data: testsData, error: testsError } = await supabase
      .from('test')
      .select('id')
      .eq('user_id', patientId);

    if (testsError) {
      console.error('Error al obtener tests del paciente:', testsError);
      return;
    }
    if (!testsData || testsData.length === 0) {
      setPatientResults([]);
      setShowResultsModal(true);
      return;
    }

    const testIds = testsData.map(test => test.id);

    // Obtener los resultados correspondientes a los tests del paciente
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .in('test_id', testIds);

    if (error) {
      console.error('Error al obtener resultados del paciente:', error);
    } else {
      setPatientResults(data);
      setShowResultsModal(true);
    }
  };

  // Muestra el modal con resultados para el paciente seleccionado
  const handleViewResults = (patient) => {
    fetchPatientResults(patient.id);
    setSelectedPatient(patient);
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
    setPatientResults([]);
    setSelectedPatient(null);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <Header />
      <div className="view-patients-container">
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
          </thead>
          <tbody>
            {patients.length > 0 ? (
              patients.map((patient) => (
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
                  <td>{patient.role}</td>
                  <td>
                    {isEditing && editData.id === patient.id ? (
                      <>
                        <button onClick={handleSave}>Guardar</button>
                        <button onClick={() => handleDelete(patient)}>Eliminar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(patient)}>Editar</button>
                        <button onClick={() => handleViewResults(patient)}>Ver Resultados</button>
                      </>
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
              <h2>
                Resultados de {selectedPatient.first_name} {selectedPatient.last_name}
              </h2>
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
                    {patientResults.map((result) => (
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
