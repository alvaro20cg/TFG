import React from 'react';
import Header from '../components/Header';
import './RealizarTest.css';

const RealizarTest = () => {
  return (
    <>
      <Header />
      <div className="realizar-test-container">
        <h2>Realizar Test</h2>
        <div className="test-content">
          <p>Aquí se mostrarán las preguntas del test.</p>
          <button className="test-btn">Iniciar Test</button>
        </div>
      </div>
    </>
  );
};

export default RealizarTest;
