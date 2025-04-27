import React, { useState } from 'react';
import './TestPage2.css'; // Asegúrate de tener el archivo CSS en la misma carpeta

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
          Math.sqrt((pos.x - newPos.x) ** 2 + (pos.y - newPos.y) ** 2)
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
  // Dimensiones del área de prueba (similares a las del código MATLAB)
  const containerWidth = 750;
  const containerHeight = 550;

  // Estados para gestionar la prueba
  const [currentPart, setCurrentPart] = useState(null); // 'A', 'B' o 'finished'
  const [sequence, setSequence] = useState([]);
  const [positions, setPositions] = useState([]);
  const [clicks, setClicks] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  // Estado para el "status" de cada botón: 'default', 'correct' o 'error'
  const [buttonStatuses, setButtonStatuses] = useState([]);
  // Resultados acumulados de cada parte
  const [results, setResults] = useState([]);

  // Función para iniciar la prueba según la parte (A o B)
  const startTest = (part) => {
    let seq = [];
    if (part === 'A') {
      // Parte A: números del 1 al 25
      seq = Array.from({ length: 25 }, (_, i) => (i + 1).toString());
    } else if (part === 'B') {
      // Parte B: intercalar números (1-13) y letras (A-M)
      const numbers = Array.from({ length: 13 }, (_, i) => (i + 1).toString());
      const letters = 'ABCDEFGHIJKLM'.split('');
      seq = [];
      for (let i = 0; i < 13; i++) {
        seq.push(numbers[i]);
        seq.push(letters[i]);
      }
    }
    setCurrentPart(part);
    setSequence(seq);
    setClicks(0);
    setErrors(0);
    setStartTime(Date.now());
    setButtonStatuses(Array(seq.length).fill('default'));
    // Generar posiciones aleatorias sin superposición
    const pos = generateNonOverlappingPositions(seq.length, 80, containerWidth, containerHeight);
    setPositions(pos);
  };

  // Maneja el clic en cada botón del estímulo
  const handleButtonClick = (index) => {
    // Si ya se hizo clic correctamente, no se procesa
    if (buttonStatuses[index] === 'correct') return;

    // Verifica que se haga clic en el botón esperado (en orden)
    if (index === clicks) {
      const newStatuses = [...buttonStatuses];
      newStatuses[index] = 'correct';
      setButtonStatuses(newStatuses);
      setClicks(clicks + 1);

      // Si se completa la secuencia, se calcula el tiempo y se muestra el resultado
      if (clicks + 1 === sequence.length) {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        alert(`Parte ${currentPart} completada en ${elapsedTime} segundos con ${errors} errores.`);
        setResults([...results, { part: currentPart, time: elapsedTime, errors }]);
        if (currentPart === 'A') {
          // Después de la Parte A, se pasa automáticamente a la Parte B
          setTimeout(() => {
            startTest('B');
          }, 2000);
        } else {
          // Finaliza la prueba
          setCurrentPart('finished');
        }
      }
    } else {
      // Clic incorrecto: se muestra efecto de error y se incrementa el contador de errores
      const newStatuses = [...buttonStatuses];
      newStatuses[index] = 'error';
      setButtonStatuses(newStatuses);
      setErrors(errors + 1);
      setTimeout(() => {
        const updatedStatuses = [...newStatuses];
        if (updatedStatuses[index] === 'error') {
          updatedStatuses[index] = 'default';
          setButtonStatuses(updatedStatuses);
        }
      }, 200);
    }
  };

  // Renderiza el área de la prueba con todos los estímulos (botones)
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
      {sequence.map((item, index) => {
        const pos = positions[index] || { x: 0, y: 0 };
        let bgColor = '#f0f0f0'; // color por defecto
        if (buttonStatuses[index] === 'correct') {
          bgColor = '#b3e5b3'; // verde para acierto
        } else if (buttonStatuses[index] === 'error') {
          bgColor = '#f28b82'; // rojo para error
        }
        return (
          <button
            key={index}
            onClick={() => handleButtonClick(index)}
            disabled={buttonStatuses[index] === 'correct'}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: 50,
              height: 50,
              backgroundColor: bgColor,
              borderRadius: '5px',
              border: '1px solid #999',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            {item}
          </button>
        );
      })}
      {/* Etiqueta "inicio" para el primer estímulo */}
      {sequence[0] && positions[0] && (
        <div
          style={{
            position: 'absolute',
            left: positions[0].x,
            top: positions[0].y - 20,
            width: 50,
            textAlign: 'center',
            fontSize: '12px'
          }}
        >
          inicio
        </div>
      )}
      {/* Etiqueta "fin" para el último estímulo */}
      {sequence[sequence.length - 1] && positions[sequence.length - 1] && (
        <div
          style={{
            position: 'absolute',
            left: positions[sequence.length - 1].x,
            top: positions[sequence.length - 1].y - 20,
            width: 50,
            textAlign: 'center',
            fontSize: '12px'
          }}
        >
          fin
        </div>
      )}
    </div>
  );

  // Renderiza los resultados finales en una tabla
  const renderResults = () => (
    <div className="results-container">
      <h2>Resultados Finales</h2>
      <table className="results-table">
        <thead>
          <tr>
            <th>Parte</th>
            <th>Tiempo (s)</th>
            <th>Errores</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => (
            <tr key={idx}>
              <td>{result.part}</td>
              <td>{result.time}</td>
              <td>{result.errors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Pantalla inicial de instrucciones
  const renderInstructions = () => (
    <div className="instructions-container">
      <div className="welcome">Trail Making Test</div>
      <p className="instructions-text">
        Haga clic en los números por orden. Comience en el 1 y continúe hasta el final.
      </p>
      <button className="ingresar-btn" onClick={() => startTest('A')}>
        Iniciar
      </button>
    </div>
  );

  return (
    <div className="main-container">
      {currentPart === null && renderInstructions()}
      {(currentPart === 'A' || currentPart === 'B') && renderTestArea()}
      {currentPart === 'finished' && (
        <div>
          {renderTestArea()}
          {renderResults()}
        </div>
      )}
    </div>
  );
};

export default TestPage2;
