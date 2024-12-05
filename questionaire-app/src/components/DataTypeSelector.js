import React, { useState } from 'react';

function DataTypeSelector({ tipoDatos, nDimensiones }) {
    return (
      <div>
        <h4>Tipo de Datos: {tipoDatos || "Not found"}</h4>
        <h4>Número de Dimensiones: {nDimensiones || "Not found"}</h4>
      </div>
    );
  }
  
export default DataTypeSelector;