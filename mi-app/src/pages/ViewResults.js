import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import Header from '../components/Header';
import './ViewResults.css';

const ViewResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({
    id: '',
    test: '',
    email: '',
    status: '',
    date: ''
  });
  const [loading, setLoading] = useState(true);

  // Para el modal de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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
          test_results ( duration, correct_count, error_count ),
          trail_comments ( comment )
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

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  // Opciones para desplegables
  const idOptions     = [...new Set(results.map(r => r.id.toString()))];
  const testOptions   = [...new Set(results.map(r => r.nombre))];
  const emailOptions  = [...new Set(results.map(r => r.users?.email).filter(Boolean))];
  const statusOptions = [...new Set(results.map(r => r.status))];
  const dateOptions   = [...new Set(results.map(r => new Date(r.created_at).toISOString().slice(0,10)))]

  const filteredResults = results.filter(row => {
    const rowDate = new Date(row.created_at).toISOString().slice(0,10);
    return (
      (!filters.id     || row.id.toString() === filters.id) &&
      (!filters.test   || row.nombre === filters.test) &&
      (!filters.email  || row.users?.email === filters.email) &&
      (!filters.status || row.status === filters.status) &&
      (!filters.date   || rowDate === filters.date)
    );
  });

  const handleExport = row => {
    const result = Array.isArray(row.test_results) ? row.test_results[0] : null;
    const comment = Array.isArray(row.trail_comments) && row.trail_comments.length > 0
      ? row.trail_comments[0].comment
      : '';
    if (!result) {
      alert('No hay datos para exportar CSV.');
      return;
    }

    // Construir partes seguras del nombre de archivo, eliminando espacios extra
    const safeTest  = row.nombre.trim().split(/\s+/).join('_');
    const safeFirst = row.users?.first_name?.trim().split(/\s+/).join('_') || '';
    const safeLast  = row.users?.last_name?.trim().split(/\s+/).join('_') || '';

    // Solo incluir las partes no vacías
    const parts = [row.id, safeTest, safeFirst, safeLast].filter(p => p);
    const filename = parts.join('_') + '.csv';

    const headers = ['duration','correct_count','error_count','comment'];
    const rows = [[
      result.duration,
      result.correct_count,
      result.error_count,
      comment.replace(/\r?\n/g, ' ')
    ]];
    const csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const openDeleteModal = id => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteTest = async () => {
    const { error } = await supabase.from('test').delete().eq('id', deleteId);
    if (error) {
      alert('Error al eliminar el test.');
      console.error(error);
    } else {
      setResults(rs => rs.filter(r => r.id !== deleteId));
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  if (loading) return <p className="loading">Cargando resultados…</p>;

  return (
    <div className="results-container">
      <Header />
      <h2>Resultados de Test</h2>

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
            <th>Comentario</th>
            <th>Acciones</th>
          </tr>
          <tr className="filter-row">
            <th>
              <select name="id" value={filters.id} onChange={handleFilterChange}>
                <option value="">Todos</option>
                {idOptions.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </th>
            <th>
              <select name="test" value={filters.test} onChange={handleFilterChange}>
                <option value="">Todos</option>
                {testOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </th>
            <th>
              <select name="email" value={filters.email} onChange={handleFilterChange}>
                <option value="">Todos</option>
                {emailOptions.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </th>
            <th>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Todos</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </th>
            <th>
              <select name="date" value={filters.date} onChange={handleFilterChange}>
                <option value="">Todas</option>
                {dateOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </th>
            <th></th><th></th><th></th><th></th>
          </tr>
        </thead>
        <tbody>
          {filteredResults.length > 0 ? filteredResults.map(row => {
            const result = Array.isArray(row.test_results) ? row.test_results[0] : null;
            const hasComment = Array.isArray(row.trail_comments) && row.trail_comments.length > 0;
            const userLabel = row.users
              ? `${row.users.first_name} ${row.users.last_name} (${row.users.email})`
              : '—';
            return (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.nombre}</td>
                <td>{userLabel}</td>
                <td>{row.status}</td>
                <td>{new Date(row.created_at).toLocaleString('es-ES')}</td>
                <td>{result?.duration  ?? '—'}</td>
                <td>{result?.correct_count ?? '—'}</td>
                <td>{result?.error_count   ?? '—'}</td>
                <td>{hasComment ? 'Sí' : 'No'}</td>
                <td className="actions-cell">
                  <button
                    className="export-btn"
                    onClick={() => handleExport(row)}
                  >
                    CSV
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => openDeleteModal(row.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="10">No hay tests que coincidan con los filtros。</td>
            </tr>
          )}
        </tbody>
      </table>

      <button onClick={() => navigate(-1)} className="back-btn">
        Atrás
      </button>

      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={cancelDelete}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <p>¿Estás seguro que quieres eliminar el test？</p>
            <div className="modal-buttons">
              <button onClick={cancelDelete}>Cancelar</button>
              <button className="delete-btn" onClick={confirmDeleteTest}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewResults;
