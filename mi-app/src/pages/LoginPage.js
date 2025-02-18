import React, { useState } from 'react';
import Modal from '../components/Modal'; // Componente Modal reutilizable
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage() {
    const [showModal, setShowModal] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const navigate = useNavigate();

    const handleStartClick = () => {
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (usuario === 'admin' && contrasena === 'admin') {
            navigate('/dashboard');
        } else {
            alert('Credenciales incorrectas');
        }
    };

    return (
        <div className="data-container">
            <span className="btn" onClick={handleStartClick}>Start</span>
            {showModal && (
                <Modal onClose={handleCloseModal}>
                    <h2>Iniciar sesión</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="usuario">Usuario:</label>
                            <input
                                type="text"
                                id="usuario"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                />
                        </div>
                        <div className="form-group">
                            <label htmlFor="contrasena">Contraseña:</label>
                            <input
                                type="password"
                                id="contrasena"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                            />
                            </div>
                            <div className="form-actions">
                                <button type="submit">Aceptar</button>
                                <button type="button" onClick={handleCloseModal}>Cerrar</button>
                            </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default LoginPage;
