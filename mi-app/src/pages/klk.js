import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestPage.css';
import heatmap from 'heatmap.js'; // Importa la librería heatmap.js

const emotionMapping = {
  "Alegría": "h",
  "Tristeza": "s",
  "Enfado": "f",
  "Asco": "d",
  "Enojo": "a",
  "Neutral": "n"
};

const TestPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

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
  const [countdown, setCountdown] = useState(5);
  const [eyeTrackingData, setEyeTrackingData] = useState([]);

  const rounds = state?.rounds || [];
  const totalRounds = rounds.length;
  const currentRoundData = rounds[currentRoundIndex] || { images: [], targetFolder: '' };
  const originalImages = currentRoundData.images;
  const targetFolder = currentRoundData.targetFolder;

  useEffect(() => {
    // Pre-carga de imágenes
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
  }, [originalImages, targetFolder, state.selectedEmotion]);

  const generateNonOverlappingPositions = numImages => {
    const pos = [];
    const maxAttempts = 1000;
    const imageW = 10;
    const imageH = 25;
    const containerW = 100;
    const containerH = 80;
    for (let i = 0; i < numImages; i++) {
      let attempt = 0;
      let position;
      let overlap;
      do {
        const top = Math.random() * (containerH - imageH);
        const left = Math.random() * (containerW - imageW);
        position = { top, left, width: imageW, height: imageH };
        overlap = pos.some(p => !(
          left + imageW <= p.left ||
          left >= p.left + p.width ||
          top + imageH <= p.top ||
          top >= p.top + p.height
        ));
        attempt++;
      } while (overlap && attempt < maxAttempts);
      pos.push({
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: `${position.width}%`,
        height: `${position.height}%`
      });
    }
    return pos;
  };

  // Genera posiciones cuando termina el preview
  useEffect(() => {
    if (!showPreview) {
      setPositions(generateNonOverlappingPositions(originalImages.length));
      setRoundStartTime(Date.now());
    }
  }, [currentRoundIndex, originalImages.length, showPreview]);

  // Contador de 5 segundos para la vista previa
  useEffect(() => {
    let timer;
    if (showPreview) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowPreview(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentRoundIndex, showPreview]);

  const generateHeatmap = () => {
    const heatmapInstance = heatmap.create({
      container: document.querySelector('.heatmap-container'),
      radius: 50,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.9
    });
    const points = eyeTrackingData.map(d => ({ x: d.x, y: d.y, value: 1 }));
    heatmapInstance.setData({ max: 1, data: points });
  };

  useEffect(() => {
    if (eyeTrackingData.length > 0) generateHeatmap();
  }, [eyeTrackingData]);

  const saveCSVToSupabase = async csvContent => {
    if (!testId) return;
    const { error } = await supabase
      .from('csv_logs')
      .insert([{ test_id: testId, csv_content: csvContent }]);
    if (error) console.error("Error al guardar CSV:", error);
  };

  const saveTestResults = async (durationSec, correctCount, errorCount) => {
    const { error } = await supabase
      .from('test_results')
      .insert([{ test_id: testId, duration: durationSec, correct_count: correctCount, error_count: errorCount }]);
    if (error) console.error("Error al guardar resultados:", error);
  };

  const finalizeTest = async finalResults => {
    const csvContent = finalResults.reduce(
      (acc, curr) => acc + `${curr.round},${curr.reactionTime},${curr.result}\n`,
      "round,reactionTime,result\n"
    );
    await saveCSVToSupabase(csvContent);

    // Duración total en segundos
    const durationSec = Math.round((Date.now() - testStartTime) / 1000);
    const correctCount = finalResults.filter(r => r.result === "acertado").length;
    const errorCount = finalResults.filter(r => r.result === "fallado").length;
    await saveTestResults(durationSec, correctCount, errorCount);

    const { error } = await supabase
      .from('test')
      .update({ status: 'finalizado' })
      .match({ id: testId });
    if (error) console.error("Error al actualizar test:", error);

    navigate('/userresults');
  };

  const handleImageClick = img => {
    if (showPreview) return;
    // Tiempo de reacción en segundos
    const reactionTime = Math.round((Date.now() - roundStartTime) / 1000);
    const isCorrect = img.id === targetImage.id;
    const resultStr = isCorrect ? "acertado" : "fallado";
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

  return (
    <div className="testpage-container">
      <div className="testpage-header">
        <h2>Ronda {currentRoundIndex + 1} / {totalRounds}</h2>
        <div className="target-info">Busca: {targetFolder}</div>
        <button className="cancel-btn" onClick={() => navigate('/userresults')}>Cancelar Test</button>
      </div>

      {showPreview && targetImage ? (
        <div className="preview-container">
          <img className="preview-image" src={targetImage.url} alt={`Target ${targetImage.id}`} />
          <p className="preview-text">Observa la imagen target</p>
          <p className="countdown">Comienza en {countdown}...</p>
        </div>
      ) : (
        <div className="images-container" style={{ position: 'relative' }}>
          <div className="heatmap-container"
               style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
          {originalImages.map((img, idx) => (
            <div
              key={img.id}
              style={{ position: 'absolute', cursor: 'pointer', ...positions[idx] }}
              onClick={() => handleImageClick(img)}
            >
              <img
                src={img.url}
                alt={`Imagen ${img.id}`}
                style={{ width: '100%', height: '80%', objectFit: 'cover' }}
              />
              <p style={{ margin: 0, fontSize: '0.7rem', textAlign: 'center' }}>{img.file}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestPage;
