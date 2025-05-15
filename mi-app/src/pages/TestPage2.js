// src/pages/TestPage2.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestPage2.css';

// Genera posiciones aleatorias sin superposición
function generateNonOverlappingPositions(numStimuli, minDistance, containerWidth, containerHeight) {
  const positions = [];
  const maxAttempts = 1000;
  for (let i = 0; i < numStimuli; i++) {
    let attempts = 0, newPos;
    while (attempts < maxAttempts) {
      newPos = {
        x: Math.random() * (containerWidth - 50),
        y: Math.random() * (containerHeight - 50),
      };
      if (i === 0) {
        positions.push(newPos);
        break;
      } else {
        const dists = positions.map(p => Math.hypot(p.x - newPos.x, p.y - newPos.y));
        if (dists.every(d => d >= minDistance)) {
          positions.push(newPos);
          break;
        }
      }
      attempts++;
    }
    if (attempts === maxAttempts) {
      throw new Error('No se pudieron generar posiciones no superpuestas.');
    }
  }
  return positions;
}

const TestPage2 = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const testId = state?.testId;

  useEffect(() => {
    if (!testId) navigate('/');
  }, [testId, navigate]);

  const containerWidth = 750;
  const containerHeight = 550;

  // Estados de la prueba
  const [currentPart, setCurrentPart]       = useState(null); // 'A' | 'B' | 'finished'
  const [sequence, setSequence]             = useState([]);
  const [positions, setPositions]           = useState([]);
  const [clicks, setClicks]                 = useState(0);
  const [errors, setErrors]                 = useState(0);
  const [startTime, setStartTime]           = useState(null);
  const [buttonStatuses, setButtonStatuses] = useState([]);
  const [results, setResults]               = useState([]);

  // Estado global de inicio para duración total
  const [testStartTime, setTestStartTime]   = useState(null);

  // Estados para el modal de comentario
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText]           = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  // Inicia la prueba (Parte A o B)
  const startTest = (part) => {
    if (part === 'A') {
      setTestStartTime(Date.now());
    }
    let seq = [];
    if (part === 'A') {
      seq = Array.from({ length: 25 }, (_, i) => (i + 1).toString());
    } else {
      const numbers = Array.from({ length: 13 }, (_, i) => (i + 1).toString());
      const letters = 'ABCDEFGHIJKLM'.split('');
      seq = numbers.flatMap((num, i) => [num, letters[i]]);
    }
    setCurrentPart(part);
    setSequence(seq);
    setClicks(0);
    setErrors(0);
    setStartTime(Date.now());
    setButtonStatuses(Array(seq.length).fill('default'));
    setPositions(generateNonOverlappingPositions(
      seq.length, 80, containerWidth, containerHeight
    ));
  };

  // Guarda cada parte en trail_results
  const savePartResult = async (part, time, errors) => {
    const { error } = await supabase
      .from('trail_results')
      .insert([{ test_id: testId, part, time, errors, created_at: new Date() }]);
    if (error) console.error('Error guardando parte en Supabase:', error);
  };

  // Guarda el resumen global en test_results
  const saveTestResults = async () => {
    const duration = parseFloat(((Date.now() - testStartTime) / 1000).toFixed(2));
    const correctCount = results.reduce((sum, r) => sum + 1, 0);
    const errorCount = results.reduce((sum, r) => sum + r.errors, 0);
    const { error } = await supabase
      .from('test_results')
      .insert([{ test_id: testId, duration, correct_count: correctCount, error_count: errorCount, created_at: new Date() }]);
    if (error) console.error('Error guardando test_results en Supabase:', error);
  };

  // Actualiza estado del test a "realizado"
  const markTestDone = async () => {
    const { error } = await supabase
      .from('test')
      .update({ status: 'realizado' })
      .eq('id', testId);
    if (error) console.error('Error actualizando status en test:', error);
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
    await markTestDone();
    setShowCommentModal(false);
    setCommentSubmitted(true);
    alert('¡Gracias por tu feedback!');
  };

  // Maneja clics en los botones
  const handleButtonClick = async (index) => {
    if (buttonStatuses[index] === 'correct') return;

    if (index === clicks) {
      const updated = [...buttonStatuses];
      updated[index] = 'correct';
      setButtonStatuses(updated);
      setClicks(c => c + 1);

      if (clicks + 1 === sequence.length) {
        const elapsed = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
        alert(`Parte ${currentPart} completada en ${elapsed} s con ${errors} errores`);

        await savePartResult(currentPart, elapsed, errors);
        setResults(r => [...r, { part: currentPart, time: elapsed, errors }]);

        if (currentPart === 'A') {
          setTimeout(() => startTest('B'), 2000);
        } else {
          setCurrentPart('finished');
          await saveTestResults();
          setShowCommentModal(true);
        }
      }
    } else {
      const updated = [...buttonStatuses];
      updated[index] = 'error';
      setButtonStatuses(updated);
      setErrors(e => e + 1);
      setTimeout(() => {
        if (updated[index] === 'error') {
          updated[index] = 'default';
          setButtonStatuses([...updated]);
        }
      }, 200);
    }
  };

  // Renderers completos
  const renderTestArea = () => (
    <div className="tp2-test-area">
      {sequence.map((item, i) => {
        const pos = positions[i] || { x: 0, y: 0 };
        return (
          <button
            key={i}
            className={`tp2-stimulus ${buttonStatuses[i]}`}
            onClick={() => handleButtonClick(i)}
            disabled={buttonStatuses[i] === 'correct'}
            style={{ left: pos.x, top: pos.y }}
          >
            {item}
          </button>
        );
      })}
      {sequence.length > 0 && positions[0] && (
        <div className="tp2-label" style={{ left: positions[0].x, top: positions[0].y - 20 }}>
          inicio
        </div>
      )}
      {sequence.length > 0 && positions[sequence.length - 1] && (
        <div
          className="tp2-label"
          style={{
            left: positions[sequence.length - 1].x,
            top: positions[sequence.length - 1].y - 20
          }}
        >
          fin
        </div>
      )}
    </div>
  );

  const renderResults = () => (
    <div className="tp2-results-container">
      <h2>Resultados Finales</h2>
      <table className="tp2-results-table">
        <thead>
          <tr>
            <th>Parte</th>
            <th>Tiempo (s)</th>
            <th>Errores</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, idx) => (
            <tr key={idx}>
              <td>{r.part}</td>
              <td>{r.time}</td>
              <td>{r.errors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderInstructions = () => (
    <div className="tp2-instructions-container">
      <div className="tp2-welcome">Trail Making Test</div>
      <p className="tp2-instructions-text">
        Haga clic en los números por orden. Comience en el 1 y continúe hasta el final.
      </p>
      <button className="tp2-ingresar-btn" onClick={() => startTest('A')}>
        Iniciar
      </button>
    </div>
  );

  return (
    <div className="tp2-main-container">
      {currentPart === null && renderInstructions()}
      {(currentPart === 'A' || currentPart === 'B') && renderTestArea()}
      {currentPart === 'finished' && (
        <>
          {renderTestArea()}
          {renderResults()}
        </>
      )}

      {showCommentModal && (
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

      {commentSubmitted && (
        <button className="tp2-back-btn" onClick={() => navigate(-1)}>
          Atrás
        </button>
      )}
    </div>
  );
};

export default TestPage2;
