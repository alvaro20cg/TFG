// ConfigurarTest.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './ConfigurarTest.css';
import imagenesData from '../json/imagenes.json';

const emotions = ["Alegría", "Tristeza", "Enfado", "Asco", "Enojo", "Neutral"];
const people = ['004', '066', '079', '116', '140', '168'];

const emotionMapping = {
  "Alegría": "h",
  "Tristeza": "s",
  "Enfado": "f",
  "Asco": "d",
  "Enojo": "a",
  "Neutral": "n"
};

const ConfigurarTest = () => {
  const navigate = useNavigate();

  // Estados de configuración
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [error, setError] = useState(null);

  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [numRounds, setNumRounds] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  // Estados del modal de nombre
  const [showNameModal, setShowNameModal] = useState(false);
  const [testName, setTestName] = useState("");

  // Carga de pacientes
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

  // Handlers de selección
  const handlePersonSelection = (person) => {
    setSelectedPeople(prev =>
      prev.includes(person)
        ? prev.filter(p => p !== person)
        : [...prev, person]
    );
  };
  const handleEmotionSelection = (emotion) => {
    setSelectedEmotion(emotion);
  };
  const handleRoundsChange = (e) => {
    setNumRounds(e.target.value);
  };

  // Helpers de imágenes
  const getFolderImage = (person) => {
    const defaultVersion = "a";
    const happyImage = imagenesData.find(
      img =>
        img.folder === person &&
        img.file.includes('_h_') &&
        img.file.endsWith(`_${defaultVersion}.jpg`)
    );
    return happyImage ? `/images/${happyImage.folder}/${happyImage.file}` : null;
  };
  const getEasyModeImages = (folder) => {
    const targetLetter = emotionMapping[selectedEmotion];
    const folderImages = imagenesData
      .filter(img => img.folder === folder)
      .map(img => ({
         id: img.id,
         file: img.file,
         url: `/images/${img.folder}/${img.file}`,
         folder: img.folder
      }));
    return folderImages
      .filter(img => {
        const parts = img.file.split('_');
        if (parts.length < 5) return true;
        const emotion = parts[3];
        const option = parts[4].split('.')[0];
        if (emotion === targetLetter) {
          return option === selectedVersion;
        }
        return true;
      })
      .sort(() => Math.random() - 0.5);
  };

  // Al hacer click en "Realizar Test": validamos y abrimos modal
  const iniciarTest = () => {
    if (!selectedPatient) {
      alert('Debes seleccionar un usuario.');
      return;
    }
    if (selectedPeople.length === 0 || !selectedEmotion) {
      alert('Debes seleccionar al menos una carpeta y una emoción.');
      return;
    }
    if (!numRounds) {
      alert('Debes seleccionar el número de rondas.');
      return;
    }
    if (!selectedVersion) {
      alert('Debes seleccionar una versión.');
      return;
    }
    if (!selectedDifficulty) {
      alert('Debes seleccionar una dificultad.');
      return;
    }
    setShowNameModal(true);
  };

  // Cancelar modal
  const handleCancel = () => {
    setShowNameModal(false);
    setTestName("");
  };

  // Confirmar nombre y guardar en Supabase
  const handleConfirmName = async () => {
    if (!testName.trim()) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    const roundsNumber = parseInt(numRounds, 10);
    let rounds = [];
    for (let i = 0; i < roundsNumber; i++) {
      selectedPeople.forEach(folder => {
        let images = selectedDifficulty === "facil"
          ? getEasyModeImages(folder)
          : imagenesData
              .filter(img => img.folder === folder)
              .map(img => ({
                id: img.id,
                url: `/images/${img.folder}/${img.file}`,
                folder: img.folder,
                file: img.file
              }))
              .sort(() => Math.random() - 0.5);

        rounds.push({
          targetFolder: folder,
          images: images.sort(() => Math.random() - 0.5)
        });
      });
    }
    const startTime = Date.now();

    const { data: insertedTest, error: insertError } = await supabase
      .from('test')
      .insert([{
        user_id: selectedPatient,
        nombre: testName,
        test_type: 'caras',          // ← Aquí
        configuration: { rounds, selectedEmotion, selectedDifficulty, startTime },
        status: 'pendiente'
      }])
    .select();


    if (insertError) {
      console.error("Error al guardar el test:", insertError);
      alert("Error al guardar el test");
      return;
    }

    alert("Test registrado correctamente.");
    setShowNameModal(false);
    // opcional: resetear o navegar
  };

  return (
    <div className="realizar-test-container">
      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nombre del Test</h3>
            <input
              type="text"
              placeholder="Escribe un nombre para el test"
              value={testName}
              onChange={e => setTestName(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleCancel} className="back-btn">Cancelar</button>
              <button onClick={handleConfirmName} className="start-button">Confirmar</button>
            </div>
          </div>
        </div>
      )}
      <h2>Test Psicológico: Identifica la emoción</h2>
      <div className="selection-wrapper">
        <div className="selection-container">
          <div className="people-selection">
            <h3>Selecciona las carpetas</h3>
            {people.map(person => {
              const folderImageUrl = getFolderImage(person);
              return (
                <div key={person} className="checkbox-wrapper-62">
                  <input
                    type="checkbox"
                    className="check"
                    id={person}
                    checked={selectedPeople.includes(person)}
                    onChange={() => handlePersonSelection(person)}
                  />
                  <label htmlFor={person} className="label">
                    <svg width="43" height="43" viewBox="0 0 90 90">
                      <rect x="30" y="20" width="50" height="50" stroke="black" fill="none" />
                      <g transform="translate(0,-952.36218)">
                        <path d="m 13,983 c 33,6 40,26 55,48 " stroke="black" strokeWidth="3" className="path1" fill="none" />
                        <path d="M 75,970 C 51,981 34,1014 25,1031 " stroke="black" strokeWidth="3" className="path1" fill="none" />
                      </g>
                    </svg>
                    {folderImageUrl && (
                      <img src={folderImageUrl} alt={`Happy ${person}`} className="happy-image" />
                    )}
                    <span>{person}</span>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="radio-section">
            <div className="radio-list">
              <h3>Selecciona la emoción</h3>
              {emotions.map((emotion, index) => (
                <div className="radio-item" key={emotion}>
                  <input
                    type="radio"
                    id={`emotion-${index}`}
                    name="emotion"
                    value={emotion}
                    onChange={() => handleEmotionSelection(emotion)}
                    checked={selectedEmotion === emotion}
                  />
                  <label htmlFor={`emotion-${index}`}>{emotion}</label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="controls-group">
          <div className="control-item">
            <label htmlFor="rounds">Número de rondas:</label>
            <input
              type="number"
              id="rounds"
              placeholder="Selecciona el número de rondas"
              value={numRounds}
              onChange={handleRoundsChange}
              min="1"
              max="10"
            />
          </div>
          <div className="control-item">
            <label htmlFor="version-select">Versión:</label>
            <select
              id="version-select"
              value={selectedVersion}
              onChange={e => setSelectedVersion(e.target.value)}
            >
              <option value="">Selecciona la versión</option>
              <option value="a">A</option>
              <option value="b">B</option>
            </select>
          </div>
          <div className="control-item">
            <label htmlFor="difficulty-select">Dificultad:</label>
            <select
              id="difficulty-select"
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
            >
              <option value="">Selecciona la dificultad</option>
              <option value="facil">Fácil</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
          <div className="control-item">
            <label htmlFor="patient-select">Selecciona el usuario:</label>
            <select
              id="patient-select"
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
            >
              <option value="">-- Selecciona un usuario --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.email})
                </option>
              ))}
            </select>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      </div>
      <div className="button-container">
        <button onClick={() => navigate(-1)} className="back-btn">Atrás</button>
        <button onClick={iniciarTest} className="start-button">Realizar Test</button>
      </div>
    </div>
  );
};

export default ConfigurarTest;
