import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConfigurarTest.css';
import imagenesData from '../json/imagenes.json';

const emotions = [
  "Alegría", "Tristeza", "Enfado", "Asco", "Sorpresa", "Neutral"
];

const people = ['004', '066', '079', '116', '140', '168'];

const ConfigurarTest = () => {
  const navigate = useNavigate();

  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [numRounds, setNumRounds] = useState(1);

  // Selección de carpetas (personas)
  const handlePersonSelection = (person) => {
    setSelectedPeople((prevState) => {
      if (prevState.includes(person)) {
        return prevState.filter(p => p !== person);
      } else {
        return [...prevState, person];
      }
    });
  };

  // Selección de emoción
  const handleEmotionSelection = (emotion) => {
    setSelectedEmotion(emotion);
  };

  // Cambio del número de rondas
  const handleRoundsChange = (event) => {
    setNumRounds(Number(event.target.value));
  };

  // Función que obtiene las imágenes del JSON para una carpeta (persona) determinada
  const getLocalImages = (person) => {
    const filteredImages = imagenesData.filter(img => img.folder === person);
    console.log(`Imágenes encontradas para la carpeta ${person}:`, filteredImages);
    
    const mappedImages = filteredImages.map(img => ({
      id: img.id,
      url: `/images/${img.folder}/${img.file}`
    }));
    console.log(`Imágenes mapeadas para la carpeta ${person}:`, mappedImages);
    
    return mappedImages;
  };

  // Función para iniciar el test
  const iniciarTest = () => {
    if (selectedPeople.length === 0 || !selectedEmotion) {
      alert('Debes seleccionar al menos una carpeta y una emoción.');
      return;
    }

    // Generamos un array de rondas:
    // Por cada carpeta seleccionada, se crearán "numRounds" rondas.
    let rounds = [];
    selectedPeople.forEach(folder => {
      for (let i = 0; i < numRounds; i++) {
        rounds.push({
          correctPerson: folder,
          images: getLocalImages(folder)
        });
      }
    });
    
    // (Opcional) Si deseas aleatorizar el orden de las rondas:
    rounds = rounds.sort(() => Math.random() - 0.5);

    const startTime = Date.now();
    console.log('Hora de inicio del test:', startTime);
    console.log('Rondas generadas:', rounds);

    // Redirige a la ruta /test pasando la configuración completa (array de rondas, emoción y tiempo de inicio)
    navigate('/test', { 
      state: { 
        rounds, 
        selectedEmotion, 
        startTime 
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
            {people.map((person) => (
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
                  <span>{person}</span>
                </label>
              </div>
            ))}
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
        
        <div className="rounds-selection">
          <label htmlFor="rounds">Número de rondas:</label>
          <input
            type="number"
            id="rounds"
            value={numRounds}
            onChange={handleRoundsChange}
            min="1"
            max="10"
          />
          <p>(Número de rondas por carpeta)</p>
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
