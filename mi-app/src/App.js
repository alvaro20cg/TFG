import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Admin from './pages/Admin';
import RegisterPatient from './pages/RegisterPatient';
import ConfigurarTest from './pages/ConfigurarTest';
import UserResults from './pages/UserResults';
import ViewPatients from './pages/ViewPatients';
import TestPage from './pages/TestPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/configurar-test" element={<ConfigurarTest />} />
        <Route path="/userresults" element={<UserResults />} />
        <Route path="/view-patients" element={<ViewPatients />} />
        <Route path="/test" element={<TestPage />} /> {/* Ruta correcta para TestPage */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
