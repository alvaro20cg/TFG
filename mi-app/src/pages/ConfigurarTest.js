import React, { useState } from 'react';
import supabase from '../supabaseClient'; // Asegúrate de tener configurado supabaseClient.js en tu proyecto
import './ConfigurarTest.css';

const TestPhotoLoader = () => {
  // Por defecto, usamos el bucket "004" para probar.
  const [selectedBucket, setSelectedBucket] = useState('004');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [images, setImages] = useState([]);

  // Maneja el cambio del checkbox
  const handleCheckboxChange = (e) => {
    setCheckboxChecked(e.target.checked);
    console.log(`Checkbox ${e.target.checked ? 'seleccionado' : 'deseleccionado'}`);
  };

  // Función para obtener imágenes del bucket seleccionado
  const fetchImages = async () => {
    if (!checkboxChecked) {
      console.log("El checkbox no está seleccionado. Abortando carga de imágenes.");
      return;
    }
    console.log(`Intentando obtener imágenes del bucket: ${selectedBucket}`);

    const { data, error } = await supabase
      .storage
      .from(selectedBucket)  // Usamos el bucket cuyo nombre es el de la persona (por ejemplo, "004")
      .list('', { limit: 12 });  // Listamos archivos en la raíz del bucket

    if (error) {
      console.error("Error al obtener imágenes:", error);
      return;
    }

    console.log("Datos obtenidos:", data);

    // Generar la URL pública para cada imagen
    const imageUrls = data.map(item => {
      const url = supabase
        .storage
        .from(selectedBucket)
        .getPublicUrl(item.name).publicURL;
      console.log(`URL creada para ${item.name}: ${url}`);
      return { id: item.name, url };
    });

    setImages(imageUrls);
  };

  return (
    <div className="test-container" style={{ padding: '20px' }}>
      <h2>Prueba de carga de fotografías</h2>
      <div>
        <input 
          type="checkbox" 
          id="testCheckbox" 
          checked={checkboxChecked} 
          onChange={handleCheckboxChange} 
        />
        <label htmlFor="testCheckbox">Selecciona para cargar fotografías</label>
      </div>
      <br />
      <button onClick={fetchImages}>Obtener Fotografías</button>
      <div className="images-container" style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {images.length > 0 ? (
          images.map(img => (
            <div key={img.id} className="image-item">
              <img src={img.url} alt={img.id} style={{ width: '200px' }} />
            </div>
          ))
        ) : (
          <p>No hay imágenes cargadas</p>
        )}
      </div>
    </div>
  );
};

export default TestPhotoLoader;
