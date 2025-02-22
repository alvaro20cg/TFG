import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase';
import './ConfigurarTest.css';

const emotions = [
  "Alegría", "Tristeza", "Enfado", "Asco", "Sorpresa", "Neutral"
];

const people = ['004', '066', '079', '116', '140', '168'];

const RealizarTest = () => {
  const navigate = useNavigate();
  
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [numRounds, setNumRounds] = useState(1);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [correctPerson, setCorrectPerson] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [testStarted, setTestStarted] = useState(false);

  const handlePersonSelection = (person) => {
    console.log(`Persona seleccionada: ${person}`);
    setSelectedPeople((prevState) => {
      if (prevState.includes(person)) {
        console.log(`Desmarcando la persona ${person}`);
        return prevState.filter(p => p !== person);
      } else {
        console.log(`Marcando la persona ${person}`);
        return [...prevState, person];
      }
    });
  };

  const handleEmotionSelection = (emotion) => {
    console.log(`Emoción seleccionada: ${emotion}`);
    setSelectedEmotion(emotion);
  };

  const handleRoundsChange = (event) => {
    console.log(`Número de rondas cambiado a: ${event.target.value}`);
    setNumRounds(Number(event.target.value));
  };

  // Función para cargar todas las imágenes de la persona seleccionada
  const loadImages = async () => {
    console.log('Cargando imágenes...');
    console.log('selectedPeople:', selectedPeople);
    console.log('selectedEmotion:', selectedEmotion);

    if (selectedPeople.length === 0) {
      console.log('No se han seleccionado personas. Abortando...');
      return;
    }

    const person = selectedPeople[0];  // Solo consideramos una persona a la vez
    console.log('Persona seleccionada:', person);

    const personImages = await fetchPersonImages(person);
    console.log('Imágenes de la persona seleccionada:', personImages);
    
    setImages(personImages);
    setCorrectPerson(person);
    setStartTime(Date.now());
    console.log('Iniciando test, redirigiendo...');
    navigate('/test', { state: { images: personImages, correctPerson: person, startTime: Date.now() } });
  };

  // Fetch images for selected person from Supabase
  const fetchPersonImages = async (person) => {
    console.log(`Obteniendo imágenes para la persona: ${person}`);

    const { data, error } = await supabase
      .storage
      .from('fotos')  // Usando el bucket 'fotos'
      .list(person, { limit: 12 });  // Obtiene todas las imágenes de la carpeta correspondiente

    if (error) {
      console.error('Error al obtener las imágenes:', error);
      return [];
    }

    console.log('Imágenes obtenidas:', data);
    return data.map(item => {
      const url = supabase
        .storage
        .from('fotos')
        .getPublicUrl(`${person}/${item.name}`).publicURL;  // Obtiene la URL pública para la imagen
      console.log(`URL de la imagen: ${url}`);
      return { id: item.name, url };
    });
  };

  const handleImageSelection = (image) => {
    console.log(`Imagen seleccionada: ${image.id}`);
    setSelectedImage(image);
    setEndTime(Date.now()); // Registra el tiempo de finalización
    calculateReactionTime();
  };

  const calculateReactionTime = () => {
    if (!endTime || !startTime) {
      console.log('No se han registrado los tiempos correctamente.');
      return;
    }

    const reactionTime = (endTime - startTime) / 1000;
    console.log(`Tiempo de reacción: ${reactionTime} segundos`);

    if (selectedImage && selectedImage.id === correctPerson) {
      console.log('Respuesta correcta');
      setIsCorrect(true);
    } else {
      console.log('Respuesta incorrecta');
      setIsCorrect(false);
    }
  };

  useEffect(() => {
    if (!testStarted) return;

    if (selectedPeople.length > 0) {
      console.log('Iniciando el test...');
      loadImages();
    }
  }, [testStarted, selectedPeople, selectedEmotion]);

  return (
    <div className={`realizar-test-container ${testStarted ? 'test-started' : ''}`}>
      <h2>Test Psicológico: Identifica la emoción en la persona</h2>
      <div className="selection-wrapper">
        <div className="selection-container">
          <div className="people-selection">
            <h3>Selecciona las personas:</h3>
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
              <h1>Selecciona la emoción</h1>
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
        </div>
      </div>

      <div className="button-container">
        <button onClick={() => navigate(-1)} className="back-btn">Atrás</button>
        <button onClick={() => setTestStarted(true)} className="start-button">Realizar Test</button>
      </div>

      {images.length > 0 && (
        <div className="images-container">
          {images.map((image) => (
            <div
              key={image.id}
              className="image-option"
              onClick={() => handleImageSelection(image)}
            >
              <img src={image.url} alt={`Persona ${image.id}`} />
            </div>
          ))}
        </div>
      )}

      {isCorrect !== null && (
        <div className="result">
          {isCorrect 
            ? <p>¡Correcto!</p> 
            : <p>¡Incorrecto! La persona correcta era {correctPerson}</p>}
        </div>
      )}
    </div>
  );
};
export default RealizarTest;
