import React from 'react';

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

        // Pregunta de si las variables están ordenadas si hay más de 1D
        if (nDimensiones !== '1D') {
        questions.push(
          <div key="ordered" className="question-section">
            <h4>Is any variable ordered?</h4>
            <select value={ordenadas} onChange={(e) => setOrdenadas(e.target.value)}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        );
      }
        // Condición adicional para mostrar la segunda pregunta sobre su relacion
        if (nDimensiones === '3D+' && ordenadas === 'No' && proposito === 'Part-to-whole') {
          questions.push(
            <div key="relation"  className="question-section">
              <h4>Relation between variables?</h4>
              <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                <option value="Subgroup">Subgroup</option>
                <option value="Not applicable">None</option>
              </select>
            </div>
          );
        }

        return questions;

        case 'Categorical':

        if (nDimensiones === '1D'  && proposito === 'Part-to-whole') {
          return (
            <div key="relation" className="question-section">
              <h4>Relation between variables?</h4>
              <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                <option value="Subgroup">Subgroup</option>
                <option value="Not applicable">None</option>
              </select>
            </div>
          );
        }
          
          if (nDimensiones === '2D' || nDimensiones === '3D' || nDimensiones === '3D+') {
            return (
              <div>
                <div className="question-section">
                  <h4>Relation between variables?</h4>
                  <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                    <option value="Independent">Independent</option>
                    <option value="Nested">Nested</option>
                    <option value="Subgroup">Subgroup</option>
                    <option value="Adjacency">Adjacency</option>
                  </select>
                </div>
                {relacion === 'Subgroup' && (
                <div  className="question-section">
                  <h4>Do you forsee a high number of groups?</h4>
                  <select onChange={(e) => setNGruposAlto(e.target.value)}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                 )}
              </div>
            );
          }
          
          return null;

      // Siempre que haya categóricas en los tres casos ('1NUM1CAT', '1CAT+2+NUM', '1NUM+2+CAT')
      case '1NUM1CAT':
        return (
          <div>
            {/* Pregunta sobre observaciones por grupo */}
            <div key="obs_grupo" className="question-section">
              <h4>One or more observations by group?</h4>
              <select value={obsGrupo} onChange={(e) => setObsGrupo(e.target.value)}>
                <option value="One">One</option>
                <option value="Several">Several</option>
              </select>
            </div>

            {/* Condicional: Si es 'One' y el propósito es 'Part-to-whole', pregunta sobre relación */}
            {obsGrupo === 'One' && proposito === 'Part-to-whole' && (
              <div key="relation"  className="question-section">
                <h4>Relation between variables?</h4>
                <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                  <option value="Subgroup">Subgroup</option>
                  <option value="Not applicable">None</option>
                </select>
              </div>
            )}
          </div>
        );

      case '1CAT+2+NUM':
        return (
          <div>
            {/* Pregunta sobre observaciones por grupo */}
            <div key="obs_grupo"  className="question-section">
              <h4>One or more observations by group?</h4>
              <select value={obsGrupo} onChange={(e) => setObsGrupo(e.target.value)}>
                <option value="One">One</option>
                <option value="Several">Several</option>
              </select>
            </div>

            {/* Condicional: Si es 'Several' pregunta sobre si están ordenadas */}
            {obsGrupo === 'Several' && (
              <div key="ordered"  className="question-section">
              <h4>Are variables ordered?</h4>
              <select value={ordenadas} onChange={(e) => setOrdenadas(e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            )}
            {obsGrupo === 'One' && (proposito === 'Part-to-whole' || proposito === 'Correlation') && (
            <div key="n_grupos_alto"  className="question-section">
              <h4>Do you foresee high number of groups?</h4>
              <select onChange={(e) => setNGruposAlto(e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            )}

          </div>
        );

      case '1NUM2+CAT':
          return (
            <div>
              {/* Pregunta sobre relación entre variables */}
              <div className="question-section">
                <h4>Relation between variables?</h4>
                <select value={relacion} onChange={(e) => setRelacion(e.target.value)}>
                  <option value="Nested">Nested</option>
                  <option value="Subgroup">Subgroup</option>
                  <option value="Adjacency">Adjacency</option>
                </select>
              </div>
        
              {/* Pregunta sobre observaciones por grupo si la relación no es "Adjacency" */}
              {relacion !== 'Adjacency' && (
                <div key="obs_grupo" className="question-section">
                  <h4>One or more observations by group?</h4>
                  <select value={obsGrupo} onChange={(e) => setObsGrupo(e.target.value)}>
                    <option value="One">One</option>
                    <option value="Several">Several</option>
                  </select>
                </div>
              )}
        
              {/* Pregunta sobre número de grupos si se cumplen las condiciones */}
              {relacion === 'Subgroup' && obsGrupo === 'One' && 
               (proposito === 'Part-to-whole' || proposito === 'Correlation') && (
                <div key="n_grupos_alto" className="question-section">
                  <h4>Do you foresee a high number of groups?</h4>
                  <select onChange={(e) => setNGruposAlto(e.target.value)}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              )}
            </div>
          );


      default:
        return null;
    }
  };

  return <div className="questionnaire-container">{renderQuestions()}</div>;
};

export default Questionnaire;
