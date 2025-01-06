import React, { useState, useEffect } from 'react'; // useEffect para refrescar
import FileUploader from './components/FileUploader';
import VariableSelector from './components/VariableSelector';
import DataTypeSelector from './components/DataTypeSelector';
import VisualizationPurposeSelector from './components/VisualizationPurposeSelector';
import VisualizationContextSelector from './components/VisualizationContextSelector';
import Questionnaire from './components/Questionnaire';
import DataTypeCard from './components/DataTypeCard';
import * as d3 from 'd3';
import './App.css';

function App() {
  const [dataset, setDataset] = useState(null);
  const [columnTypes, setColumnTypes] = useState({});
  const [numRecords, setNumRecords] = useState(0);
  const [selectedVars, setSelectedVars] = useState([]);
  const [tipoDatos, setTipoDatos] = useState('');
  const [proposito, setProposito] = useState('');
  const [contexto, setContexto] = useState('');
  const [datasetSize, setDatasetSize] = useState('');
  const [nDimensiones, setNDimensiones] = useState('');
  const [nGruposAlto, setNGruposAlto] = useState('Not aplicable');
  const [ordenadas, setOrdenadas] = useState('Not aplicable');
  const [relacion, setRelacion] = useState('Not aplicable');
  const [obsGrupo, setObsGrupo] = useState('Not aplicable');
  const [recommendation, setRecommendation] = useState(''); // Nuevo estado para la recomendación
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para el indicador de carga
  const parsedRecommendation = recommendation ? JSON.parse(recommendation) : null;

  const getEnabledPurposes = () => {

    // Casos solo Distribution
    if (tipoDatos === 'Numeric' && nDimensiones === '1D') {
      return ['Distribution']; // Solo habilitar 'Distribution'
    }

    // Caso para 2D o 3D Numeric: habilitar 'Distribution', 'Correlation' y 'Evolution'
    if (tipoDatos === 'Numeric' && (nDimensiones === '2D' || nDimensiones === '3D') && (ordenadas === 'No' || ordenadas === 'Not applicable')) {
      return ['Distribution', 'Correlation']; // Solo 'Distribution', 'Correlation' 
    }

    if (tipoDatos === 'Numeric' && (nDimensiones === '2D' ) && ordenadas === 'Yes') {
      return ['Evolution', 'Correlation']; // Solo 'Evolution'
    }

    if (tipoDatos === 'Numeric' && (nDimensiones === '3D'|| nDimensiones === '3D+') && ordenadas === 'Yes') {
      return ['Evolution']; // Solo 'Evolution'
    }
    
    // Caso para 3D+ Numeric: habilitar 'Distribution', 'Correlation' 'Evolution' y 'Parte-todo'
    if (tipoDatos === 'Numeric' && nDimensiones === '3D+' && (ordenadas === 'No' || ordenadas === 'Not applicable')) {
      return ['Distribution', 'Correlation', 'Part-to-whole']; // Solo 'Distribution', 'Correlation' y 'Part-to-whole'
    }

    // Categorical
    if (tipoDatos === 'Categorical' && nDimensiones === '1D') {
      return ['Ranking', 'Part-to-whole']; // Solo 'Distribution', 'Correlation' y 'Part-to-whole'
    }

    if (tipoDatos === 'Categorical' && (nDimensiones === '1D' || nDimensiones === '2D')  && relacion === 'Independent') {
      return ['Part-to-whole']; // caso especial
    }

    if (tipoDatos === 'Categorical' && (nDimensiones === '2D' || nDimensiones === '3D' || nDimensiones === '3D+')  && relacion === 'Subgroup') {
      return ['Ranking','Part-to-whole','Correlation', 'Flow']; // caso especial
    }

    if (tipoDatos === 'Categorical' && (nDimensiones === '2D' || nDimensiones === '3D' || nDimensiones === '3D+')  && relacion === 'Nested') {
      return ['Ranking','Part-to-whole']; // caso especial
    }

    if (tipoDatos === 'Categorical' && (nDimensiones === '2D' || nDimensiones === '3D' || nDimensiones === '3D+')  && relacion === 'Adjacency') {
      return ['Correlation', 'Flow']; // caso especial
    }

    if (tipoDatos === '1NUM1CAT' && obsGrupo === 'Several') {
      return ['Distribution']; // Solo habilitar 'Distribution'
    }

    if (tipoDatos === '1NUM1CAT' && obsGrupo === 'One') {
      return ['Distribution','Part-to-whole', 'Ranking']; // Solo habilitar 'Distribution'
    }

    if (tipoDatos === '1CAT+2+NUM' && obsGrupo === 'Several' && ordenadas === 'No') {
      return ['Distribution','Correlation']; // Solo habilitar 'Distribution'
    }
    if (tipoDatos === '1CAT+2+NUM' && obsGrupo === 'Several' && ordenadas === 'Yes') {
      return ['Evolution','Correlation']; // Solo habilitar 'Distribution'
    }
    if (tipoDatos === '1CAT+2+NUM' && obsGrupo === 'One') {
      return ['Ranking','Part-to-whole','Flow','Correlation']; // Solo habilitar 
    }
    if (tipoDatos === '1NUM2+CAT' && relacion === 'Subgroup' && obsGrupo === 'One') {
      return ['Ranking','Part-to-whole','Flow','Correlation']; // Solo habilitar 
    }
    if (tipoDatos === '1NUM2+CAT' && relacion === 'Subgroup' && obsGrupo === 'Several') {
      return ['Distribution']; // Solo habilitar 
    }
    if (tipoDatos === '1NUM2+CAT' && relacion === 'Nested' && obsGrupo === 'One') {
      return ['Ranking','Part-to-whole'];
    } // 
    if (tipoDatos === '1NUM2+CAT' && relacion === 'Nested' && obsGrupo === 'Several') {
      return ['Distribution'];
    } //
    if (tipoDatos === '1NUM2+CAT' && relacion === 'Adjacency') {
      return ['Flow','Correlation'];
    } //

    return ['Distribution', 'Correlation', 'Ranking', 'Part-to-whole', 'Evolution', 'Flow']; // Habilitar todos por defecto
  };

   // Estado para controlar si el botón debe estar habilitado
   const isButtonDisabled = !proposito || !contexto;

  // Handler para la carga de archivo
  const handleFileUpload = ({ data, columnTypes, numRecords }) => {
    setDataset(data);
    setColumnTypes(columnTypes);
    setNumRecords(numRecords);
    setSelectedVars([]);
    setTipoDatos('');
    setDatasetSize('');
    setNDimensiones('');
    setNGruposAlto('');
    setOrdenadas('');
    setRelacion('');
    setObsGrupo('');
  };

  // Efecto para actualizar dimensiones y tipo de datos
  useEffect(() => {
    if (dataset) {
      // Clasificación del tamaño del dataset
      if (numRecords < 100) {
        setDatasetSize('Small');
      } else if (numRecords >= 100 && numRecords <= 10000) {
        setDatasetSize('Medium');
      } else {
        setDatasetSize('Big');
      }

      // Calculamos nDimensiones y tipoDatos si hay variables seleccionadas
      if (selectedVars.length > 0) {
        const numNumericas = selectedVars.filter(v => columnTypes[v] === 'Numeric').length;
        const numCategoricas = selectedVars.filter(v => columnTypes[v] === 'Categorical').length;

        // Determinamos dimensiones
        if (selectedVars.length === 1) setNDimensiones('1D');
        else if (selectedVars.length === 2) setNDimensiones('2D');
        else if (selectedVars.length === 3) setNDimensiones('3D');
        else if (selectedVars.length > 3) setNDimensiones('3D+');

        // Determinamos los tipo de datos
        if (numNumericas === selectedVars.length) setTipoDatos('Numeric');
        else if (numCategoricas === selectedVars.length) setTipoDatos('Categorical');
        else if (numNumericas === 1 && numCategoricas === 1) setTipoDatos('1NUM1CAT');
        else if (numNumericas === 1 && numCategoricas >= 2) setTipoDatos('1NUM2+CAT');
        else if (numNumericas >= 2 && numCategoricas >= 1) setTipoDatos('1CAT+2+NUM');
      }
    }
  }, [selectedVars, dataset, numRecords, columnTypes]);

  // Cambio 05/01 para resetear cuando se deseleccionan variables los valors de preguntas dinamicas que ya no aparecerían
  useEffect(() => {
    // Resetear el tipo de datos, dimensiones y demás estado relacionado con las variables seleccionadas
    setNGruposAlto('Not applicable');
    setOrdenadas('Not applicable');
    setRelacion('Not applicable');
    setObsGrupo('Not applicable');
    //setProposito('');
  }, [selectedVars]); // Este efecto se activará cada vez que cambie selectedVars

  const handlePurposeChange = (value) => setProposito(value);
  const handleContextChange = (value) => setContexto(value);

  // llamada al servidor server.js backend en su endpoint
  const sendData = async (data) => {
    console.log(data);
    setIsLoading(true); // Mostramos el indicador de carga
    setRecommendation(''); // Limpiamos la recomendación anterior
    try {
      const response = await fetch("http://localhost:3001/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setRecommendation(result.recommendation); // Actualizar recomendación
      } else {
        console.error("Error al obtener la recomendación");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    } finally {
      setIsLoading(false); // Ocultamos el indicador de carga
    }
  };

    // Efecto para renderizar el gráfico de D3.js según la recomendación
    useEffect(() => {
      // Si la recomendación es "Barplot", renderizamos el gráfico
      if (recommendation === 'Barplot') {
        const svg = d3.select('#chart')
          .append('svg')
          .attr('width', 500)
          .attr('height', 300);
  
        const data = [12, 25, 8, 15, 20]; // Datos de ejemplo
  
        const xScale = d3.scaleBand()
          .domain(data.map((_, i) => i))
          .range([0, 500])
          .padding(0.1);
  
        const yScale = d3.scaleLinear()
          .domain([0, d3.max(data)])
          .range([300, 0]);
  
        svg.selectAll('.bar')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', (_, i) => xScale(i))
          .attr('y', d => yScale(d))
          .attr('width', xScale.bandwidth())
          .attr('height', d => 300 - yScale(d))
          .attr('fill', 'steelblue');
      }
  
      // Cleanup: eliminar el gráfico al cambiar la recomendación
      return () => {
        d3.select('#chart').selectAll('*').remove();
      };
    }, [recommendation]);
  

  return (
    <div className="App">
      <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">Automatización de la Selección de Visualizaciones de Datos Mediante IA para la Alfabetización de Datos</h1>
        </div>
      </header>
      <div className="left-block">
      <FileUploader onUpload={handleFileUpload} />
      {dataset && (
        <div>
          <div className="message-container-group">
          <p className="message-container"><strong>Dataset Loaded</strong></p>
          <p className='message-container'><strong>Number of records:</strong> {numRecords}</p>
          {/* Agregar el DataTypeSelector justo después */}
          {tipoDatos && nDimensiones && (
            <div className="data-type-selector">
              <DataTypeSelector tipoDatos={tipoDatos} nDimensiones={nDimensiones} />
            </div>
          )}
          </div>
          <h4>Detected Data types:</h4>

          <div className="data-type-cards">
            {Object.entries(columnTypes).map(([column, type]) => (
              <DataTypeCard
                key={column}
                column={column}
                type={type}
                isSelected={selectedVars.includes(column)}
                onToggle={() => {
                  const newSelection = selectedVars.includes(column)
                    ? selectedVars.filter((v) => v !== column)
                    : [...selectedVars, column];
                  setSelectedVars(newSelection);
                }}
              />
            ))}
          </div>


 
        </div>
      )}
      {dataset && (
        <>
          
        {/* <VariableSelector dataset={dataset} selectedVars={selectedVars} setSelectedVars={setSelectedVars} /> */}

          {/*<VisualizationPurposeSelector onSelectPurpose={handlePurposeChange} />*/}
          <Questionnaire
            tipoDatos={tipoDatos} 
            selectedVars={selectedVars} 
            proposito={proposito} 
            contexto={contexto} 
            datasetSize={datasetSize} 
            nDimensiones={nDimensiones}
            ordenadas={ordenadas}
            setOrdenadas={setOrdenadas}
            relacion={relacion}
            setRelacion={setRelacion}
            obsGrupo={obsGrupo}
            setObsGrupo={setObsGrupo}
            setNGruposAlto={setNGruposAlto} 
          />
          <VisualizationPurposeSelector 
            onSelectPurpose={handlePurposeChange} 
            enabledPurposes={getEnabledPurposes()} 
          />
          <VisualizationContextSelector onSelectContext={handleContextChange} />
          
        </>
      )}
      </div>

      <div className="right-block">
      <div className="results-container">
      <div className="data-block">
      <h3>Data collected for recommendation</h3>
        <p><strong>Purpose of Visualization:</strong> {proposito || "Not applicable"}</p>
        <p><strong>Context of Visualization:</strong> {contexto || "Not applicable"}</p>
        <p><strong>Data type:</strong> {tipoDatos || "Not found"}</p>
        <p><strong>Dataset size:</strong> {datasetSize || "Not found"}</p>
        <p><strong>Number of dimensions selected:</strong> {nDimensiones || "Not found"}</p>
		    <p><strong>In case of numerical, is any variable ordered?:</strong> {ordenadas || "Not applicable"}</p>
		    <p><strong>In case of categorical, what is the relation?:</strong> {relacion || "Not applicable"}</p>
        <p><strong>High number of groups in data:</strong> {nGruposAlto || "Not applicable"}</p>
        <p><strong>Observations per group:</strong> {obsGrupo || "Not applicable"}</p>
      </div>
            
       {/* Botón y mensaje condicional */}
       {isButtonDisabled && <p style={{ color: '#ff9900' }}>Seleccione el propósito y contexto</p>}
      <button className="recommend_btn"
        onClick={() =>
          sendData({
            tipo_datos: tipoDatos,
            n_dimensiones: nDimensiones,
            proposito: proposito,
            contexto: contexto,
            dataset_size: datasetSize,
            n_grupos_alto: nGruposAlto || "Not applicable", // Valor predeterminado
            ordenadas: ordenadas || "Not applicable",     // Valor predeterminado
            relacion: relacion || "Not applicable",       // Valor predeterminado
            obs_grupo: obsGrupo || "Not applicable"       // Valor predeterminado
                })
        }
        disabled={isButtonDisabled} // Deshabilitar si falta propósito o contexto
      >
        Recommend graph
      </button>
      
      {parsedRecommendation && (
            <div className="recommendation-section">
              <h3 className="recommendation-title">Recommendations</h3>
              <table className="recommendation-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Rule-Based</td>
                    <td>{parsedRecommendation.rule_based}</td>
                  </tr>
                  <tr>
                    <td>AI-Based</td>
                    <td>{parsedRecommendation.ai_based}</td>
                  </tr>
                </tbody>
              </table>

              <div className="chart-preview">
                <h4 className="chart-title">Recommended Chart</h4>
                <div className="chart-content">
                {parsedRecommendation.ai_based && (
                  <img
                    src={`/charts/${parsedRecommendation.rule_based}.png`}
                    alt={`Recommended chart: ${parsedRecommendation.ai_based}`}
                    className="chart-image"
                  />
                )}

        {/* enlace a visualización */}
        <div className="visualization-link">
            <a 
              href="/visualization/index.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ textDecoration: 'none', fontSize: '20px' }}
            >
              Ir a la visualización
            </a>
          </div> </div>
          
              

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




export default App;



