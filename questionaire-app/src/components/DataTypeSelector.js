import React, { useState } from 'react';

function DataTypeSelector({ tipoDatos, nDimensiones }) {
    return (
      <div className='message-container-group'>
        <p className='message-container'><strong>Tipo de Datos:</strong>  <br />{tipoDatos || "Not found"} </p>
        <p className='message-container'><strong>Número de Dimensiones:</strong>  <br />{nDimensiones || "Not found"}</p>
      </div>
    );
  }
  
export default DataTypeSelector;