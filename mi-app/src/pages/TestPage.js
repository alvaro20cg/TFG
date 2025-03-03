import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import './TestPage.css';
import imagenesData from '../json/imagenes.json';

// Definición de emotionMapping
const emotionMapping = {
  "Alegría": "h",
  "Tristeza": "s",
  "Enfado": "f",
  "Asco": "d",
  "Sorpresa": "a",
  "Neutral": "n"
};

const TestPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Recuperar testId desde state
  const testId = state?.testId;

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState([]);
  const [showPreview, setShowPreview] = useState(true);

  // Redirige si no hay state
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  // Se espera que state tenga esta estructura:
  // {
  //   testId: <number>,
  //   rounds: [
  //     { images: [ { id, url, folder }, ... ], targetFolder: "079" },
  //     ...
  //   ],
  //   startTime: ...,
  //   selectedEmotion: "Enfado",
  //   selectedDifficulty: "facil" // o "dificil",
  //   selectedVersion: "a" (o "b")
  // }
  const rounds = state?.rounds || [];
  const totalRounds = rounds.length;
  const currentRoundData = rounds[currentRoundIndex] || { images: [], targetFolder: '' };
  const originalImages = currentRoundData.images;
  const targetFolder = currentRoundData.targetFolder;

  // Pre-cargar imágenes de la ronda actual
  useEffect(() => {
    originalImages.forEach(imgData => {
      const img = new Image();
      img.src = imgData.url;
    });
  }, [originalImages]);

  // Calculamos la imagen target para el preview
  const targetImage = useMemo(() => {
    return (
      originalImages.find(img =>
        img.folder === targetFolder &&
        img.url.endsWith(`_${state.selectedVersion}.jpg`)
      ) || originalImages.find(img => img.folder === targetFolder)
    );
  }, [originalImages, targetFolder, state.selectedVersion]);

  // Mostrar preview: la imagen target se muestra durante 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreview(false);
      setRoundStartTime(Date.now());
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentRoundIndex]);

  // Función para generar posiciones sin solapamiento
  const generateNonOverlappingPositions = (numImages) => {
    const pos = [];
    const maxAttempts = 1000;
    const imageWidthPercent = 10;
    const imageHeightPercent = 25;
    const containerWidth = 100;
    const containerHeight = 80;

    for (let i = 0; i < numImages; i++) {
      let attempt = 0;
      let position;
      let overlapping = true;
      while (overlapping && attempt < maxAttempts) {
        const top = Math.random() * (containerHeight - imageHeightPercent);
        const left = Math.random() * (containerWidth - imageWidthPercent);
        position = { top, left, width: imageWidthPercent, height: imageHeightPercent };

        overlapping = pos.some(p => {
          return !(
            (left + imageWidthPercent <= parseFloat(p.left)) ||
            (left >= parseFloat(p.left) + parseFloat(p.width)) ||
            (top + imageHeightPercent <= parseFloat(p.top)) ||
            (top >= parseFloat(p.top) + parseFloat(p.height))
          );
        });
        attempt++;
      }
      pos.push({
        top: `${position.top}%`,
        left: `${position.left}%`,
        width: `${imageWidthPercent}%`,
        height: `${imageHeightPercent}%`
      });
    }
    return pos;
  };

  // Función para obtener imágenes distractoras (modo fácil)
  const getDistractorImages = (folder) => {
    const targetLetter = emotionMapping[state.selectedEmotion];
    const distractors = imagenesData.filter(img => {
      return img.folder === folder && !img.file.includes(`_${targetLetter}_`);
    });
    const shuffled = distractors.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10).map(img => ({
      id: img.id,
      url: `/images/${img.folder}/${img.file}`,
      folder: img.folder
    }));
  };

  // Prepara las imágenes a mostrar según la dificultad.
  // En "facil": 10 distractores + la imagen target.
  // En "dificil": se usa la configuración original (target + alternativa ya generada).
  const prepareDisplayImages = () => {
    let displayImages = [];
    if (state.selectedDifficulty === "facil") {
      const distractors = getDistractorImages(targetFolder);
      if (targetImage) {
        displayImages = distractors.concat([{ ...targetImage, isCorrect: true }]);
      } else {
        displayImages = distractors;
      }
    } else {
      displayImages = originalImages.map(img => ({ ...img, isCorrect: false }));
      const targetImgIndex = displayImages.findIndex(img =>
        img.folder === targetFolder &&
        img.url.includes(`_${emotionMapping[state.selectedEmotion]}_`) &&
        img.url.endsWith(`_${state.selectedVersion}.jpg`)
      );
      if (targetImgIndex !== -1) {
        displayImages[targetImgIndex].isCorrect = true;
      }
      const alreadyHasAlternative = displayImages.some(img => img.id.endsWith("_alt"));
      if (!alreadyHasAlternative && targetImgIndex !== -1) {
        const targetImg = displayImages[targetImgIndex];
        let altUrl;
        if (targetImg.url.includes('_a.jpg')) {
          altUrl = targetImg.url.replace('_a.jpg', '_b.jpg');
        } else if (targetImg.url.includes('_b.jpg')) {
          altUrl = targetImg.url.replace('_b.jpg', '_a.jpg');
        } else {
          altUrl = targetImg.url;
        }
        const altImg = {
          id: targetImg.id + "_alt",
          url: altUrl,
          folder: targetImg.folder,
          isCorrect: false
        };
        displayImages.push(altImg);
      }
    }
    displayImages.sort(() => Math.random() - 0.5);
    return displayImages;
  };

  // Memoriza las imágenes a mostrar
  const displayImages = useMemo(
    () => prepareDisplayImages(),
    [originalImages, state.selectedDifficulty, targetFolder, state.selectedEmotion, state.selectedVersion]
  );

  // Actualiza posiciones cuando cambia la ronda (y ya no se muestra el preview)
  useEffect(() => {
    if (!showPreview) {
      setPositions(generateNonOverlappingPositions(displayImages.length));
      setRoundStartTime(Date.now());
    }
  }, [currentRoundIndex, displayImages.length, showPreview]);

  // Generar contenido CSV en texto
  const generateCSVContent = () => {
    const header = "round,reactionTime,result\n";
    return results.reduce((acc, curr) => {
      return acc + `${curr.round},${curr.reactionTime},${curr.result}\n`;
    }, header);
  };

  // Guardar CSV en Supabase en la tabla 'csv_logs'
  const saveCSVToSupabase = async (csvContent) => {
    if (!testId) {
      console.error("No se recibió testId para guardar el CSV");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('csv_logs')
        .insert([
          {
            test_id: testId,
            csv_content: csvContent
          }
        ]);
      if (error) {
        console.error("Error al guardar CSV en Supabase:", error);
        return;
      }
      console.log("CSV guardado en Supabase:", data);
    } catch (err) {
      console.error("Error en saveCSVToSupabase:", err);
    }
  };

  // Manejo de clic en la imagen
  const handleImageClick = (img) => {
    if (showPreview) return; // Evitar clicks durante el preview

    const clickTime = Date.now();
    const reactionTime = clickTime - roundStartTime;
    const resultStr = img.isCorrect ? "acertado" : "fallado";
    console.log(
      `Imagen ${img.id} clickeada en la ronda ${currentRoundIndex + 1}. Tiempo de reacción: ${reactionTime} ms. Resultado: ${resultStr}`
    );

    try {
      setResults(prev => [...prev, { round: currentRoundIndex + 1, reactionTime, result: resultStr }]);
    } catch (error) {
      console.error("Error al guardar el resultado de la ronda", error);
    }

    if (currentRoundIndex < totalRounds - 1) {
      setCurrentRoundIndex(currentRoundIndex + 1);
      setShowPreview(true);
    } else {
      alert("Test finalizado");
      const csvContent = generateCSVContent();
      saveCSVToSupabase(csvContent);
      navigate('/');
    }
  };

  return (
    <div className="testpage-container">
      <div className="testpage-header">
        <h2>Ronda {currentRoundIndex + 1} / {totalRounds}</h2>
        <div className="target-info">Busca: {targetFolder}</div>
        <button className="cancel-btn" onClick={() => navigate('/')}>Cancelar Test</button>
      </div>
      {showPreview && targetImage ? (
        <div className="preview-container">
          <img
            className="preview-image"
            src={targetImage.url}
            alt={`Target ${targetImage.id}`}
          />
          <p className="preview-text">Observa la imagen target</p>
        </div>
      ) : (
        <div className="images-container">
          {displayImages.map((img, index) => (
            <img
              key={img.id}
              src={img.url}
              alt={`Imagen ${img.id}`}
              onClick={() => handleImageClick(img)}
              style={{
                position: 'absolute',
                cursor: 'pointer',
                objectFit: 'cover',
                ...positions[index]
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestPage;
