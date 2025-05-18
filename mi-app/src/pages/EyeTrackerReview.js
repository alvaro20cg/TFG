// src/pages/EyeTrackerReview.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import heatmap from 'heatmap.js';
import './EyeTrackerReview.css';

export default function EyeTrackerReview() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [configRounds, setConfigRounds] = useState([]);
  const [roundsData, setRoundsData] = useState([]);
  const heatmapRefs = useRef({});
  const heatmapInstances = useRef({});

  // 1) Cargo configuración y metadatos
  useEffect(() => {
    async function loadAll() {
      const { data: testRec, error: cfgErr } = await supabase
        .from('test')
        .select('configuration')
        .eq('id', testId)
        .single();
      if (!cfgErr) setConfigRounds(testRec.configuration?.rounds || []);

      const { data: rd, error: rdErr } = await supabase
        .from('round_data')
        .select('round_number, positions, eye_csv_path')
        .eq('test_id', testId)
        .order('round_number', { ascending: true });
      if (!rdErr) setRoundsData(rd);
    }
    loadAll();
  }, [testId]);

  // 2) Dibujo cada heatmap, ajustando coordenadas
  useEffect(() => {
    roundsData.forEach((round) => {
      const key = `r${round.round_number}`;
      const container = heatmapRefs.current[key];
      if (!container) return;

      (async () => {
        // firma URL del CSV
        const { data: urlData, error: urlErr } = await supabase
          .storage
          .from('eye-tracking-csvs')
          .createSignedUrl(round.eye_csv_path, 3600);
        if (urlErr) {
          console.error('Error al generar URL firmada:', urlErr);
          return;
        }
        const signedUrl = urlData.signedUrl;

        // descargo CSV
        const raw = await fetch(signedUrl).then((r) => r.text());
        const lines = raw.trim().split('\n').slice(1);
        if (!lines.length) return;

        // obtengo bbox del contenedor (sin scroll)
        const rect = container.getBoundingClientRect();
        const offsetX = rect.left;
        const offsetY = rect.top;
        const width = rect.width;
        const height = rect.height;

        // parseo, corrijo y filtro coordenadas
        const points = lines
          .map((line) => {
            const [absX, absY] = line.split(',').map(Number);
            const x = Math.round(absX - offsetX);
            const y = Math.round(absY - offsetY);
            return { x, y, value: 1 };
          })
          .filter((p) => p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height);

        if (points.length === 0) {
          console.warn(`Ronda ${round.round_number}: no hay puntos dentro del contenedor`, {
            total: lines.length,
            filtered: points.length,
          });
        }

        // creo o reutilizo instancia de heatmap
        let hm = heatmapInstances.current[key];
        if (!hm) {
          hm = heatmap.create({
            container,
            radius: 30,
            maxOpacity: 0.6,
            minOpacity: 0.1,
            blur: 0.9,
          });
          heatmapInstances.current[key] = hm;
        }

        // asigno datos al heatmap
        hm.setData({
          max: Math.max(...points.map((p) => p.value), 1),
          data: points,
        });
      })();
    });
  }, [roundsData]);

  if (!configRounds.length || !roundsData.length) {
    return <p className="loading">Cargando datos de Eye-Tracker…</p>;
  }

  return (
    <div className="eyetracker-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Volver
      </button>
      <h2>Revisión Eye-Tracker: Test {testId}</h2>

      {roundsData.map((round) => {
        const cfg = configRounds[round.round_number - 1] || { images: [] };
        return (
          <div key={round.round_number} className="round-block">
            <h3>Ronda {round.round_number}</h3>
            <div className="heatmap-over-container">
              {cfg.images.map((img, idx) => (
                <div
                  key={idx}
                  className="image-wrapper review"
                  style={round.positions[idx]}
                >
                  <img src={img.url} alt={img.file || `Imagen ${idx + 1}`} />
                </div>
              ))}

              {/* este es el div donde se pintará el canvas del heatmap */}
              <div
                className="heatmap-canvas"
                ref={(el) => {
                  heatmapRefs.current[`r${round.round_number}`] = el;
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}