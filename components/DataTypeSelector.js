import React, { useState } from 'react';

/*
const DataTypeSelector = ({ data, setTipoDatos }) => {
  const handleDataTypeSelection = (selectedType) => {
    setTipoDatos(selectedType);
  };
*/
function DataTypeSelector({ tipoDatos, nDimensiones }) {
    return (
      <div>
        <h4>Tipo de Datos: {tipoDatos || "Not found"}</h4>
        <h4>Número de Dimensiones: {nDimensiones || "Not found"}</h4>
      </div>
    );
  }
  
export default DataTypeSelector;