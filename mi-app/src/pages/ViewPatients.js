import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './ViewPatients.css';
import supabase from '../config/supabase';  // Asegúrate de importar tu configuración de Supabase

const ViewPatients = () => {
  const [patients, setPatients] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState(null);  // Para manejar errores de forma más clara
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'user');

      if (error) {
        console.error('Error fetching patients:', error);
        setError(error.message);  // Mostrar el error en el estado
      } else {
        setPatients(data);  // Asignar los pacientes a la variable de estado
      }
    };

    fetchPatients();  // Ejecutar la consulta al cargar el componente
  }, []);

  const handleEdit = (patient) => {
    setEditData({ ...patient });  // Cargar los datos a editar
    setIsEditing(true);  // Activar el modo de edición
  };

  const handleSave = async () => {
    // Actualiza la base de datos con los cambios
    const { error } = await supabase
      .from('users')
      .update(editData)
      .eq('id', editData.id);

    if (error) {
      console.error('Error al actualizar paciente:', error);
    } else {
      setIsEditing(false);  // Desactivar el modo de edición
      // Refrescar los pacientes con los datos actualizados
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('role', 'user');

      if (fetchError) {
        console.error('Error al obtener los pacientes actualizados:', fetchError);
      } else {
        setPatients(data);  // Actualiza la lista de pacientes
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

  const handleDelete = async (patient) => {
    setSelectedPatient(patient);
    setConfirmDelete(true);  // Mostrar confirmación para eliminar
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
        // Eliminar al paciente de la lista local
        setPatients(patients.filter(patient => patient.id !== selectedPatient.id));
        setConfirmDelete(false);
        setSelectedPatient(null);
      }
    }
  };

  const cancelDeletion = () => {
    setConfirmDelete(false);
    setSelectedPatient(null);
  };

  const handleBack = () => {
    navigate(-1);  // Regresar a la página anterior
  };

  return (
    <>
      <Header />
      <div className="view-patients-container">
        <h1>Ver Pacientes</h1>
        {error && <p className="error-message">{error}</p>}  {/* Mostrar mensaje de error si hay */}
        
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
              patients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{isEditing && editData.id === patient.id ? (
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
                  )}</td>
                  <td>{isEditing && editData.id === patient.id ? (
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleChange}
                    />
                  ) : patient.email}</td>
                  <td>{patient.role}</td>
                  <td>
                    {isEditing && editData.id === patient.id ? (
                      <button onClick={handleSave}>Guardar</button>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(patient)}>Editar</button>
                        <button onClick={() => handleDelete(patient)}>Eliminar</button>
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
        <button className="back-btn" onClick={handleBack}>Atrás</button>
      </div>
    </>
  );
};

export default ViewPatients;
