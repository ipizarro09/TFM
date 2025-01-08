import React from 'react';

const VisualizationPurposeSelector = ({ onSelectPurpose,enabledPurposes }) => {
  const purposes = ['Distribution', 'Correlation', 'Ranking', 'Part-to-whole', 'Evolution', 'Flow'];
  return (
    <div className="purpose-selector">
  <h4>Select Visualization Purpose</h4>
  <div className="purpose-selector-radio">
    {purposes.map((purpose) => (
      <div key={purpose}>
        <input
          type="radio"
          id={purpose}
          name="purpose"
          onChange={() => onSelectPurpose(purpose)}
          disabled={!enabledPurposes.includes(purpose)} // Deshabilita si no está habilitado cambios del 05/01
        />
        <label htmlFor={purpose} style={{ color: !enabledPurposes.includes(purpose) ? '#aaa' : '#000' }}>
          {purpose}
        </label>
      </div>
    ))}
  </div>
</div>
  );
  
};


export default VisualizationPurposeSelector;
