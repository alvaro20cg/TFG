// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import MainPage from './pages/MainPage';
import Admin from './pages/Admin';
import RegisterPatient from './pages/RegisterPatient';
import ConfigurarTest from './pages/ConfigurarTest';
import UserResults from './pages/UserResults';
import ViewPatients from './pages/ViewPatients';
import ViewResults from './pages/ViewResults';
import TestPage from './pages/TestPage';
import TestNumero from './pages/TestNumero';
import ConfigurarLetras from './pages/ConfigurarLetras';
import ResetPassword from './pages/ResetPassword';
import EyeTrackerReview from './pages/EyeTrackerReview';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/configurar-test" element={<ConfigurarTest />} />
        <Route path="/configurar-letras" element={<ConfigurarLetras />} />
        <Route path="/userresults" element={<UserResults />} />
        <Route path="/view-patients" element={<ViewPatients />} />
        <Route path="/view-results" element={<ViewResults />} />
        <Route path="/testpage" element={<TestPage />} />
        <Route path="/TestNumero" element={<TestNumero />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Nueva ruta para la revisión de eye-tracking */}
        <Route path="/eyetracker/:testId" element={<EyeTrackerReview />} />

        {/* Ruta comodín */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
