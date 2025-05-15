import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestNumero.css';

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

const TestNumero = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const testId = state?.testId;

  useEffect(() => {
    if (!testId) navigate('/');
  }, [testId, navigate]);

  const containerWidth = 750;
  const containerHeight = 550;

  const [currentPart, setCurrentPart] = useState(null); // 'A' | 'B' | 'finished'
  const [sequence, setSequence] = useState([]);
  const [positions, setPositions] = useState([]);
  const [clicks, setClicks] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [buttonStatuses, setButtonStatuses] = useState([]);
  const [results, setResults] = useState([]);

  const [testStartTime, setTestStartTime] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  // Inicia la prueba (Parte A o B)
  const startTest = (part) => {
    if (part === 'A') {
      setTestStartTime(Date.now());
      setResults([]);
    }
    const seq = part === 'A'
      ? Array.from({ length: 25 }, (_, i) => (i + 1).toString())
      : Array.from({ length: 13 }, (_, i) => (i + 1).toString())
          .flatMap((num, i) => [num, 'ABCDEFGHIJKLM'[i]]);

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

  // Guarda cada parte en trail_results con sus aciertos
  const savePartResult = async (part, time, errors, correctCount) => {
    const { error } = await supabase
      .from('trail_results')
      .insert([{ test_id: testId, part, time, errors, correct_count: correctCount, created_at: new Date() }]);
    if (error) console.error('Error guardando parte en Supabase:', error);
  };

  // Guarda CSV en csv_logs
  const saveCSVToSupabase = async (finalResults) => {
    const csvHeader = 'part,correct,errors,time\n';
    const csvBody = finalResults.map(r => `${r.part},${r.correctCount},${r.errors},${r.time}`).join('\n');
    const { error } = await supabase
      .from('csv_logs')
      .insert([{ test_id: testId, csv_content: csvHeader + csvBody + '\n' }]);
    if (error) console.error('Error guardando CSV en Supabase:', error);
  };

  // Guarda el resumen global en test_results sumando ambos tests
  const saveTestResults = async (finalResults) => {
    const duration = Math.round((Date.now() - testStartTime) / 1000);
    const correctCount = finalResults.reduce((sum, r) => sum + r.correctCount, 0);
    const errorCount   = finalResults.reduce((sum, r) => sum + r.errors, 0);
    const { error } = await supabase
      .from('test_results')
      .insert([{ test_id: testId, duration, correct_count: correctCount, error_count: errorCount, created_at: new Date() }]);
    if (error) console.error('Error guardando test_results en Supabase:', error);
  };

  // Marca el test como finalizado
  const markTestDone = async () => {
    const { error } = await supabase
      .from('test')
      .update({ status: 'finalizado' })
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
      const newClicks = clicks + 1;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const updatedStatuses = [...buttonStatuses];
      updatedStatuses[index] = 'correct';
      setButtonStatuses(updatedStatuses);
      setClicks(newClicks);

      if (newClicks === sequence.length) {
        const correctCount = updatedStatuses.filter(s => s === 'correct').length;
        await savePartResult(currentPart, elapsed, errors, correctCount);
        const updatedResults = [...results, { part: currentPart, time: elapsed, errors, correctCount }];
        setResults(updatedResults);

        if (currentPart === 'A') {
          setTimeout(() => startTest('B'), 2000);
        } else {
          await saveCSVToSupabase(updatedResults);
          await saveTestResults(updatedResults);
          await markTestDone();
          setCurrentPart('finished');
          setShowCommentModal(true);
        }
      }
    } else {
      const updated = [...buttonStatuses];
      updated[index] = 'error';
      setButtonStatuses(updated);
      setErrors(e => e + 1);
      setTimeout(() => {
        const reset = [...updated];
        reset[index] = 'default';
        setButtonStatuses(reset);
      }, 200);
    }
  };

  // Área de test
  const renderTestArea = () => (
    <div className="tp2-test-area">
      {sequence.map((item, i) => (
        <button
          key={i}
          className={`tp2-stimulus ${buttonStatuses[i]}`}
          onClick={() => handleButtonClick(i)}
          disabled={buttonStatuses[i] === 'correct'}
          style={{ left: positions[i]?.x, top: positions[i]?.y }}
        >
          {item}
        </button>
      ))}
      {sequence.length > 0 && positions[0] && (
        <div className="tp2-label" style={{ left: positions[0].x, top: positions[0].y - 20 }}>
          inicio
        </div>
      )}
      {sequence.length > 0 && positions[sequence.length - 1] && (
        <div className="tp2-label"
             style={{ left: positions[sequence.length - 1].x, top: positions[sequence.length - 1].y - 20 }}>
          fin
        </div>
      )}
    </div>
  );

  // Resultados resumidos con sumatorio final
  const renderResults = () => {
    const totalCorrect = results.reduce((sum, r) => sum + r.correctCount, 0);
    const totalErrors  = results.reduce((sum, r) => sum + r.errors, 0);
    const totalTime    = results.reduce((sum, r) => sum + r.time, 0);
    return (
      <div className="tp2-results-container">
        <h2>Resultados Finales</h2>
        <table className="tp2-results-table">
          <thead>
            <tr>
              <th>Parte</th>
              <th>Aciertos</th>
              <th>Errores</th>
              <th>Tiempo (s)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx}>
                <td>{r.part}</td>
                <td>{r.correctCount}</td>
                <td>{r.errors}</td>
                <td>{r.time}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{totalCorrect}</td>
              <td>{totalErrors}</td>
              <td>{totalTime}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  // Instrucciones
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
      {currentPart === 'finished' && renderResults()}

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

export default TestNumero;
