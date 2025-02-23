import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TestPage.css';

const TestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [positions, setPositions] = useState([]);

  // Redirige si no hay state
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  // Valores predeterminados
  const rounds = state?.rounds || [];
  const totalRounds = rounds.length;
  const currentRoundData = rounds[currentRoundIndex] || { images: [] };
  const images = currentRoundData.images;
  const startTime = state?.startTime || Date.now();

  // Pre-cargar imágenes de la ronda actual
  useEffect(() => {
    images.forEach(imgData => {
      const img = new Image();
      img.src = imgData.url;
    });
  }, [images]);

  // Genera posiciones sin solapamiento con imágenes de 15% de ancho y alto
  const generateNonOverlappingPositions = () => {
    const positions = [];
    const maxAttempts = 1000;
    const imageWidthPercent = 10;  // Ajusta según el tamaño deseado
    const imageHeightPercent = 25;
    const containerWidth = 100;
    const containerHeight = 80;

    for (let i = 0; i < images.length; i++) {
      let attempt = 0;
      let position;
      let overlapping = true;
      while (overlapping && attempt < maxAttempts) {
        const top = Math.random() * (containerHeight - imageHeightPercent);
        const left = Math.random() * (containerWidth - imageWidthPercent);
        position = { top, left, width: imageWidthPercent, height: imageHeightPercent };

        overlapping = positions.some(pos => {
          return !(
            (left + imageWidthPercent <= parseFloat(pos.left)) ||
            (left >= parseFloat(pos.left) + parseFloat(pos.width)) ||
            (top + imageHeightPercent <= parseFloat(pos.top)) ||
            (top >= parseFloat(pos.top) + parseFloat(pos.height))
          );
        });
        attempt++;
      }
      positions.push({
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: `${imageWidthPercent}%`,
        height: `${imageHeightPercent}%`
      });
    }
    return positions;
  };

  useEffect(() => {
    setPositions(generateNonOverlappingPositions());
    setRoundStartTime(Date.now());
  }, [currentRoundIndex, images]);

  const handleImageClick = (img) => {
    const clickTime = Date.now();
    const reactionTime = clickTime - roundStartTime;
    console.log(
      `Imagen ${img.id} clickeada en la ronda ${currentRoundIndex + 1}. Tiempo de reacción: ${reactionTime} ms`
    );
    
    if (currentRoundIndex < totalRounds - 1) {
      setCurrentRoundIndex(currentRoundIndex + 1);
    } else {
      alert("Test finalizado");
      // Aquí podrías redirigir o mostrar resultados
    }
  };

  if (!state) return null;

  return (
    <div className="testpage-container">
      <h2>Ronda {currentRoundIndex + 1} / {totalRounds}</h2>
      <div 
        className="images-container" 
        style={{ position: 'relative', height: '80vh', width: '100%', border: '1px solid #ccc' }}
      >
        {images.map((img, index) => (
          <img
            key={img.id}
            src={img.url}
            alt={`Imagen ${img.id}`}
            onClick={() => handleImageClick(img)}
            style={{
              position: 'absolute',
              cursor: 'pointer',
              objectFit: 'cover', // Para mantener la proporción sin distorsión
              ...positions[index]
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TestPage;
