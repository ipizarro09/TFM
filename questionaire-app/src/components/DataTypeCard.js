import React from 'react';

const DataTypeCard = ({ column, type, isSelected, onToggle }) => {
  // Determinar el color según el tipo de dato
  const cardColor = type === 'Numeric' ? '#d6d6c2' : '#e0ebeb'; // Amarillo para Numeric, azul para otros

  return (
    <div
      className={`data-card ${isSelected ? 'selected' : ''}`}
      style={{
        backgroundColor: cardColor,
        border: isSelected ? '2px solid #527a7a' : '1px solid #ccc',
        cursor: 'pointer',
      }}
      onClick={onToggle} // Lógica para alternar selección
    >
      <h5>{column}</h5>
      <p>{type}</p>
    </div>
  );
};

export default DataTypeCard;