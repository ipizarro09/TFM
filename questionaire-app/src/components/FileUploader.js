import React from 'react';
import Papa from 'papaparse';

const FileUploader = ({ onUpload }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        const data = result.data;
        const numRecords = data.length;

        // Detectar tipo de datos en cada columna
        const columnTypes = {};
        const columns = Object.keys(data[0] || {});

        columns.forEach((column) => {
          const values = data.map(row => row[column]).filter(Boolean);
          const isNumeric = values.every(value => {
              // Normalizar el valor eliminando espacios y cambiando comas por puntos
              const normalizedValue = value.replace(/\s/g, '').replace(/,/g, '.');
            
              // Expresión regular para detectar números en notación científica o decimal
              return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(normalizedValue);
          });
          // Asignamos el tipo de columna si cumple isNumeric será Numeric sino Categorical
          columnTypes[column] = isNumeric ? 'Numeric' : 'Categorical';
        });

        // Llamar a la función `onUpload` con el dataset, tipos de columna y número de registros
        onUpload({ data, columnTypes, numRecords });
      },
      error: (error) => console.error("Error parsing file:", error),
    });
  };

  return (
    <div className="file-uploader-container">
      <input 
        type="file" 
        id="file-upload" 
        accept=".csv" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} // Ocultamos el input original
      />
      <button 
        className="file-upload-btn" 
        onClick={() => document.getElementById('file-upload').click()}
      >
        Cargar dataset para visualizar
      </button>
    </div>
  );
};



export default FileUploader;
