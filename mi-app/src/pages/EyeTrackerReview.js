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

  useEffect(() => {
    async function loadAll() {
      const { data: testRec } = await supabase
        .from('test')
        .select('configuration')
        .eq('id', testId)
        .single();
      setConfigRounds(testRec.configuration?.rounds || []);

      const { data: rd } = await supabase
        .from('round_data')
        .select('round_number, positions, eye_csv_path')
        .eq('test_id', testId)
        .order('round_number', { ascending: true });
      setRoundsData(rd);
    }
    loadAll();
  }, [testId]);

  useEffect(() => {
    roundsData.forEach(round => {
      const key = `r${round.round_number}`;
      const container = heatmapRefs.current[key];
      if (!container) return;

      (async () => {
        const { data: urlData } = await supabase
          .storage
          .from('eye-tracking-csvs')
          .createSignedUrl(round.eye_csv_path, 3600);
        const raw = await fetch(urlData.signedUrl).then(r => r.text());
        const lines = raw.trim().split('\n').slice(1);
        if (!lines.length) return;

        // Aplicamos la escala de nuevo: relX * ancho, relY * alto
        const rect = container.getBoundingClientRect();
        const points = lines.map(line => {
          const [relX, relY] = line.split(',').map(Number);
          return {
            x: Math.round(relX * rect.width),
            y: Math.round(relY * rect.height),
            value: 1
          };
        });

        let hm = heatmapInstances.current[key];
        if (!hm) {
          hm = heatmap.create({
            container,
            radius: 30,
            maxOpacity: 0.6,
            minOpacity: 0.1,
            blur: 0.9
          });
          heatmapInstances.current[key] = hm;
        }

        hm.setData({ max: 1, data: points });
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

      {roundsData.map(round => {
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
              <div
                className="heatmap-canvas"
                ref={el => {
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
