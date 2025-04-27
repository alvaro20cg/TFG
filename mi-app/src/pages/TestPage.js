import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [eyeTrackingData, setEyeTrackingData] = useState([]);

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

  const generateHeatmap = () => {
    const heatmapInstance = heatmap.create({
      container: document.querySelector('.heatmap-container'),
      radius: 50,  // Tamaño de los puntos del mapa de calor
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.9
    });

    // Procesa los datos de seguimiento ocular para adaptarlos al mapa de calor
    const points = eyeTrackingData.map(data => ({
      x: data.x,
      y: data.y,
      value: 1
    }));

    // Cargar los puntos en el mapa de calor
    heatmapInstance.setData({ max: 1, data: points });
  };

  useEffect(() => {
    if (eyeTrackingData.length > 0) {
      generateHeatmap();
    }
  }, [eyeTrackingData]);

  // Función para generar y guardar el CSV con los resultados del test
  const generateCSVContent = () => {
    const header = "round,reactionTime,result\n";
    return results.reduce((acc, curr) => acc + `${curr.round},${curr.reactionTime},${curr.result}\n`, header);
  };

  // Función para guardar el CSV en Supabase
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

  // Función para guardar los resultados del test en Supabase
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
      finalizeTest(updatedResults);  // Aquí llamamos a finalizeTest
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
        </div>
      ) : (
        <div className="images-container" style={{ position: 'relative' }}>
          <div className="heatmap-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>
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
