import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TestPage.css'; // Asegúrate de tener el archivo de estilo

const TestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extraer los datos enviados desde la página anterior (ConfigurarTest)
  const { images, correctPerson, startTime } = location.state || {};
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  
  const handleImageSelection = (image) => {
    setSelectedImage(image);
    setEndTime(Date.now()); // Registra el tiempo de finalización
  };

  useEffect(() => {
    if (selectedImage && endTime) {
      const reaction = (endTime - startTime) / 1000;
      setReactionTime(reaction);
      console.log(`Tiempo de reacción: ${reaction} segundos`);

      if (selectedImage.id === correctPerson) {
        setIsCorrect(true);
      } else {
        setIsCorrect(false);
      }
    }
  }, [selectedImage, endTime, correctPerson, startTime]);

  const handleNextRound = () => {
    // Redirigir a la página de resultados (o a la siguiente ronda si fuera necesario)
    navigate('/userresults', { state: { isCorrect, reactionTime } });
  };

  return (
    <div className="testpage-container">
      <h2>Test Psicológico: Identifica la emoción</h2>
      
      <div className="instructions">
        <p>Selecciona la imagen que crees que refleja la emoción correcta.</p>
      </div>
      
      <div className="images-container">
        {images && images.map((image) => (
          <div 
            key={image.id} 
            className="image-option"
            onClick={() => handleImageSelection(image)}
          >
            <img src={image.url} alt={`Persona ${image.id}`} />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="reaction-time">
          <p>Tiempo de reacción: {reactionTime ? `${reactionTime.toFixed(2)} segundos` : 'Esperando respuesta...'}</p>
        </div>
      )}

      {isCorrect !== null && (
        <div className="result">
          {isCorrect ? <p>¡Correcto!</p> : <p>¡Incorrecto! La persona correcta era {correctPerson}</p>}
        </div>
      )}

      <div className="next-round">
        <button onClick={handleNextRound} className="next-button">Siguiente</button>
      </div>
    </div>
  );
};

export default TestPage;
