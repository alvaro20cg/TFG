// src/pages/TestPage2.js
import React, { useState } from 'react';
import './TestPage2.css'; // Asegúrate de que aquí importes el CSS con las clases tp2-

// Función para generar posiciones aleatorias sin superposición
function generateNonOverlappingPositions(numStimuli, minDistance, containerWidth, containerHeight) {
  const positions = [];
  const maxAttempts = 1000;
  for (let i = 0; i < numStimuli; i++) {
    let attempts = 0;
    let newPos;
    while (attempts < maxAttempts) {
      newPos = {
        x: Math.random() * (containerWidth - 50),
        y: Math.random() * (containerHeight - 50)
      };
      if (i === 0) {
        positions.push(newPos);
        break;
      } else {
        const dists = positions.map(pos =>
          Math.hypot(pos.x - newPos.x, pos.y - newPos.y)
        );
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
  // Dimensiones del área de prueba
  const containerWidth = 750;
  const containerHeight = 550;

  // Estados para gestionar la prueba
  const [currentPart, setCurrentPart] = useState(null); // 'A', 'B' o 'finished'
  const [sequence, setSequence] = useState([]);
  const [positions, setPositions] = useState([]);
  const [clicks, setClicks] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [buttonStatuses, setButtonStatuses] = useState([]);
  const [results, setResults] = useState([]);

  // Inicia la prueba (Parte A o B)
  const startTest = (part) => {
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
    setPositions(generateNonOverlappingPositions(seq.length, 80, containerWidth, containerHeight));
  };

  // Maneja clics en los estímulos
  const handleButtonClick = (index) => {
    if (buttonStatuses[index] === 'correct') return;
    if (index === clicks) {
      const updated = [...buttonStatuses];
      updated[index] = 'correct';
      setButtonStatuses(updated);
      setClicks(c => c + 1);
      if (clicks + 1 === sequence.length) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        alert(`Parte ${currentPart} completada en ${elapsed} s con ${errors} errores`);
        setResults(r => [...r, { part: currentPart, time: elapsed, errors }]);
        if (currentPart === 'A') {
          setTimeout(() => startTest('B'), 2000);
        } else {
          setCurrentPart('finished');
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

  // Renderiza área de estímulos
  const renderTestArea = () => (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        position: 'relative',
        margin: '0 auto',
        border: '1px solid #ccc'
      }}
    >
      {sequence.map((item, i) => {
        const pos = positions[i] || { x: 0, y: 0 };
        let bg = '#f0f0f0';
        if (buttonStatuses[i] === 'correct') bg = '#b3e5b3';
        if (buttonStatuses[i] === 'error') bg = '#f28b82';
        return (
          <button
            key={i}
            onClick={() => handleButtonClick(i)}
            disabled={buttonStatuses[i] === 'correct'}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: 50,
              height: 50,
              backgroundColor: bg,
              borderRadius: 5,
              border: '1px solid #999',
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {item}
          </button>
        );
      })}
      {/* Etiquetas inicio/fin */}
      {sequence.length > 0 && positions[0] && (
        <div style={{
          position: 'absolute',
          left: positions[0].x,
          top: positions[0].y - 20,
          width: 50,
          textAlign: 'center',
          fontSize: 12
        }}>inicio</div>
      )}
      {sequence.length > 0 && positions[sequence.length - 1] && (
        <div style={{
          position: 'absolute',
          left: positions[sequence.length - 1].x,
          top: positions[sequence.length - 1].y - 20,
          width: 50,
          textAlign: 'center',
          fontSize: 12
        }}>fin</div>
      )}
    </div>
  );

  // Renderiza resultados finales
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

  // Pantalla inicial
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
    </div>
  );
};

export default TestPage2;
