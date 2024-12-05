import React, { useState } from 'react';

const RecommendationComponent = () => {
  const [recommendation, setRecommendation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendation = async (formData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/ruta-a-tu-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendation(data.recommendation);
      } else {
        console.error('Error al obtener la recomendación');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Recomendación</h1>
      <button onClick={() => fetchRecommendation({ id: '1234' })}>
        Obtener recomendación
      </button>
      {isLoading && <p>Cargando...</p>}
      {recommendation && <p>Recomendación: {recommendation}</p>}
    </div>
  );
};

export default RecommendationComponent;
