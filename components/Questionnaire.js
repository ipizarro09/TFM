import React from 'react';
import './Questionnaire.css';

const Questionnaire = ({
  tipoDatos,
  selectedVars,
  proposito,
  contexto,
  datasetSize,
  nDimensiones,
  ordenadas,
  setOrdenadas,
  relacion,
  setRelacion,
  obsGrupo,
  setObsGrupo,
  setNGruposAlto,
}) => {
  const renderQuestions = () => {
    console.log("nDimensiones:", nDimensiones);
    switch (tipoDatos) {
      case 'Numeric':
        const questions = [];

        // Pregunta de si las variables están ordenadas
        questions.push(
          <div key="ordered">
            <h4>Are variables ordered?</h4>
            <select value={ordenadas} onChange={(e) => setOrdenadas(e.target.value)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        );

        // Condición adicional para mostrar la segunda pregunta
        if (nDimensiones === '3D+' && ordenadas === 'No') {
          questions.push(
            <div key="relation">
              <h4>Relation between variables?</h4>
              <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                <option value="Anidadas">Anidadas</option>
                <option value="Ninguna">Ninguna</option>
              </select>
            </div>
          );
        }

        return questions;

        case 'Categorical':
          // Aquí usaremos if en vez de includes
          if (nDimensiones === '2D' || nDimensiones === '3D' || nDimensiones === '3D+') {
            return (
              <div>
                <div>
                  <h4>Relation between variables?</h4>
                  <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                    <option value="Independent">Independent</option>
                    <option value="Nested">Nested</option>
                    <option value="Subgroup">Subgroup</option>
                    <option value="Adjacency">Adjacency</option>
                  </select>
                </div>
                <div>
                  <h4>Do you forsee a high number of groups?</h4>
                  <select onChange={(e) => setNGruposAlto(e.target.value)}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            );
          }
          return null;

      // Modificación para los tres casos ('1NUM1CAT', '1CAT+2+NUM', '1NUM+2+CAT')
      case '1NUM1CAT':
      case '1CAT+2+NUM':
      case '1NUM+2+CAT':
        if (['2D', '3D', '3D+'].includes(nDimensiones)) {
          const questions = [];
          
          // Pregunta sobre la previsión de un alto número de grupos
          questions.push(
            <div key="n_grupos_alto">
              <h4>Do you foresee high number of groups?</h4>
              <select onChange={(e) => setNGruposAlto(e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          );
          
          // Pregunta sobre las observaciones por grupo
          questions.push(
            <div key="obs_grupo">
              <h4>One or more observations by group?</h4>
              <select value={obsGrupo} onChange={(e) => setObsGrupo(e.target.value)}>
                <option value="One">One</option>
                <option value="Several">Several</option>
              </select>
            </div>
          );

          // Retornamos las preguntas generadas
          return questions;
        }
        return null;

      default:
        return null;
    }
  };

  return <div>{renderQuestions()}</div>;
};

export default Questionnaire;
