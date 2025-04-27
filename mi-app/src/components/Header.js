import React from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../config/supabase'; // Asegúrate de que la ruta es correcta
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión.');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="header">
      <button className="logout-btn" onClick={handleLogout}>
        Log Out
      </button>
    </header>
  );
};

export default Header;
