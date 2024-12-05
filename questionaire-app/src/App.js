import React, { useState, useEffect } from 'react'; // useEffect para refrescar
import FileUploader from './components/FileUploader';
import VariableSelector from './components/VariableSelector';
import DataTypeSelector from './components/DataTypeSelector';
import VisualizationPurposeSelector from './components/VisualizationPurposeSelector';
import VisualizationContextSelector from './components/VisualizationContextSelector';
import Questionnaire from './components/Questionnaire';
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

      // Calcular nDimensiones y tipoDatos si hay variables seleccionadas
      if (selectedVars.length > 0) {
        const numNumericas = selectedVars.filter(v => columnTypes[v] === 'Numeric').length;
        const numCategoricas = selectedVars.filter(v => columnTypes[v] === 'Categorical').length;

        // Determinar dimensiones
        if (selectedVars.length === 1) setNDimensiones('1D');
        else if (selectedVars.length === 2) setNDimensiones('2D');
        else if (selectedVars.length === 3) setNDimensiones('3D');
        else if (selectedVars.length > 3) setNDimensiones('3D+');

        // Determinar tipo de datos
        if (numNumericas === selectedVars.length) setTipoDatos('Numeric');
        else if (numCategoricas === selectedVars.length) setTipoDatos('Categorical');
        else if (numNumericas === 1 && numCategoricas === 1) setTipoDatos('1NUM1CAT');
        else if (numNumericas === 1 && numCategoricas >= 2) setTipoDatos('1NUM2+CAT');
        else if (numNumericas >= 2 && numCategoricas >= 1) setTipoDatos('1CAT+2+NUM');
      }
    }
  }, [selectedVars, dataset, numRecords, columnTypes]);

  const handlePurposeChange = (value) => setProposito(value);
  const handleContextChange = (value) => setContexto(value);

  // llamada al servidor server.js backend en su endpoint
  const sendData = async (data) => {
    console.log(data);
    setIsLoading(true); // Mostrar indicador de carga
    setRecommendation(''); // Limpiar recomendación anterior
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
      setIsLoading(false); // Ocultar indicador de carga
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
      <FileUploader onUpload={handleFileUpload} />
      {dataset && (
        <div>
          <h3>Dataset Loaded</h3>
          <p><strong>Number of records:</strong> {numRecords}</p>
          <h4>Detected Data types:</h4>
          <ul>
            {Object.entries(columnTypes).map(([column, type]) => (
              <li key={column}>{column}: {type}</li>
            ))}
          </ul>
        </div>
      )}
      {dataset && (
        <>
          <DataTypeSelector tipoDatos={tipoDatos} nDimensiones={nDimensiones} />
          <VariableSelector dataset={dataset} selectedVars={selectedVars} setSelectedVars={setSelectedVars} />
          <VisualizationPurposeSelector onSelectPurpose={handlePurposeChange} />
          <VisualizationContextSelector onSelectContext={handleContextChange} />
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
        </>
      )}
      <div>
      <h4>Data collected for recommendation</h4>
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
       {isButtonDisabled && <p style={{ color: 'red' }}>Seleccione el propósito y contexto</p>}
      <button
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
      
      
      {isLoading && <p>Cargando...</p>} {/* Mostrar mientras se espera respuesta */}
      {recommendation && <p>Recomendación: {recommendation}</p>} {/* Mostrar recomendación */}
      {/* Contenedor para el gráfico */}
      <div id="chart"></div>

    </div>
  );
}

export default App;

