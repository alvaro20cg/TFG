import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestPage.css';

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { createDetector, SupportedModels } from '@tensorflow-models/face-landmarks-detection';
import heatmap from 'heatmap.js';

const emotionMapping = {
  Alegría: 'h',
  Tristeza: 's',
  Enfado: 'f',
  Asco: 'd',
  Enojo: 'a',
  Neutral: 'n'
};

const TestPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const runningRef = useRef(true);

  // Setup camera and FaceMesh model
  useEffect(() => {
    if (!state || !state.testId) {
      navigate('/');
      return;
    }
    async function setup() {
      try {
        // 1. Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise(res => { video.onloadedmetadata = res; });
        await video.play();

        // 2. Initialize TFJS backend
        await tf.setBackend('webgl');
        await tf.ready();

        // 3. Load FaceMesh detector
        modelRef.current = await createDetector(
          SupportedModels.MediaPipeFaceMesh,
          { runtime: 'tfjs', maxFaces: 1 }
        );
        console.log('Modelo FaceMesh cargado');

        // 4. Start detection loop
        requestAnimationFrame(detectLoop);
      } catch (e) {
        console.error('Error setup camera/model:', e);
      }
    }
    setup();

    // Stop loop when unmounting
    return () => { runningRef.current = false; };
  }, [state, navigate]);

  const testId = state?.testId;
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [testStartTime] = useState(Date.now());
  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState([]);
  const [showPreview, setShowPreview] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [eyeTrackingData, setEyeTrackingData] = useState([]);

  const rounds = state?.rounds || [];
  const totalRounds = rounds.length;
  const currentRoundData = rounds[currentRoundIndex] || { images: [], targetFolder: '' };
  const originalImages = currentRoundData.images;
  const targetFolder = currentRoundData.targetFolder;

  // Preload images
  useEffect(() => {
    originalImages.forEach(img => new Image().src = img.url);
  }, [originalImages]);

  // Determine target image based on emotion mapping
  const targetImage = useMemo(() => {
    const letter = emotionMapping[state.selectedEmotion];
    return originalImages.find(img => img.folder === targetFolder && img.file?.split('_')[3] === letter)
      || originalImages.find(img => img.folder === targetFolder);
  }, [originalImages, targetFolder, state.selectedEmotion]);

  // Generate non-overlapping positions
  const generatePositions = num => {
    const pos = [];
    for (let i = 0; i < num; i++) {
      let attempt = 0;
      let p;
      do {
        const top = Math.random() * 75;
        const left = Math.random() * 90;
        p = { top: `${top}%`, left: `${left}%`, width: '10%', height: '25%' };
        attempt++;
      } while (
        pos.some(o =>
          !(parseFloat(p.left) + 10 <= parseFloat(o.left) ||
            parseFloat(p.left) >= parseFloat(o.left) + 10 ||
            parseFloat(p.top) + 25 <= parseFloat(o.top) ||
            parseFloat(p.top) >= parseFloat(o.top) + 25)
        ) && attempt < 500
      );
      pos.push(p);
    }
    return pos;
  };

  // When preview ends, set up round
  useEffect(() => {
    if (!showPreview) {
      setPositions(generatePositions(originalImages.length));
      setRoundStartTime(Date.now());
      console.log('Iniciando ronda', currentRoundIndex + 1);
    }
  }, [showPreview, currentRoundIndex, originalImages.length]);

  // 10s countdown preview
  useEffect(() => {
    if (!showPreview) return;
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          setShowPreview(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentRoundIndex, showPreview, originalImages.length]);

  // Detection loop: runs via requestAnimationFrame
  const detectLoop = async () => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const model = modelRef.current;
    if (!video || !model || video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA || showPreview) {
      return requestAnimationFrame(detectLoop);
    }
    try {
      const faces = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: true
      });
      if (faces.length) {
        const iris = faces[0].annotations.leftEyeIris;
        const cx = (iris[0][0] + iris[1][0] + iris[2][0] + iris[3][0]) / 4;
        const cy = (iris[0][1] + iris[1][1] + iris[2][1] + iris[3][1]) / 4;
        const cont = document.querySelector('.images-container').getBoundingClientRect();
        const x = cx - cont.left;
        const y = cy - cont.top;
        console.log('Iris en:', x, y);
        setEyeTrackingData(prev => {
          const next = [...prev, { x, y }];
          return next.length > 500 ? next.slice(-500) : next;
        });
      }
    } catch (e) {
      console.error('DetectLoop error:', e);
    }
    requestAnimationFrame(detectLoop);
  };

  // Generate heatmap when data arrives
  useEffect(() => {
    if (showPreview || !eyeTrackingData.length) return;
    console.log('Heatmap con puntos:', eyeTrackingData.length);
    const container = document.querySelector('.heatmap-container');
    container.innerHTML = '';
    const hm = heatmap.create({ container, radius: 50, maxOpacity: 0.6, minOpacity: 0.1, blur: 0.9 });
    hm.setData({ max: 1, data: eyeTrackingData.map(p => ({ x: p.x, y: p.y, value: 1 })) });
  }, [eyeTrackingData, showPreview]);

  // Supabase save functions
  const saveCSV = async csv => {
    if (!testId) return;
    await supabase.from('csv_logs').insert([{ test_id: testId, csv_content: csv }]);
  };
  const saveResults = async (dur, corr, err) =>
    await supabase.from('test_results').insert([{ test_id: testId, duration: dur, correct_count: corr, error_count: err }]);

  // Finalize test: save, download heatmap, navigate
  const finalizeTest = async fr => {
    console.log('Finalizando test', fr);
    const csv = fr.reduce((a, c) => a + `${c.round},${c.reactionTime},${c.result}\n`, 'round,reactionTime,result\n');
    await saveCSV(csv);
    const dur = Math.round((Date.now() - testStartTime) / 1000);
    const corr = fr.filter(r => r.result === 'acertado').length;
    const err = fr.filter(r => r.result === 'fallado').length;
    await saveResults(dur, corr, err);

    const canvas = document.querySelector('.heatmap-container canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL();
      link.download = `heatmap_test_${testId}.png`;
      link.click();
      console.log('Heatmap descargado');
    }

    await supabase.from('test').update({ status: 'finalizado' }).match({ id: testId });
    navigate('/userresults');
  };

  // Handle image clicks
  const handleImageClick = img => {
    if (showPreview) return;
    const rt = Math.round((Date.now() - roundStartTime) / 1000);
    const res = img.id === targetImage.id ? 'acertado' : 'fallado';
    console.log(`Ronda ${currentRoundIndex + 1}: img ${img.id}, ${res}, ${rt}s`);
    const newRes = { round: currentRoundIndex + 1, reactionTime: rt, result: res };
    const updated = [...results, newRes];
    setResults(updated);

    if (currentRoundIndex < totalRounds - 1) {
      setCurrentRoundIndex(i => i + 1);
      setShowPreview(true);
      setEyeTrackingData([]);
    } else {
      console.log('Última ronda completada');
      finalizeTest(updated);
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
          <img className="preview-image" src={targetImage.url} alt="Target" />
          <p className="preview-text">Observa la imagen target</p>
          <p className="countdown">Comienza en {countdown}...</p>
        </div>
      ) : (
        <div className="images-container">
          <div className="heatmap-container"></div>
          {originalImages.map((img, idx) => (
            <div
              key={img.id}
              style={{ position: 'absolute', cursor: 'pointer', ...positions[idx] }}
              onClick={() => handleImageClick(img)}
            >
              <img src={img.url} alt="" style={{ width: '100%', height: '80%', objectFit: 'cover' }} />
              <p style={{ margin: 0, fontSize: '0.7rem', textAlign: 'center' }}>{img.file}</p>
            </div>
          ))}
        </div>
      )}

      <video ref={videoRef} style={{ display: 'none' }} playsInline muted width="640" height="480" />
    </div>
  );
};

export default TestPage;
