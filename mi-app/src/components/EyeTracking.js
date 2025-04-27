import React, { useState, useRef, useEffect } from 'react';

const EyeTracking = () => {
  const [eyes, setEyes] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    };

    startCamera();
  }, []);

  const captureAndSendFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Capturar un fotograma del video
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertirlo a base64 y enviarlo al backend
    const imageData = canvas.toDataURL('image/jpeg');
    
    const response = await fetch('http://localhost:5000/process', {
      method: 'POST',
      body: JSON.stringify({ image: imageData }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    setEyes(result); // Actualiza el estado con los resultados del backend
  };

  return (
    <div>
      <video ref={videoRef} autoPlay width="640" height="480" />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      <button onClick={captureAndSendFrame}>Capturar y Enviar</button>
      <div>
        {eyes.map((eye, index) => (
          <div key={index}>
            {eye.map((point, idx) => (
              <span key={idx}>({point[0]}, {point[1]}) </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EyeTracking;
