import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Admin from './pages/Admin';
import RegisterPatient from './pages/RegisterPatient';
import RealizarTest from './pages/RealizarTest';
import UserResults from './pages/UserResults';
import ViewPatients from './pages/ViewPatients';  // Importa la nueva página
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/realizar-test" element={<RealizarTest />} />
        <Route path="/userresults" element={<UserResults />} />
        <Route path="/view-patients" element={<ViewPatients />} />  {/* Nueva ruta para ver pacientes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
