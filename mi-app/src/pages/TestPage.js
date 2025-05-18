// src/components/TestPage.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestPage.css';
import heatmap from 'heatmap.js';

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
  const containerRef = useRef(null);

  useEffect(() => {
    if (!state || !state.testId) {
      navigate('/');
    }
  }, [state, navigate]);

  const testId = state?.testId;
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [testStartTime] = useState(Date.now());
  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState([]);
  const [showPreview, setShowPreview] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [eyeTrackingData, setEyeTrackingData] = useState([]);

  // Nuevos estados para el modal de feedback
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

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
  }, [originalImages, targetFolder, state.selectedEmotion]);

  const generateNonOverlappingPositions = () => {
    const container = containerRef.current;
    if (!container) return [];
    const { width: cw, height: ch } = container.getBoundingClientRect();
    const wPct = 10, hPct = 25;
    const wPx = (wPct/100)*cw, hPx = (hPct/100)*ch;
    const pos = [];
    for (let i = 0; i < originalImages.length; i++) {
      let attempt = 0, topPx, leftPx, overlap;
      do {
        topPx = Math.random()*(ch - hPx);
        leftPx = Math.random()*(cw - wPx);
        overlap = pos.some(p =>
          !(leftPx + wPx <= p.leftPx ||
            leftPx >= p.leftPx + p.widthPx ||
            topPx + hPx <= p.topPx ||
            topPx >= p.topPx + p.heightPx)
        );
        attempt++;
      } while (overlap && attempt < 1000);
      pos.push({ topPx, leftPx, widthPx: wPx, heightPx: hPx });
    }
    return pos.map(p => ({
      top: `${(p.topPx/ch)*100}%`,
      left: `${(p.leftPx/cw)*100}%`,
      width: `${wPct}%`,
      height: `${hPct}%`
    }));
  };

  useEffect(() => {
    if (!showPreview) {
      setPositions(generateNonOverlappingPositions());
      setRoundStartTime(Date.now());
    }
  }, [currentRoundIndex, showPreview]);

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
    const instance = heatmap.create({
      container: containerRef.current.querySelector('.heatmap-container'),
      radius: 50, maxOpacity: 0.6, minOpacity: 0.1, blur: 0.9
    });
    const points = eyeTrackingData.map(d => ({ x: d.x, y: d.y, value: 1 }));
    instance.setData({ max:1, data: points });
  };

  useEffect(() => {
    if (eyeTrackingData.length) generateHeatmap();
  }, [eyeTrackingData]);

  const saveCSV = async csvContent => {
    if (!testId) return;
    await supabase.from('csv_logs').insert([{ test_id: testId, csv_content: csvContent }]);
  };

  const saveResults = async (durationSec, correctCount, errorCount) => {
    if (!testId) return;
    await supabase.from('test_results')
      .insert([{ test_id: testId, duration: durationSec, correct_count: correctCount, error_count: errorCount }]);
  };

  const markTestDone = async () => {
    if (!testId) return;
    await supabase.from('test').update({ status: 'finalizado' }).match({ id: testId });
  };

  const finalizeTest = async () => {
    const csv = results.reduce(
      (acc, r) => acc + `${r.round},${r.reactionTime},${r.result}\n`,
      "round,reactionTime,result\n"
    );
    await saveCSV(csv);
    const durationSec = Math.round((Date.now() - testStartTime)/1000);
    const correct = results.filter(r => r.result === 'acertado').length;
    const errors = results.filter(r => r.result === 'fallado').length;
    await saveResults(durationSec, correct, errors);
    // Nota: no navegamos aquí; espera a comentario
  };

  // Guarda el comentario en trail_comments
  const saveComment = async () => {
    if (!commentText.trim()) {
      alert('El comentario no puede estar vacío.');
      return;
    }
    const { error } = await supabase
      .from('trail_comments')
      .insert([{ test_id: testId, part: 'general', comment: commentText }]);
    if (error) {
      console.error('Error guardando comentario:', error);
      alert('Hubo un error guardando tu comentario.');
      return;
    }
    // Guardar CSV y resultados antes de marcar como hecho
    await finalizeTest();
    await markTestDone();
    setShowCommentModal(false);
    setCommentSubmitted(true);
    alert('¡Gracias por tu feedback!');
    navigate('/userresults');
  };

  const handleImageClick = img => {
    if (showPreview) return;
    const reactionTime = Math.round((Date.now() - roundStartTime)/1000);
    const isCorrect = img.id === targetImage.id;
    const result = isCorrect ? 'acertado' : 'fallado';
    const next = { round: currentRoundIndex+1, reactionTime, result };
    setResults(prev => [...prev, next]);

    if (currentRoundIndex < totalRounds - 1) {
      setCurrentRoundIndex(prev => prev + 1);
      setShowPreview(true);
    } else {
      setShowCommentModal(true);
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
        <div className="images-container" ref={containerRef}>
          <div className="heatmap-container"></div>
          {originalImages.map((img, idx) => (
            <div
              key={img.id}
              className="image-wrapper"
              style={positions[idx]}
              onClick={() => handleImageClick(img)}
            >
              <img src={img.url} alt={`Imagen ${img.id}`} />
              <p>{img.file}</p>
            </div>
          ))}
        </div>
      )}

      {showCommentModal && !commentSubmitted && (
        <div className="tp2-comment-overlay">
          <div className="tp2-comment-modal">
            <h2>Comentario</h2>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Escribe aquí tu feedback…"
            />
            <button onClick={saveComment}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;
