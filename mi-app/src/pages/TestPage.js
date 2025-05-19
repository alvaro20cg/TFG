// src/components/TestPage.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import heatmap from 'heatmap.js';
import * as tf from '@tensorflow/tfjs';
import './TestPage.css';

const emotionMapping = {
  Alegría: 'h',
  Tristeza: 's',
  Enfado: 'f',
  Asco: 'd',
  Enojo: 'a',
  Neutral: 'n',
};

const TestPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Redirect si no hay testId
  useEffect(() => {
    if (!state?.testId) navigate('/');
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

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  const rounds = state?.rounds || [];
  const totalRounds = rounds.length;
  const currentRoundData = rounds[currentRoundIndex] || { images: [], targetFolder: '' };
  const originalImages = currentRoundData.images;
  const targetFolder = currentRoundData.targetFolder;

  // ---- Helpers de Supabase ----
  const saveRoundData = async () => {
    // Filtrar datos de esta ronda según timestamp
    const header = 'x,y,t\n';
    const rows = eyeTrackingData
      .filter(d => d.t >= roundStartTime)
      .map(d => `${d.x},${d.y},${d.t}`);
    const csvContent = header + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const filePath = `${testId}/round_${currentRoundIndex + 1}.csv`;

    // Subir CSV al bucket
    const { error: uploadError } = await supabase
      .storage
      .from('eye-tracking-csvs')
      .upload(filePath, blob, { contentType: 'text/csv', upsert: true });
    if (uploadError) throw uploadError;

    // Guardar metadata en round_data
    const { error: dbError } = await supabase
      .from('round_data')
      .insert([{
        test_id: testId,
        round_number: currentRoundIndex + 1,
        positions,
        eye_csv_path: filePath
      }]);
    if (dbError) throw dbError;
  };

  const saveCSV = async csv => {
    if (!testId) return;
    await supabase.from('csv_logs').insert([{ test_id: testId, csv_content: csv }]);
  };

  const saveResults = async (dur, corr, err) => {
    if (!testId) return;
    await supabase
      .from('test_results')
      .insert([{ test_id: testId, duration: dur, correct_count: corr, error_count: err }]);
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
    const dur = Math.round((Date.now() - testStartTime) / 1000);
    const corr = results.filter(r => r.result === 'acertado').length;
    const err = results.filter(r => r.result === 'fallado').length;
    await saveResults(dur, corr, err);
  };

  const saveComment = async () => {
    if (!commentText.trim()) return alert('El comentario no puede estar vacío.');
    const { error } = await supabase
      .from('trail_comments')
      .insert([{ test_id: testId, part: 'general', comment: commentText }]);
    if (error) return alert('Error guardando comentario.');
    await finalizeTest();
    await markTestDone();
    setShowCommentModal(false);
    setCommentSubmitted(true);
    alert('¡Gracias por tu feedback!');
    navigate('/userresults');
  };

  // ---- Lógica de rondas ----
  useEffect(() => {
    // Pre-carga de imágenes
    originalImages.forEach(img => {
      const preload = new Image();
      preload.src = img.url;
    });
  }, [originalImages]);

  const targetImage = useMemo(() => {
    const letter = emotionMapping[state.selectedEmotion];
    const found = originalImages.find(img => {
      if (img.folder !== targetFolder || !img.file) return false;
      const parts = img.file.split('_');
      return parts[3] === letter;
    });
    return found || originalImages.find(img => img.folder === targetFolder);
  }, [originalImages, targetFolder, state.selectedEmotion]);

  const generateNonOverlappingPositions = () => {
    const c = containerRef.current;
    if (!c) return [];
    const { width: cw, height: ch } = c.getBoundingClientRect();
    const wPct = 10, hPct = 25;
    const wPx = (wPct / 100) * cw, hPx = (hPct / 100) * ch;
    const pos = [];
    for (let i = 0; i < originalImages.length; i++) {
      let attempt = 0, topPx, leftPx, overlap;
      do {
        topPx = Math.random() * (ch - hPx);
        leftPx = Math.random() * (cw - wPx);
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
      top: `${(p.topPx / ch) * 100}%`,
      left: `${(p.leftPx / cw) * 100}%`,
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

  // ---- Inicializar WebGazer + TFJS y grabar coordenadas relativas ----
  useEffect(() => {
    let webgazerInst = null;
    let lastTs = 0;
    const initWebGazer = async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      let vid = document.getElementById('webgazerVideo');
      if (!vid) {
        vid = document.createElement('video');
        vid.id = 'webgazerVideo';
        vid.style.display = 'none';
        document.body.appendChild(vid);
      }

      const webgazerModule = await import('webgazer');
      const webgazer = webgazerModule.default;
      webgazerInst = webgazer;
      window.webgazer = webgazer;
      await webgazer.setRegression('ridge');
      await webgazer.setTracker('clmtrackr');
      await webgazer.begin();

      webgazer.showVideoPreview(false);
      webgazer.showPredictionPoints(false);

      webgazer.setGazeListener((data, ts) => {
        if (!containerRef.current) return;
        if (data && ts - lastTs > 100) {
          lastTs = ts;
          const rect = containerRef.current.getBoundingClientRect();
          const relX = (data.x - rect.left) / rect.width;
          const relY = (data.y - rect.top) / rect.height;
          if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
            setEyeTrackingData(prev => [
              ...prev,
              { x: relX, y: relY, t: Date.now() }
            ]);
          }
        }
      });
    };
    initWebGazer();
    return () => {
      if (webgazerInst) webgazerInst.end();
    };
  }, []);

  // ---- Render heatmap en vivo ----
  useEffect(() => {
    if (!containerRef.current) return;
    const heatmapContainer = containerRef.current.querySelector('.heatmap-container');
    if (!heatmapContainer) return;
    const hm = heatmap.create({
      container: heatmapContainer,
      radius: 50,
      maxOpacity: 0.6,
      minOpacity: 0.1,
      blur: 0.9
    });
    const points = eyeTrackingData.map(d => ({
      x: d.x * heatmapContainer.clientWidth,
      y: d.y * heatmapContainer.clientHeight,
      value: 1
    }));
    hm.setData({ max: 1, data: points });
  }, [eyeTrackingData]);

  // ---- Manejar clic en imagen ----
  const handleImageClick = async img => {
    if (showPreview) return;
    const rt = Math.round((Date.now() - roundStartTime) / 1000);
    const ok = img.id === targetImage.id;
    setResults(prev => [...prev, {
      round: currentRoundIndex + 1,
      reactionTime: rt,
      result: ok ? 'acertado' : 'fallado'
    }]);

    try {
      await saveRoundData();
    } catch (err) {
      console.error('Error guardando datos de ronda:', err);
      alert('Hubo un error al guardar los datos de esta ronda.');
      return;
    }

    setEyeTrackingData([]);
    if (currentRoundIndex < totalRounds - 1) {
      setCurrentRoundIndex(i => i + 1);
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
        <button className="cancel-btn" onClick={() => navigate('/userresults')}>
          Cancelar Test
        </button>
      </div>

      {showPreview && targetImage ? (
        <div className="preview-container">
          <img className="preview-image" src={targetImage.url} alt={`Target ${targetImage.id}`} />
          <p className="preview-text">Observa la imagen target</p>
          <p className="countdown">Comienza en {countdown}...</p>
        </div>
      ) : (
        <div className="images-container" ref={containerRef}>
          <div className="heatmap-container" />
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
