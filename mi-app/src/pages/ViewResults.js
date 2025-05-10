// src/pages/ViewResults.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import Header from '../components/Header';  // Asegúrate de que el Header está en esta ruta
import './ViewResults.css';

const ViewResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const { data, error } = await supabase
        .from('test')
        .select(`
          id,
          nombre,
          status,
          created_at,
          users ( first_name, last_name, email ),
          test_results ( duration, correct_count, error_count )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando resultados:', error);
      } else {
        setResults(data);
      }
      setLoading(false);
    };
    fetchResults();
  }, []);

  if (loading) return <p className="loading">Cargando resultados…</p>;

  return (
    <div className="results-container">
      <Header />  {/* Header incluido aquí */}
      <h2>Resultados de Test</h2>
      {results.length === 0 ? (
        <p>No hay tests registrados.</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Test</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Duración</th>
              <th>Aciertos</th>
              <th>Errores</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {results.map(row => {
              const {
                id,
                nombre,
                status,
                created_at,
                users,
                test_results
              } = row;
              const result = Array.isArray(test_results) ? test_results[0] : null;
              const userLabel = users
                ? `${users.first_name} ${users.last_name} (${users.email})`
                : '—';

              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{nombre}</td>
                  <td>{userLabel}</td>
                  <td>{status}</td>
                  <td>{new Date(created_at).toLocaleString('es-ES')}</td>
                  <td>{result?.duration ?? '—'}</td>
                  <td>{result?.correct_count ?? '—'}</td>
                  <td>{result?.error_count ?? '—'}</td>
                  <td>
                    <button
                      className="export-btn"
                      onClick={() => {
                        const headers = ['duration', 'correct_count', 'error_count'];
                        const rows = [[result.duration, result.correct_count, result.error_count]];
                        const csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `test_${id}_results.csv`;
                        a.click();
                      }}
                      disabled={!result}
                    >
                      Exportar CSV
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <button onClick={() => navigate(-1)} className="back-btn">
        Atrás
      </button>
    </div>
  );
};

export default ViewResults;
