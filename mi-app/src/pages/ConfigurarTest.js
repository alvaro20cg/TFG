import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './ConfigurarTest.css';
import imagenesData from '../json/imagenes.json';

const emotions = ["Alegría", "Tristeza", "Enfado", "Asco", "Sorpresa", "Neutral"];
const people = ['004', '066', '079', '116', '140', '168'];

// Mapeo de emoción a la letra que aparece en el nombre del archivo
const emotionMapping = {
  "Alegría": "h",
  "Tristeza": "s",
  "Enfado": "f",
  "Asco": "d",
  "Sorpresa": "a",
  "Neutral": "n"
};

const ConfigurarTest = () => {
  const navigate = useNavigate();

  // Estados para la selección de pacientes
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [error, setError] = useState(null);

  // Otros estados para la configuración del test
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [numRounds, setNumRounds] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  // Cargar pacientes desde Supabase
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

  // Manejo de selección/deselección de carpetas (personas)
  const handlePersonSelection = (person) => {
    setSelectedPeople(prevState => {
      if (prevState.includes(person)) {
        return prevState.filter(p => p !== person);
      } else {
        return [...prevState, person];
      }
    });
  };

  // Manejo de la selección de emoción
  const handleEmotionSelection = (emotion) => {
    setSelectedEmotion(emotion);
  };

  // Cambio del número de rondas
  const handleRoundsChange = (event) => {
    setNumRounds(event.target.value);
  };

  // Función para obtener la imagen de vista previa de la carpeta
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

  // Función para obtener la imagen target para un folder en base a la emoción elegida y versión
  const getTargetImage = (folder) => {
    const targetLetter = emotionMapping[selectedEmotion];
    const targetImg = imagenesData.find(img => {
      if (img.folder !== folder) return false;
      const parts = img.file.split('_');
      return parts[3] === targetLetter && img.file.endsWith(`_${selectedVersion}.jpg`);
    });
    return targetImg ? {
      id: targetImg.id,
      url: `/images/${targetImg.folder}/${targetImg.file}`,
      folder: targetImg.folder
    } : null;
  };

  // Función para obtener imágenes distractoras: aquellas cuyo cuarto segmento NO es la letra target
  const getDistractorImages = (folder) => {
    const targetLetter = emotionMapping[selectedEmotion];
    const distractors = imagenesData.filter(img => {
      if (img.folder !== folder) return false;
      const parts = img.file.split('_');
      return parts[3] !== targetLetter;
    });
    // Mezcla aleatoria y toma 10 imágenes
    const shuffled = distractors.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10).map(img => ({
      id: img.id,
      url: `/images/${img.folder}/${img.file}`,
      folder: img.folder
    }));
  };

  // Función para iniciar el test y generar el JSON de configuración
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
    // Se asume que el target es la primera carpeta seleccionada
    const targetFolder = selectedPeople[0];
    let rounds = [];
    for (let i = 0; i < roundsNumber; i++) {
      let roundImages = [];
      if (selectedDifficulty === "facil") {
        // En modo fácil: 10 distractores + la imagen target.
        const distractorImgs = getDistractorImages(targetFolder);
        const targetImg = getTargetImage(targetFolder);
        roundImages = distractorImgs.concat(targetImg ? [targetImg] : []);
      } else {
        // Modo difícil: lógica previa (target + alternativa)
        let tempImages = imagenesData.filter(img => img.folder === targetFolder)
          .map(img => ({
            id: img.id,
            url: `/images/${img.folder}/${img.file}`,
            folder: img.folder
          }));
        const targetLetter = emotionMapping[selectedEmotion];
        const targetImgIndex = tempImages.findIndex(img =>
          img.url.includes(`_${targetLetter}_`) && img.url.endsWith(`_${selectedVersion}.jpg`)
        );
        if (targetImgIndex !== -1) {
          tempImages[targetImgIndex].isCorrect = true;
        }
        if (targetImgIndex !== -1) {
          const targetImg = tempImages[targetImgIndex];
          let altUrl;
          if (targetImg.url.includes('_a.jpg')) {
            altUrl = targetImg.url.replace('_a.jpg', '_b.jpg');
          } else if (targetImg.url.includes('_b.jpg')) {
            altUrl = targetImg.url.replace('_b.jpg', '_a.jpg');
          } else {
            altUrl = targetImg.url;
          }
          const altImg = {
            id: targetImg.id + "_alt",
            url: altUrl,
            folder: targetImg.folder,
            isCorrect: false
          };
          tempImages.push(altImg);
        }
        tempImages.sort(() => Math.random() - 0.5);
        roundImages = tempImages;
      }
      // Mezcla final de imágenes de la ronda
      roundImages.sort(() => Math.random() - 0.5);
      rounds.push({
        targetFolder,
        images: roundImages
      });
    }
    const startTime = Date.now();

    // Insertar el test en Supabase y recuperar el id insertado
    const { data: insertedTest, error } = await supabase
      .from('test')
      .insert([
        {
          user_id: selectedPatient,
          configuration: { rounds, selectedEmotion, selectedDifficulty, startTime },
          status: 'pendiente'
        }
      ])
      .select(); // Para que se retorne el registro insertado

    if (error) {
      console.error("Error al guardar la configuración del test", error);
      alert("Error al guardar la configuración del test");
      return;
    }
    const newTestId = insertedTest[0].id;
    alert("La configuración del test se ha guardado. Desde tu panel podrás iniciar el test.");
    // Navegar a TestPage pasando testId y la configuración
    navigate('/testpage', {
      state: {
        testId: newTestId,
        rounds,
        selectedEmotion,
        selectedVersion,
        selectedDifficulty
      }
    });
  };

  return (
    <div className="realizar-test-container">
      <h2>Test Psicológico: Identifica la emoción</h2>
      <div className="selection-wrapper">
        <div className="selection-container">
          <div className="people-selection">
            <h3>Selecciona las carpetas (personas):</h3>
            {people.map((person) => {
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
                        <path
                          d="m 13,983 c 33,6 40,26 55,48 "
                          stroke="black"
                          strokeWidth="3"
                          className="path1"
                          fill="none"
                        />
                        <path
                          d="M 75,970 C 51,981 34,1014 25,1031 "
                          stroke="black"
                          strokeWidth="3"
                          className="path1"
                          fill="none"
                        />
                      </g>
                    </svg>
                    {folderImageUrl && (
                      <img
                        src={folderImageUrl}
                        alt={`Happy ${person}`}
                        className="happy-image"
                      />
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
              {patients.map((patient) => (
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
