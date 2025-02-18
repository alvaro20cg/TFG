import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
// Importa los componentes para las nuevas páginas si ya los tienes o crea placeholders:
import RegisterPatient from './pages/RegisterPatient';
import RealizarTest from './pages/RealizarTest';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/realizar-test" element={<RealizarTest />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
