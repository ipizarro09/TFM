import React from 'react';

const VisualizationPurposeSelector = ({ onSelectPurpose }) => {
  return (
    <div>
      <h4>Select Visualization Purpose</h4>
      {['Distribution', 'Correlation', 'Ranking', 'Part-to-whole', 'Evolution', 'Flow'].map((purpose) => (
        <label key={purpose}>
          <input
            type="radio"
            name="purpose"
            onChange={() => onSelectPurpose(purpose)}
          />
          {purpose}
        </label>
      ))}
    </div>
  );
};

export default VisualizationPurposeSelector;
