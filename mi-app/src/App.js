import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Admin from './pages/Admin';
import RegisterPatient from './pages/RegisterPatient';
import ConfigurarTest from './pages/ConfigurarTest';
import UserResults from './pages/UserResults';
import ViewPatients from './pages/ViewPatients';
import ViewResults from './pages/ViewResults';   // <-- aquí
import TestPage from './pages/TestPage';
import ResetPassword from './pages/ResetPassword';
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
        <Route path="/testpage" element={<TestPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/view-results" element={<ViewResults />} />  {/* <-- y aquí */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
