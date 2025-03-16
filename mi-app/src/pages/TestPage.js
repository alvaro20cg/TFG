import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestPage.css';

const emotionMapping = {
  "Alegría": "h",
  "Tristeza": "s",
  "Enfado": "f",
  "Asco": "d",
  "Enojo": "a",
  "Neutral": "n"
};

// Componente para mostrar la cámara y verificar la captura de la cara
const EyeTrackingPreview = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    async function getCameraStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
      }
    }
    getCameraStream();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Prueba de Cámara</h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '80%', maxWidth: '600px', borderRadius: '10px' }}
      />
      <p>Asegúrate de haber concedido permisos para acceder a la cámara.</p>
    </div>
  );
};

const TestPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Si no se recibe state o testId, redirige
  useEffect(() => {
    if (!state || !state.testId) {
      navigate('/');
    }
  }, [state, navigate]);

  const testId = state?.testId;
  const selectedVersion = state?.selectedVersion || "a";

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [testStartTime, setTestStartTime] = useState(Date.now());
  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState([]);
  const [showPreview, setShowPreview] = useState(true);

  const rounds = state?.rounds || [];
  const totalRounds = rounds.length;
  const currentRoundData = rounds[currentRoundIndex] || { images: [], targetFolder: '' };
  const originalImages = currentRoundData.images;
  const targetFolder = currentRoundData.targetFolder;

  useEffect(() => {
    originalImages.forEach(imgData => {
      const img = new Image();
      img.src = imgData.url;
    });
  }, [originalImages]);

  const targetImage = useMemo(() => {
    const targetLetter = emotionMapping[state.selectedEmotion];
    const found = originalImages.find(img => {
      if (img.folder !== targetFolder) return false;
      if (!img.file) return false;
      const parts = img.file.split('_');
      return parts[3] === targetLetter;
    });
    return found || originalImages.find(img => img.folder === targetFolder);
  }, [originalImages, targetFolder, selectedVersion, state.selectedEmotion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreview(false);
      setRoundStartTime(Date.now());
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentRoundIndex]);

  // Referencia para el contenedor del heatmap y datos
  const heatmapContainerRef = useRef(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const heatmapInstanceRef = useRef(null);

  useEffect(() => {
    if (heatmapContainerRef.current && window.h337) {
      // Inicializa heatmap.js
      heatmapInstanceRef.current = window.h337.create({
        container: heatmapContainerRef.current,
        radius: 50,
        maxOpacity: 0.6,
        minOpacity: 0,
        blur: 0.90
      });
    }
  }, []);

  // Inicia WebGazer y actualiza el heatmap
  useEffect(() => {
    if (window.webgazer) {
      window.webgazer
        .setRegression('ridge')
        .setGazeListener((data, elapsedTime) => {
          console.log('GazeListener invocado');
          if (data) {
            console.log('Eye tracking data:', data, 'elapsed:', elapsedTime);
            setHeatmapData(prev => [
              ...prev,
              { x: data.x, y: data.y, value: 1 }
            ]);
          } else {
            console.log('No hay datos de eye tracking en este momento.');
          }
        })
        .begin()
        .then(() => {
          console.log("WebGazer iniciado.");
          window.webgazer.showPredictionPoints(true);
        });
    }
    return () => {
      if (window.webgazer) {
        try {
          window.webgazer.pause();
          window.webgazer.clearData();
        } catch (e) {
          console.error("Error al detener WebGazer:", e);
        }
      }
    };
  }, []);

  // Actualiza el heatmap cada vez que cambian los datos
  useEffect(() => {
    if (heatmapInstanceRef.current && heatmapData.length > 0) {
      heatmapInstanceRef.current.setData({
        max: 10,
        data: heatmapData
      });
    }
  }, [heatmapData]);

  const generateNonOverlappingPositions = (numImages) => {
    const pos = [];
    const maxAttempts = 1000;
    const imageWidthPercent = 10;
    const imageHeightPercent = 25;
    const containerWidth = 100;
    const containerHeight = 80;
    for (let i = 0; i < numImages; i++) {
      let attempt = 0;
      let position;
      let overlapping = true;
      while (overlapping && attempt < maxAttempts) {
        const top = Math.random() * (containerHeight - imageHeightPercent);
        const left = Math.random() * (containerWidth - imageWidthPercent);
        position = { top, left, width: imageWidthPercent, height: imageHeightPercent };
        overlapping = pos.some(p => {
          return !(
            (left + imageWidthPercent <= parseFloat(p.left)) ||
            (left >= parseFloat(p.left) + parseFloat(p.width)) ||
            (top + imageHeightPercent <= parseFloat(p.top)) ||
            (top >= parseFloat(p.top) + parseFloat(p.height))
          );
        });
        attempt++;
      }
      pos.push({
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: `${imageWidthPercent}%`,
        height: `${imageHeightPercent}%`
      });
    }
    return pos;
  };

  const displayImages = originalImages;

  useEffect(() => {
    if (!showPreview) {
      setPositions(generateNonOverlappingPositions(displayImages.length));
      setRoundStartTime(Date.now());
    }
  }, [currentRoundIndex, displayImages.length, showPreview]);

  const generateCSVContent = () => {
    const header = "round,reactionTime,result\n";
    return results.reduce((acc, curr) => acc + `${curr.round},${curr.reactionTime},${curr.result}\n`, header);
  };

  const saveCSVToSupabase = async (csvContent) => {
    if (!testId) return;
    try {
      const { error } = await supabase
        .from('csv_logs')
        .insert([{ test_id: testId, csv_content: csvContent }]);
      if (error) console.error("Error al guardar CSV:", error);
    } catch (err) {
      console.error("Error en saveCSVToSupabase:", err);
    }
  };

  const saveTestResults = async (duration, correctCount, errorCount) => {
    try {
      const { error } = await supabase
        .from('test_results')
        .insert([{ test_id: testId, duration, correct_count: correctCount, error_count: errorCount }]);
      if (error) console.error("Error al guardar resultados:", error);
    } catch (err) {
      console.error("Error en saveTestResults:", err);
    }
  };

  const finalizeTest = async (finalResults) => {
    const csvContent = finalResults.reduce(
      (acc, curr) => acc + `${curr.round},${curr.reactionTime},${curr.result}\n`, 
      "round,reactionTime,result\n"
    );
    await saveCSVToSupabase(csvContent);
    const duration = Date.now() - testStartTime;
    const correctCount = finalResults.filter(r => r.result === "acertado").length;
    const errorCount = finalResults.filter(r => r.result === "fallado").length;
    await saveTestResults(duration, correctCount, errorCount);
    const { error } = await supabase
      .from('test')
      .update({ status: 'finalizado' })
      .match({ id: testId });
    if (error) {
      console.error("Error al actualizar test:", error);
    }
    navigate('/userresults');
  };

  const handleImageClick = (img) => {
    if (showPreview) return;
    const clickTime = Date.now();
    const reactionTime = clickTime - roundStartTime;
    const isCorrect = img.id === targetImage.id;
    const resultStr = isCorrect ? "acertado" : "fallado";

    console.log("imagen target:", targetImage, "imagen elegida:", img, resultStr);

    const newResult = { round: currentRoundIndex + 1, reactionTime, result: resultStr };
    const updatedResults = [...results, newResult];

    if (currentRoundIndex < totalRounds - 1) {
      setResults(updatedResults);
      setCurrentRoundIndex(currentRoundIndex + 1);
      setShowPreview(true);
    } else {
      setResults(updatedResults);
      alert("Test finalizado");
      finalizeTest(updatedResults);
    }
  };

  // Función para descargar el heatmap como imagen
  const downloadHeatmap = () => {
    if (heatmapContainerRef.current) {
      const canvas = heatmapContainerRef.current.querySelector("canvas");
      if (canvas) {
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = "heatmap.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error("No se encontró el canvas en el heatmap container.");
      }
    }
  };

  return (
    <div className="testpage-container">
      <div className="testpage-header">
        <h2>Ronda {currentRoundIndex + 1} / {totalRounds}</h2>
        <div className="target-info">Busca: {targetFolder}</div>
        <button className="cancel-btn" onClick={() => navigate('/userresults')}>Cancelar Test</button>
      </div>
      {/* Botón para descargar el mapa de calor */}
      <button 
        onClick={downloadHeatmap} 
        style={{ position: 'fixed', top: 10, right: 10, zIndex: 10000 }}
      >
        Descargar Mapa de Calor
      </button>
      {/* Contenedor para el heatmap */}
      <div 
        ref={heatmapContainerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999
        }}
      ></div>
      {/* Muestra la prueba de cámara para verificar el eye tracking */}
      <EyeTrackingPreview />
      {showPreview && targetImage ? (
        <div className="preview-container">
          <img className="preview-image" src={targetImage.url} alt={`Target ${targetImage.id}`} />
          <p className="preview-text">Observa la imagen target</p>
        </div>
      ) : (
        <div className="images-container">
          {displayImages.map((img, index) => (
            <div
              key={img.id}
              style={{
                position: 'absolute',
                cursor: 'pointer',
                ...positions[index]
              }}
              onClick={() => handleImageClick(img)}
            >
              <img
                src={img.url}
                alt={`Imagen ${img.id}`}
                style={{ width: '100%', height: '80%', objectFit: 'cover' }}
              />
              <p style={{ margin: '0', fontSize: '0.7rem', textAlign: 'center' }}>{img.file}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestPage;
