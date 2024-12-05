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
  
          columnTypes[column] = isNumeric ? 'Numeric' : 'Categorical';
        });

        // Llamar a la función `onUpload` con el dataset, tipos de columna y número de registros
        onUpload({ data, columnTypes, numRecords });
      },
      error: (error) => console.error("Error parsing file:", error),
    });
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </div>
  );
};



export default FileUploader;
