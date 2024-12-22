import React, { useState } from 'react';

const VariableSelector = ({ dataset, selectedVars, setSelectedVars }) => {

  const handleSelection = (varName) => {
    const newSelection = selectedVars.includes(varName)
      ? selectedVars.filter((v) => v !== varName)
      : [...selectedVars, varName];
    setSelectedVars(newSelection);
    console.log("New selection", newSelection)
    // Mostrar las variables seleccionadas en la consola
  };

  return (
    <div>
      <h4>Select Variables</h4>
      {Object.keys(dataset[0] || {}).map((varName) => (
        <label key={varName}>
          <input
            type="checkbox"
            checked={selectedVars.includes(varName)}
            onChange={() => handleSelection(varName)}
          />
          {varName}
        </label>
      ))}
    </div>
  );
};

export default VariableSelector;
