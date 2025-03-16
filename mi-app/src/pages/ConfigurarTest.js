import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './ConfigurarTest.css';
import imagenesData from '../json/imagenes.json';

const emotions = ["Alegría", "Tristeza", "Enfado", "Asco", "Enojo", "Neutral"];
const people = ['004', '066', '079', '116', '140', '168'];

// Mapping actualizado: las claves se corresponden con el array de emociones.
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

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [error, setError] = useState(null);

  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [numRounds, setNumRounds] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

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

  // Modo fácil: filtra las imágenes de la carpeta y para la emoción objetivo
  // incluye solo la imagen que corresponda a la versión elegida.
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
    const filteredImages = folderImages.filter(img => {
       const parts = img.file.split('_'); // [folder, "o", "m", <emoción>, <opción>.jpg]
       if (parts.length < 5) return true;
       const emotion = parts[3]; 
       const option = parts[4].split('.')[0]; 
       if (emotion === targetLetter) {
         // Para la imagen objetivo, se incluye solo si coincide la opción elegida.
         return option === selectedVersion;
       }
       return true;
    });
    return filteredImages.sort(() => Math.random() - 0.5);
  };

  const iniciarTest = async () => {
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

    const roundsNumber = parseInt(numRounds, 10);
    let rounds = [];
    for (let i = 0; i < roundsNumber; i++) {
      selectedPeople.forEach(folder => {
        let roundImages = [];
        if (selectedDifficulty === "facil") {
          roundImages = getEasyModeImages(folder);
        } else {
          // Modo difícil: se muestran TODAS las imágenes de la carpeta, sin filtrar.
          const allImages = imagenesData
            .filter(img => img.folder === folder)
            .map(img => ({
              id: img.id,
              url: `/images/${img.folder}/${img.file}`,
              folder: img.folder,
              file: img.file
            }));
          roundImages = allImages.sort(() => Math.random() - 0.5);
        }
        roundImages.sort(() => Math.random() - 0.5);
        rounds.push({
          targetFolder: folder,
          images: roundImages
        });
      });
    }
    const startTime = Date.now();

    const { data: insertedTest, error } = await supabase
      .from('test')
      .insert([
        {
          user_id: selectedPatient,
          configuration: { rounds, selectedEmotion, selectedDifficulty, startTime },
          status: 'pendiente'
        }
      ])
      .select();

    if (error) {
      console.error("Error al guardar la configuración del test", error);
      alert("Error al guardar la configuración del test");
      return;
    }
    alert("La configuración del test se ha guardado. Desde tu panel podrás iniciar el test.");
    // Permanecemos en la misma página.
  };

  return (
    <div className="realizar-test-container">
      <h2>Test Psicológico: Identifica la emoción</h2>
      <div className="selection-wrapper">
        <div className="selection-container">
          <div className="people-selection">
            <h3>Selecciona las carpetas (personas):</h3>
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
              onChange={(e) => setSelectedVersion(e.target.value)}
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
              onChange={(e) => setSelectedDifficulty(e.target.value)}
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
              onChange={(e) => setSelectedPatient(e.target.value)}
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
