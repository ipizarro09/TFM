import React from 'react';

const VisualizationContextSelector = ({ onSelectContext }) => {
  return (
    <div>
      <h3>Select Visualization Context</h3>
      {['Technical presentation', 'Non technical presentation', 'Technical report','Non technical report', 'Exploration'].map((context) => (
        <label key={context}>
          <input
            type="radio"
            name="context"
            onChange={() => onSelectContext(context)}
          />
          {context}
        </label>
      ))}
    </div>
  );
};

export default VisualizationContextSelector;