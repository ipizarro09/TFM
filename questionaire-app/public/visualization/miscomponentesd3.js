import { loadData } from './dataLoader.js';



// Variable para almacenar la promesa compartida de los datos
let cachedDataPromise = null;

// Función para obtener los datos, cargándolos solo una vez
function getCachedData() {
    if (!cachedDataPromise) {
        cachedDataPromise = loadData();
    }
    return cachedDataPromise;
}

// Kernel para densidad
export function kernelDensityEstimator(kernel, X) {
    return V => X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
}

// Función para el kernel Epanechnikov
export function kernelEpanechnikov(k) {
    return function(v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

// grafico histograma
export function renderHistogram(containerId, colorScheme = "schemeCategory10") { 
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        const chartData = data.inmigration.withoutTotal;

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Extraer los datos de la columna 'inmigrations'
        const validData = chartData.map(d => +d.inmigrations).filter(d => !isNaN(d));

        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 60, right: 200, bottom: 50, left: 50},
              width = 800 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Crear el SVG
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
        // Crear escala X con ticks cada 100,000
        const x = d3.scaleLinear()
            .domain([0, d3.max(validData)]) // Dominio según los datos
            .range([0, width]);

        const xAxis = d3.axisBottom(x)
            .tickFormat(d3.format(","))
            .ticks(6); // Máximo de 6-7 ticks

        // Crear escala Y logarítmica y limitar ticks únicos
        const y = d3.scaleLog()
            .domain([1, d3.max(validData)]) // Dominio logarítmico
            .range([height, 0]);

        const yAxis = d3.axisLeft(y)
            .ticks(6) // Máximo de 6 ticks únicos
            .tickValues([1, 10, 100, 1000, 10000, 100000, 1000000]) // Valores específicos
            .tickFormat(d => `10^${Math.log10(d)}`); // Formato como 10^n

        // Añadir eje X
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "-0.15em")
            .attr("transform", "rotate(-40)");

        // Añadir eje Y
        svg.append("g")
            .call(yAxis);

        // Crear histogram bins
        const histogram = d3.histogram()
            .domain(x.domain()) // Usamos el dominio de X
            .thresholds(x.ticks(30)); // Dividimos en 30 bins

        const bins = histogram(validData);

        // Selección de colores dinámica según el esquema dado
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);
        
        // Dibujar las barras, asegurándonos de que las alturas sean válidas
        svg.selectAll("rect")
            .data(bins.filter(d => d.length > 0)) // Filtrar bins vacíos
            .enter().append("rect")
            .attr("x", d => x(d.x0))
            .attr("y", d => y(d.length)) // Usar escala logarítmica para la posición Y
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1)) // Evitar valores negativos
            .attr("height", d => height - y(d.length)) // Altura de la barra
            .attr("fill", colorScale(0));
        
        // Añadir título al gráfico
        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Distribución de inmigraciones a Europa");
    
     }).catch(error => {
        console.error("Error al cargar los datos:", error);
    });
}

export function renderHistogramDinamico(containerId, dataType = "inmigracion", colorScheme = "schemeCategory10") { 
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        // Seleccionar los datos adecuados en función del parámetro dataType
        let chartData;
        switch (dataType) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;  // Cambia el path para 'emigracion'
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal;  // Cambia el path para 'inmigracion'
                break;
            case 'muertes':
                chartData = data.inmigration.withoutTotal;  // Cambia el path para 'muertes'
                break;
            case 'poblacion':
                chartData = data.inmigration.withoutTotal;  // Cambia el path para 'poblacion'
                break;
            default:
                console.error('Tipo de datos desconocido:', dataType);
                return;
        }

    
        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Seleccionar la columna de acuerdo al tipo de dato (inmigracion, emigracion, muertes, poblacion)
        let validData;
        switch (dataType) {
            case 'emigracion':
                validData = chartData.map(d => +d.emigrations).filter(d => !isNaN(d));  // Si fuera emigracion
                break;
            case 'inmigracion':
                validData = chartData.map(d => +d.inmigrations).filter(d => !isNaN(d));  // Si fuera inmigracion
                break;
            case 'muertes':
                validData = chartData.map(d => +d.death).filter(d => !isNaN(d));  // Para 'muertes' usamos la columna 'death'
                break;
            case 'poblacion':
                validData = chartData.map(d => +d.jan).filter(d => !isNaN(d));  // Para 'poblacion' usamos la columna 'jan'
                break;
            default:
                console.error('Tipo de datos desconocido:', dataType);
                return;
        }

        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 60, right: 200, bottom: 50, left: 50},
              width = 800 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Crear el SVG
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
        // Crear escala X con ticks cada 100,000
        const x = d3.scaleLinear()
            .domain([0, d3.max(validData)]) // Dominio según los datos
            .range([0, width]);

        const xAxis = d3.axisBottom(x)
            .tickFormat(d3.format(","))
            .ticks(6); // Máximo de 6-7 ticks

        // Crear escala Y logarítmica y limitar ticks únicos
        const y = d3.scaleLog()
            .domain([1, d3.max(validData)]) // Dominio logarítmico
            .range([height, 0]);

        const yAxis = d3.axisLeft(y)
            .ticks(6) // Máximo de 6 ticks únicos
            .tickValues([1, 10, 100, 1000, 10000, 100000, 1000000]) // Valores específicos
            .tickFormat(d => `10^${Math.log10(d)}`); // Formato como 10^n

        // Añadir eje X
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em")
            .attr("dy", "-0.15em")
            .attr("transform", "rotate(-40)");

        // Añadir eje Y
        svg.append("g")
            .call(yAxis);

        // Crear histogram bins
        const histogram = d3.histogram()
            .domain(x.domain()) // Usamos el dominio de X
            .thresholds(x.ticks(30)); // Dividimos en 30 bins

        const bins = histogram(validData);

        // Selección de colores dinámica según el esquema dado
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);
        
        // Dibujar las barras, asegurándonos de que las alturas sean válidas
        svg.selectAll("rect")
            .data(bins.filter(d => d.length > 0)) // Filtrar bins vacíos
            .enter().append("rect")
            .attr("x", d => x(d.x0))
            .attr("y", d => y(d.length)) // Usar escala logarítmica para la posición Y
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1)) // Evitar valores negativos
            .attr("height", d => height - y(d.length)) // Altura de la barra
            .attr("fill", colorScale(0));
        
        // Añadir título al gráfico
        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", - margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Distribución de ${dataType} en Europa`);
    
     }).catch(error => {
        console.error("Error al cargar los datos:", error);
    });
}

// Grafico DensityPlot
export function renderDensityPlotMulti(containerId, colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        const chartData = data.inmigration.withoutTotal;

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar los datos para excluir los registros con 'country_birth_region' igual a "UNKNOWN"
        const filteredData = chartData.filter(d => d["country_birth_region"] !== "UNKNOWN");

        // Agrupar los datos filtrados por 'country_birth_region'
        const dataByRegion = d3.group(filteredData, d => d["country_birth_region"]);

        // Agrupar los datos por 'reporting_country_name'
        /*const dataByRegion = d3.group(chartData, d => d["country_birth_region"]);*/

        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 60, right: 200, bottom: 50, left: 50},
              width = 800 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Crear el SVG y agregarlo al contenedor
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Grupo principal para el gráfico
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Agregar el eje X
        const x = d3.scaleLinear()
            .domain([-10, 15])  // Definir dominio en función de los datos
            .range([0, width]);
        chartGroup.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Agregar el eje Y
        const y = d3.scaleLinear()
            .domain([0, 0.12])  // Ajustar dominio del eje Y según el rango de densidad
            .range([height, 0]);
        chartGroup.append("g")
            .call(d3.axisLeft(y));

        // Selección de colores dinámica según el esquema dado
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        // Iterar sobre cada sub-región y calcular la densidad
        Array.from(dataByRegion).forEach(([region, regionData], index) => {
            // Calcular la estimación de densidad usando el kernel
            const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(60));
            const density = kde(
                regionData
                    .map(d => +d.inmigrations_log)  // Extraemos 'inmigrations_log'
                    .filter(d => !isNaN(d))  // Filtramos NaN
            );

            // Graficar el área para cada (country_birth_region)
            chartGroup.append("path")
                .datum(density)
                .attr("fill", colorScale(region))  // Color único por country_birth_region
                .attr("opacity", 0.6)
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x(d[0]))
                    .y(d => y(d[1]))
                );
        });

        // Crear grupo de leyenda a la derecha del gráfico
        const legendGroup = svg.append("g")
            .attr("transform", `translate(${width + margin.left + 60}, ${margin.top})`);

        // Añadir la leyenda
        Array.from(dataByRegion).forEach(([region], index) => {
            legendGroup.append("circle")
                .attr("cx", 0)
                .attr("cy", 20 + index * 25)
                .attr("r", 6)
                .style("fill", colorScale(region));

            legendGroup.append("text")
                .attr("x", 15)
                .attr("y", 21 + index * 25)
                .text(region)
                .style("font-size", "14px")
                .attr("alignment-baseline", "middle");
        });

        // Añadir título al gráfico
        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Distribución de inmigraciones a Europa según regiones de nacimiento");
    });
}

// Función para renderizar el gráfico de densidad sin partición por región
export function renderDensityPlotUni(containerId, colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        const chartData = data.inmigration.withoutTotal;

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Extraer la columna 'inmigrations_log' de los datos filtrados
        const validData = chartData
            .map(d => +d.inmigrations_log)  // Extraemos 'inmigrations_log'
            .filter(d => !isNaN(d));  // Filtramos NaN

        if (validData.length === 0) {
            console.error('No hay datos válidos para el gráfico de densidad.');
            return;
        }
        console.log("Datos inmigration para density plot uni i:",validData )
        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 60, right: 200, bottom: 50, left: 50},
              width = 800 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Crear el SVG y agregarlo al contenedor
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Grupo principal para el gráfico
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Agregar el eje X
        const x = d3.scaleLinear()
            .domain([-100, 150])  // Definir dominio en función de los datos
            .range([0, width]);
        chartGroup.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Agregar el eje Y
        const y = d3.scaleLinear()
            .domain([0, 0.12])  // Ajustar dominio del eje Y según el rango de densidad
            .range([height, 0]);
        chartGroup.append("g")
            .call(d3.axisLeft(y));

        // Calcular la estimación de densidad usando el kernel
        const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(60));
        const density = kde(validData);

        // Selección de colores (usamos un único color para toda la curva)
        const color = d3.scaleOrdinal(d3[colorScheme])(0);

        // Graficar la curva de densidad
        chartGroup.append("path")
            .datum(density)
            .attr("fill", color)  // Color único para la curva
            .attr("opacity", 0.6)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(d => x(d[0]))
                .y(d => y(d[1]))
            );

        // Añadir título al gráfico
        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Distribución de inmigraciones a Europa");
    });
}

// Función para renderizar el gráfico de densidad dinámico según el tipo de datos (dataSource)
export function renderDensityPlotDinamico(containerId, dataSource = "inmigracion", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        // Seleccionar el conjunto de datos según el parámetro dataSource
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;  // Usar los datos de emigración
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal;  // Usar los datos de inmigración
                break;
            case 'muertes':
                chartData = data.inmigration.withoutTotal;  // Usar los datos de muertes
                break;
            case 'poblacion':
                chartData = data.inmigration.withoutTotal;  // Usar los datos de población
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Extraer la columna según el tipo de datos seleccionado
        let validData;
        switch (dataSource) {
            case 'emigracion':
                validData = chartData
                    .map(d => +d.emigrations_log)  // Usamos 'emigrations' para emigración
                    .filter(d => !isNaN(d));  // Filtramos NaN
                break;
            case 'inmigracion':
                validData = chartData
                    .map(d => +d.inmigrations_log)  // Usamos 'inmigrations_log' para inmigración
                    .filter(d => !isNaN(d));  // Filtramos NaN
                break;
            case 'muertes':
                validData = chartData
                    .map(d => +d.death_log)  // Usamos 'death' para muertes
                    .filter(d => !isNaN(d));  // Filtramos NaN
                break;
            case 'poblacion':
                validData = chartData
                    .map(d => +d.jan_log)  // Usamos 'jan' para población
                    .filter(d => !isNaN(d));  // Filtramos NaN
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (validData.length === 0) {
            console.error('No hay datos válidos para el gráfico de densidad.');
            return;
        }

        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 40, right: 25, bottom: 20, left: 20},
              width = 600 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;

        // Crear el SVG y agregarlo al contenedor
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Grupo principal para el gráfico
        const chartGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Ajustar el dominio del eje X con un margen del 10%
        const dataExtent = d3.extent(validData);
        const marginFactor = 0.85; // 10% de margen
        const xDomain = [
            dataExtent[0] - (dataExtent[1] - dataExtent[0]) * marginFactor,
            dataExtent[1] + (dataExtent[1] - dataExtent[0]) * marginFactor
        ];

        // Agregar el eje X
        const x = d3.scaleLinear()
            .domain(xDomain)  // Definir dominio según los datos
            .range([0, width]);
        chartGroup.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Agregar el eje Y
        const y = d3.scaleLinear()
            .domain([0, 0.12])  // Ajustar dominio del eje Y según el rango de densidad
            .range([height, 0]);
        chartGroup.append("g")
            .call(d3.axisLeft(y));

        // Calcular la estimación de densidad usando el kernel
        const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(60));
        const density = kde(validData);

        // Selección de colores (usamos un único color para toda la curva)
        const color = d3.scaleOrdinal(d3[colorScheme])(0);

        // Graficar la curva de densidad
        chartGroup.append("path")
            .datum(density)
            .attr("fill", color)  // Color único para la curva
            .attr("opacity", 0.6)
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-linejoin", "round")
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(d => x(d[0]))
                .y(d => y(d[1]))
            );

        // Añadir título al gráfico
        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Distribución de ${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} en Europa`);
    }).catch(error => {
        console.error("Error al cargar los datos:", error);
    });
}

export function renderRidgeLine_example(containerId) {
    // set the dimensions and margins of the graph
    const margin = { top: 80, right: 30, bottom: 50, left: 110 },
          width = 460 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
  
    // append the svg object to the body of the page
    const svg = d3.select(containerId)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    // Read data
    d3.csv("https://raw.githubusercontent.com/zonination/perceptions/master/probly.csv").then(function (data) {
      // Get the different categories and count them
      const categories = ["Almost Certainly", "Very Good Chance", "We Believe", "Likely", "About Even", "Little Chance", "Chances Are Slight", "Almost No Chance"];
      const n = categories.length;
  
      // Compute the mean of each group
      let allMeans = [];
      for (let i = 0; i < categories.length; i++) {
        const currentGroup = categories[i];
        const mean = d3.mean(data, function (d) { return +d[currentGroup]; });
        allMeans.push(mean);
      }
  
      // Create a color scale using these means.
      const myColor = d3.scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateViridis);
  
      // Add X axis
      const x = d3.scaleLinear()
        .domain([-10, 120])
        .range([0, width]);
  
      svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100]).tickSize(-height))
        .select(".domain").remove();
  
      // Add X axis label
      svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        .text("Probability (%)");
  
      // Create a Y scale for densities
      const y = d3.scaleLinear()
        .domain([0, 0.25])
        .range([height, 0]);
  
      // Create the Y axis for names
      const yName = d3.scaleBand()
        .domain(categories)
        .range([0, height])
        .paddingInner(1);
        
      svg.append("g")
        .call(d3.axisLeft(yName).tickSize(0))
        .select(".domain").remove();
  
      // Compute kernel density estimation for each column
      const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40)); // increase this 40 for more accurate density
      let allDensity = [];
      for (let i = 0; i < n; i++) {
        const key = categories[i];
        const density = kde(data.map(function (d) { return d[key]; }));
        allDensity.push({ key: key, density: density });
      }
  
      // Add areas
      svg.selectAll("areas")
        .data(allDensity)
        .join("path")
        .attr("transform", function (d) {
          // Use let/const to declare grp, index, and value
          const grp = d.key;
          const index = categories.indexOf(grp);
          const value = allMeans[index];
  
          // Adjust translation
          return `translate(0, ${(yName(d.key) - height)})`;
        })
        .attr("fill", function (d) {
          const grp = d.key;
          const index = categories.indexOf(grp);
          const value = allMeans[index];
          return myColor(value);
        })
        .datum(function (d) { return d.density; })
        .attr("opacity", 0.7)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.1)
        .attr("d", d3.line()
          .curve(d3.curveBasis)
          .x(function (d) { return x(d[0]); })
          .y(function (d) { return y(d[1]); })
        );
    });
  }
  

 export function renderRidgeLine(containerId, dataSource = "inmigracion", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor
  
    getCachedData().then(data => {
      // Seleccionar el conjunto de datos según el parámetro dataSource
      let chartData;
      switch (dataSource) {
        case 'emigracion':
          chartData = data.emigration.withoutTotal;  // Usar los datos de emigración
          break;
        case 'inmigracion':
          chartData = data.inmigration.withoutTotal;  // Usar los datos de inmigración
          break;
        default:
          console.error('Tipo de datos desconocido:', dataSource);
          return;
      }
  
      if (!Array.isArray(chartData)) {
        console.error('chartData no es un array:', chartData);
        return;
      }
  
      // Extraer la columna según el tipo de datos seleccionado
      let validData;
      switch (dataSource) {
        case 'emigracion':
          validData = chartData
            .map(d => +d.emigrations_log)  // Usamos 'emigrations' para emigración
            .filter(d => !isNaN(d));  // Filtramos NaN
          break;
        case 'inmigracion':
          validData = chartData
            .map(d => +d.inmigrations_log)  // Usamos 'inmigrations_log' para inmigración
            .filter(d => !isNaN(d));  // Filtramos NaN
          break;
        default:
          console.error('Tipo de datos desconocido:', dataSource);
          return;
      }
  
      if (validData.length === 0) {
        console.error('No hay datos válidos para el gráfico de densidad.');
        return;
      }
  
      // Filtrar los datos para excluir los registros con 'country_birth_region' igual a "UNKNOWN"
      const filteredData = chartData.filter(d => d["country_birth_region"] !== "UNKNOWN");
  
      // Agrupar los datos filtrados por 'country_birth_region'
      const dataByRegion = d3.group(filteredData, d => d["country_birth_region"]);
      
      // Selección de colores dinámica según el esquema dado
      const colorScale = d3.scaleOrdinal(d3[colorScheme]);
      
      // Obtener las regiones en un array
      const regions = Array.from(dataByRegion.keys());
      const n = regions.length;
      console.log("Regiones disponibles:", regions);
  
      // set the dimensions and margins of the graph
      const margin = { top: 250, right: 30, bottom: 50, left: 80 },
      //width = 460 - margin.left - margin.right,
      //height = 400 - margin.top - margin.bottom;
       width = 600 - margin.left - margin.right,
       height = 500 - margin.top - margin.bottom;
 
      // append the svg object to the body of the page
      const svg = d3.select(containerId)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
      // Add X axis
      const x = d3.scaleLinear()
        .domain([-10, 30])
        .range([0, width]);
  
      svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickValues([-10, -5, 0, 5, 10, 15,20,25]).tickSize(-height))
        .select(".domain").remove();
  
      // Add X axis label
      svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + 40)
        ;
  
      // Create a Y scale for densities
      const y = d3.scaleLinear()
        .domain([0, 0.25])
        .range([height, 0]);
  
      // Create the Y axis for names
      const yName = d3.scaleBand()
        .domain(regions)
        .range([0, height])
        .paddingInner(1);
  
      svg.append("g")
        .call(d3.axisLeft(yName).tickSize(0))
        .select(".domain").remove();
  
      // Compute kernel density estimation for each column
      const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40)); // Increase this 40 for more accurate density
  
      let allDensity = [];
      for (let i = 0; i < n; i++) {
        const key = regions[i];
        const density = kde(filteredData.filter(d => d["country_birth_region"] === key).map(d => d[dataSource === "inmigracion" ? "inmigrations_log" : "emigrations_log"]));
        allDensity.push({ key: key, density: density });
      }
  
      // Aquí calculamos el alto de cada banda
      const bandHeight = height / n;
      
       // Añadir título al gráfico
       svg.append("text")
       .attr("x", (width  ) / 2)
       .attr("y", - margin.top + 60 ) // para alinear con los otros graficos
       .attr("text-anchor", "middle")
       .style("font-size", "16px")
       .style("font-weight", "bold")
       .text(`Distribución de ${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} en Europa por region de nacimiento`);

      // Add areas
      svg.selectAll("areas")
        .data(allDensity)  // Asociamos los datos correctamente usando .data() 
        .join("g") // Usamos <g> para agrupar cada curva
        .attr("class", "curveGroup")
        .attr("transform", function(d){return("translate(0," + (yName(d.key)-height) +")" )})
        .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("d",  d3.line()
          .curve(d3.curveBasis)
          .x(function(d) { return x(d[0]); })
          .y(function(d) { return y(d[1]); }))
        .each(function (d) {
          // Para cada grupo (<g>) agregar la path
          d3.select(this).append("path")
            .attr("fill", function () {
              const index = regions.indexOf(d.key);
              return colorScale(index); // Usar color basado en el índice de la región
            })
            .datum(function () { return d.density; })
            .attr("opacity", 0.7)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.1)
            .attr("d", d3.line()
              .curve(d3.curveBasis)
              .x(function (d) { return x(d[0]); })
              .y(function (d) { return y(d[1]); })
            );
        });
    });
  }


export function renderRidgeLineImproved(containerId, dataSource = "inmigracion", colorScheme = "schemeCategory10", groupByColumn = "country_birth_region") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor
  
    getCachedData().then(data => {
        // Seleccionar el conjunto de datos según el parámetro dataSource
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar los datos para excluir los registros con valores "UNKNOWN" en la columna de agrupación
        const filteredData = chartData.filter(d => d[groupByColumn] !== "UNKNOWN");

        // Agrupar los datos según la columna dinámica
        const dataByGroup = d3.group(filteredData, d => d[groupByColumn]);

        // Selección de colores dinámica según el esquema dado
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        // Obtener los grupos únicos
        const groups = Array.from(dataByGroup.keys());
        const n = groups.length;

        console.log("Grupos disponibles:", groups);

        // Dimensiones del gráfico
        const margin = { top: 250, right: 30, bottom: 50, left: 80 };
        const width = 600 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Crear SVG
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Escala X
        const x = d3.scaleLinear()
            .domain([-10, 30])
            .range([0, width]);

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickValues([-10, -5, 0, 5, 10, 15, 20, 25]).tickSize(-height))
            .select(".domain").remove();

        // Escala Y para las densidades
        const y = d3.scaleLinear()
            .domain([0, 0.25])
            .range([height, 0]);

        // Escala Y para los nombres de los grupos
        const yName = d3.scaleBand()
            .domain(groups)
            .range([0, height])
            .paddingInner(1);

        svg.append("g")
            .call(d3.axisLeft(yName).tickSize(0))
            .select(".domain").remove();

        // Calcular la estimación de densidad para cada grupo
        const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
        const allDensity = groups.map(group => ({
            key: group,
            density: kde(filteredData.filter(d => d[groupByColumn] === group)
                .map(d => d[dataSource === "inmigracion" ? "inmigrations_log" : "emigrations_log"]))
        }));

        // Añadir título al gráfico
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Distribución de ${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} en Europa por ${groupByColumn}`);

        // Añadir las curvas de densidad
        svg.selectAll("areas")
            .data(allDensity)
            .join("path")
            .attr("transform", d => `translate(0, ${yName(d.key) - height})`)
            .attr("fill", d => colorScale(d.key))
            .datum(d => d.density)
            .attr("opacity", 0.7)
            .attr("stroke", "#000")
            .attr("stroke-width", 0.1)
            .attr("d", d3.line()
                .curve(d3.curveBasis)
                .x(d => x(d[0]))
                .y(d => y(d[1]))
            );
    }).catch(error => console.error('Error al cargar los datos:', error));
}


// Boxplot

export function renderBoxplotMultiDinamico(containerId, dataSource = "inmigracion", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor
  
    getCachedData().then(data => {
      // Seleccionar el conjunto de datos según el parámetro dataSource
      let chartData;
      switch (dataSource) {
        case 'emigracion':
          chartData = data.emigration.withoutTotal;  // Usar los datos de emigración
          break;
        case 'inmigracion':
          chartData = data.inmigration.withoutTotal;  // Usar los datos de inmigración
          break;
        default:
          console.error('Tipo de datos desconocido:', dataSource);
          return;
      }
  
      if (!Array.isArray(chartData)) {
        console.error('chartData no es un array:', chartData);
        return;
      }
  
      // Filtrar los datos para excluir los registros con 'country_birth_region' igual a "UNKNOWN"
      const filteredData = chartData.filter(d => d["country_birth_region"] !== "UNKNOWN");
  
      // Agrupar los datos filtrados por 'country_birth_region'
      const dataByRegion = d3.group(filteredData, d => d["country_birth_region"]);
      
      // Selección de colores dinámica según el esquema dado
      const colorScale = d3.scaleOrdinal(d3[colorScheme]);
      
      // Obtener las regiones en un array
      const regions = Array.from(dataByRegion.keys());
      const n = regions.length;
      console.log("Regiones disponibles:", regions);
  
      // Establecer las dimensiones y márgenes del gráfico
      const margin = {top: 60, right: 200, bottom: 50, left: 50},
      width = 900 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

      // append the svg object to the body of the page
      const svg = d3.select(containerId)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
      // Add X axis
      const x = d3.scaleBand()
        .domain(regions)
        .range([0, width])
        .padding(0.1);
  
      svg.append("g")
        .attr("class", "xAxis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .select(".domain").remove();
  
      // Add Y axis
      const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => +d[dataSource === "inmigracion" ? "inmigrations_log" : "emigrations_log"])])
        .nice()
        .range([height, 0]);
  
      svg.append("g")
        .call(d3.axisLeft(y));
  
      // Añadir título fuera del gráfico, por encima
      svg.append("text")
        .attr("x", (width + margin.left ) / 2) // Centrado en el ancho total del gráfico
        .attr("y", -margin.top / 2) // Posición por encima del gráfico
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Distribución de ${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} en Europa por region de nacimiento`);
  
      // Crear el boxplot para cada región
      svg.selectAll(".boxplot")
        .data(regions)
        .join("g")
        .attr("class", "boxplot")
        .attr("transform", (d, i) => `translate(${x(d) + x.bandwidth() / 2}, 0)`)
        .each(function(region) {
          const dataRegion = dataByRegion.get(region).map(d => d[dataSource === "inmigracion" ? "inmigrations_log" : "emigrations_log"]);
  
          // Calcular los percentiles para cada región
          const q1 = d3.quantile(dataRegion.sort(d3.ascending), 0.25);
          const median = d3.quantile(dataRegion.sort(d3.ascending), 0.5);
          const q3 = d3.quantile(dataRegion.sort(d3.ascending), 0.75);
          const interQuartileRange = q3 - q1;
          const min = Math.max(d3.min(dataRegion) - 1, q1 - 1.5 * interQuartileRange);
          const max = Math.min(d3.max(dataRegion) + 1, q3 + 1.5 * interQuartileRange);
  
          // Crear las líneas de cada boxplot
          d3.select(this)
            .append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("stroke", colorScale(regions.indexOf(region)))
            .attr("stroke-width", 1);
  
          // Crear el rectángulo (la caja) de cada boxplot
          d3.select(this)
            .append("rect")
            .attr("x", -10)
            .attr("y", y(q3))
            .attr("width", 20)
            .attr("height", y(q1) - y(q3))
            .attr("fill", colorScale(regions.indexOf(region)))
            .attr("opacity", 0.7);
  
          // Crear la línea de la mediana
          d3.select(this)
            .append("line")
            .attr("x1", -10)
            .attr("x2", 10)
            .attr("y1", y(median))
            .attr("y2", y(median))
            .attr("stroke", "#000")
            .attr("stroke-width", 2);
        });
    });
  }
  

// Gráfico 3: Bar Plot
export function renderBarPlot(containerId) {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        const chartData = data.inmigration.withoutTotal;

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        const validData = chartData.map(d => ({
            category: d.country_birth,
            value: +d.inmigrations
        })).filter(d => !isNaN(d.value));

        const svg = container.append("svg")
            .attr("width", 500)
            .attr("height", 300);

        const xScale = d3.scaleBand()
            .domain(validData.map(d => d.category))
            .range([0, 500])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(validData, d => d.value)])
            .range([300, 0]);

        svg.selectAll("rect")
            .data(validData)
            .enter().append("rect")
            .attr("x", d => xScale(d.category))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => 300 - yScale(d.value))
            .attr("fill", "blue");
    }).catch(error => {
        console.error("Error al cargar los datos:", error);
    });
}

export function renderViolinPlotMultiDinamico(containerId, dataSource = "inmigracion", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor

    getCachedData().then(data => {
        // Seleccionar el conjunto de datos según el parámetro dataSource
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;  // Usar los datos de emigración
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal;  // Usar los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar los datos para excluir los registros con 'country_birth_region' igual a "UNKNOWN"
        const filteredData = chartData.filter(d => d["reporting_country_sub-region"] !== "UNKNOWN");

        // Agrupar los datos filtrados por 'reporting_country_sub-region'
        const dataByRegion = d3.group(filteredData, d => d["reporting_country_sub-region"]);

        // Selección de colores dinámica según el esquema dado
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        // Obtener las regiones en un array
        const regions = Array.from(dataByRegion.keys());
        const n = regions.length;
        console.log("Regiones disponibles:", regions);

        // Dimensiones y márgenes del gráfico
        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 60, right: 200, bottom: 50, left: 50},
              width = 800 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;


        // Crear SVG
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Ajuste de la escala Y para incluir un pequeño margen adicional
        const yMin = d3.min(filteredData, d => d.inmigrations_log);
        const yMax = d3.max(filteredData, d => d.inmigrations_log);

        // Asegurarnos de que el rango Y esté suficientemente amplio, ajustando márgenes y valores extremos.
        const y = d3.scaleLinear()
            .domain([0, yMax + 1])  // Añadir margen alrededor de los valores para evitar "compresión"
            .range([height, 0]);
        svg.append("g").call(d3.axisLeft(y));

        // Escala X
        const x = d3.scaleBand()
            .range([0, width])
            .domain(regions)
            .padding(0.05);
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Definir el histograma
        const histogram = d3.histogram()
            .domain(y.domain())
            .thresholds(y.ticks(20))  // Puedes ajustar esto si los bins son demasiados
            .value(d => d);

        // Agrupar los datos por región y calcular los bins usando d3.groups
        const sumstat = d3.groups(filteredData, d => d["reporting_country_sub-region"])
            .map(([key, values]) => {
                const bins = histogram(values.map(d => d.inmigrations_log));  // Calcular los bins para 'inmigrations_log'
                return { key, value: bins };
            });

        // Encontrar el valor máximo para ajustar el ancho de los violines
        const maxNum = d3.max(sumstat, d => d3.max(d.value, bin => bin.length));

        // Escala para el ancho de los violines
        const xNum = d3.scaleLinear()
            .range([0, x.bandwidth()])
            .domain([-maxNum, maxNum]);
        
        // Añadir título al gráfico
       svg.append("text")
       .attr("x", (width + margin.left ) / 2)
       .attr("y", - margin.top / 2 ) // para alinear con los otros graficos
       .attr("text-anchor", "middle")
       .style("font-size", "16px")
       .style("font-weight", "bold")
       .text(`Distribución de ${dataSource.charAt(0).toUpperCase() + dataSource.slice(1)} en zonas de Europa`);

        // Agregar los violines al gráfico con colores dinámicos
        svg.selectAll("myViolin")
            .data(sumstat)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${x(d.key)},0)`)  // Posicionar cada violín según la región
            .append("path")
            .datum(d => d.value)  // Pasar los valores de los bins
            .style("stroke", "none")
            .style("fill", colorScale)  // Asignar color dinámico por región
            .attr("d", d3.area()
                .x0(d => xNum(-d.length))  // Crear la parte izquierda del violín
                .x1(d => xNum(d.length))   // Crear la parte derecha del violín
                .y(d => y(d.x0))  // Colocar cada bin en la escala Y
                .curve(d3.curveCatmullRom)  // Suavizar las curvas para el estilo violín
            );
    }).catch(error => console.error('Error al cargar los datos:', error));
}
            


export function renderViolinPlotEjemplo(containerId) {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor
    
        // Dimensiones y márgenes del gráfico
        const margin = { top: 10, right: 30, bottom: 30, left: 40 };
        const width = 460 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
    
        // Crear SVG
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Cargar los datos y crear el gráfico
        d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv").then(data => {
    
            // Escala Y
            const y = d3.scaleLinear()
                .domain([3.5, 8]) // Ajustar según sea necesario
                .range([height, 0]);
            svg.append("g").call(d3.axisLeft(y));
    
            // Escala X
            const x = d3.scaleBand()
                .range([0, width])
                .domain(["setosa", "versicolor", "virginica"])
                .padding(0.05);
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));
    
            // Definir el histograma
            const histogram = d3.histogram()
                .domain(y.domain())
                .thresholds(y.ticks(20))
                .value(d => d);
    
            // Agrupar los datos por especie y calcular los bins usando d3.groups
            const sumstat = d3.groups(data, d => d.Species)
                .map(([key, values]) => {
                    const bins = histogram(values.map(d => d.Sepal_Length));
                    return { key, value: bins };
                });
    
            // Encontrar el valor máximo para ajustar el ancho de los violines
            const maxNum = d3.max(sumstat, d => d3.max(d.value, bin => bin.length));
    
            // Escala para el ancho de los violines
            const xNum = d3.scaleLinear()
                .range([0, x.bandwidth()])
                .domain([-maxNum, maxNum]);
    
            // Agregar los violines al gráfico
            svg.selectAll("myViolin")
                .data(sumstat)
                .enter()
                .append("g")
                .attr("transform", d => `translate(${x(d.key)},0)`)
                .append("path")
                .datum(d => d.value)
                .style("stroke", "none")
                .style("fill", "#69b3a2")
                .attr("d", d3.area()
                    .x0(d => xNum(-d.length))
                    .x1(d => xNum(d.length))
                    .y(d => y(d.x0))
                    .curve(d3.curveCatmullRom) // Suaviza las curvas para el estilo violín
                );
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    

    export function renderBarplotDinamicoHorizontal(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "country_birth_sub-region", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
            
            // filtramos UNKNOWN y Other
            const filteredData = chartData.filter(d => d[yColumn] !== "UNKNOWN" && d[yColumn] !== "Other");

            // Ordenar los datos de mayor a menor
            filteredData.sort((a, b) => d3.descending(+a[xColumn], +b[xColumn]));
    
            // Configuración del gráfico con dimensiones más grandes
            /*const margin = { top: 40, right: 50, bottom: 60, left: 150 },
                width = 800 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;*/
            
            const margin = { top: 50, right: 150, bottom: 50, left: 300 },
                width = 1000 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            // Escala X
            const x = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => +d[xColumn]) || 1]) // Máximo dinámico en base a los datos
                .range([0, width]);
    
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5))
                .selectAll("text")
                .style("font-size", "12px");
    
            // Escala Y
            const y = d3.scaleBand()
                .range([0, height])
                .domain(filteredData.map(d => d[yColumn])) // Nombres dinámicos en base a la columna yColumn
                .padding(0.1);
    
            svg.append("g")
                .call(d3.axisLeft(y).tickSize(0))
                .selectAll("text")
                .style("font-size", "12px")
                .style("text-anchor", "end");
    
            // Escala de colores dinámica
            const colorScale = d3.scaleOrdinal(d3[colorScheme]).domain(filteredData.map(d => d[yColumn]));
    
            // Barras
            svg.selectAll("myRect")
                .data(filteredData)
                .enter()
                .append("rect")
                .attr("x", x(0))
                .attr("y", d => y(d[yColumn]))
                .attr("width", d => x(+d[xColumn]))
                .attr("height", y.bandwidth())
                .attr("fill", d => colorScale(d[yColumn]));
    
            // Añadir título al gráfico
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Ranking de ${xColumn} en ${dataSource} por ${yColumn} `);
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    
    
    export function renderWordCloudDinamica(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "country_birth_sub-region", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
    
            // Preprocesar los datos para obtener la suma de inmigraciones por país
            const wordCloudData = preprocessDataForWordCloud(chartData, xColumn, yColumn);
    
            // Crear la nube de palabras
            const fill = d3.scaleOrdinal(d3[colorScheme]);
    
            const svg = container.append("svg")
                .attr("width", 800)
                .attr("height", 600);
    
            const layout = d3.layout.cloud()
                .size([800, 600])
                .words(wordCloudData.map(d => ({text: d.text, size: d.size})))
                .padding(5)
                .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .font("Impact")
                .fontSize(d => Math.sqrt(d.size) * 10) // Ajustar tamaño de las palabras según el número total de inmigraciones
                .on("end", draw);
    
            layout.start();
    
            function draw(words) {
                svg.append("g")
                    .attr("transform", "translate(400,300)")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-family", "Impact")
                    .style("fill", (d, i) => fill(i))
                    .attr("text-anchor", "middle")
                    .attr("font-size", d => d.size + "px")
                    .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                    .text(d => d.text);
            }
    
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    
    // Función de preprocesamiento para sumar inmigraciones por país
    function preprocessDataForWordCloud(data, xColumn = "inmigrations", yColumn = "country_birth_sub-region") {
        const countryTotals = {};
    
        // Agrupar los datos por país y sumar las inmigraciones
        data.forEach(d => {
            const country = d[yColumn]; // País
            const inmigraciones = +d[xColumn]; // Inmigraciones
            if (country !== "UNKNOWN" && country !== "Other") { // Filtrar "UNKNOWN" y "Other"
                countryTotals[country] = (countryTotals[country] || 0) + inmigraciones;
            }
        });
    
        // Convertir el objeto countryTotals a un array de objetos {text: "país", size: total_inmigraciones}
        const wordCloudData = Object.keys(countryTotals).map(country => ({
            text: country,
            size: countryTotals[country]
        }));
    
        return wordCloudData;
    }
    
    export function renderLollipopPlotDinamico_horizontal(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "country_birth_sub-region", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
    
            // 1. Agrupar por región o país y sumar las inmigraciones utilizando d3.group()
            const groupedData = d3.group(chartData, d => d[yColumn]); // Agrupar por la columna de país o subregión
            const summedData = Array.from(groupedData, ([key, values]) => ({
                key: key,
                value: d3.sum(values, d => +d[xColumn]) // Sumar las inmigraciones por cada grupo
            }));
    
            // 2. Ordenar los datos por inmigraciones de mayor a menor
            summedData.sort((a, b) => b.value - a.value);
    
            // 3. Configuración del gráfico
            const margin = { top: 10, right: 30, bottom: 40, left: 100 },
                width = 800 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            // 4. Escala X (para los valores de inmigración)
            const x = d3.scaleLinear()
                .domain([0, d3.max(summedData, d => d.value) || 1]) // Máximo dinámico en base a los datos
                .range([0, width]);
    
            // 5. Escala Y (para las regiones o países)
            const y = d3.scaleBand()
                .range([0, height])
                .domain(summedData.map(d => d.key)) // Nombres dinámicos en base a la columna yColumn
                .padding(0.5);
    
            // Añadir el eje X (valores)
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(10));
    
            // Añadir el eje Y (regiones o países)
            svg.append("g")
                .call(d3.axisLeft(y).tickSize(0));
    
            // 6. Escala de colores dinámica
            const colorScale = d3.scaleOrdinal(d3[colorScheme]).domain(summedData.map(d => d.key));
    
            // 7. Añadir las líneas (solo hasta el círculo)
            svg.selectAll("myLine")
                .data(summedData)
                .enter()
                .append("line")
                .attr("x1", 0) // Las líneas comienzan desde el eje X
                .attr("x2", d => x(d.value)) // Las líneas tienen una longitud basada en la suma de inmigraciones
                .attr("y1", d => y(d.key)) // Las líneas se posicionan en el eje Y, por cada región
                .attr("y2", d => y(d.key)) // Las líneas terminan en la misma posición en el eje Y
                .attr("stroke", "grey")
                .attr("stroke-width", 1);
    
            // 8. Añadir los círculos en la punta de las líneas
            svg.selectAll("myCircle")
                .data(summedData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.value)) // Los círculos están en el extremo de las líneas, en el eje X
                .attr("cy", d => y(d.key)) // Los círculos están alineados con la posición de la región en el eje Y
                .attr("r", 7)
                .style("fill", d => colorScale(d.key))
                .attr("stroke", "black");
    
            // 9. Añadir título al gráfico
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "18px")
                .style("font-weight", "bold")
                .text(`Gráfico Lollipop (${dataSource})`);
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    
    export function renderLollipopPlotDinamico(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "country_birth_sub-region", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
            
            // filtramos UNKNOWN y Other
            const filteredData = chartData.filter(d => d[yColumn] !== "UNKNOWN" && d[yColumn] !== "Other");

            // 1. Agrupar por región o país y sumar las inmigraciones utilizando d3.group()
            const groupedData = d3.group(filteredData, d => d[yColumn]); // Agrupar por la columna de país o subregión
            const summedData = Array.from(groupedData, ([key, values]) => ({
                key: key,
                value: d3.sum(values, d => +d[xColumn]) // Sumar las inmigraciones por cada grupo
            }));
    
            // 2. Ordenar los datos por inmigraciones de mayor a menor
            summedData.sort((a, b) => b.value - a.value);
    
            // 3. Configuración del gráfico
            const margin = { top: 60, right: 30, bottom: 150, left: 100 },
                width = 1100 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            
            // 5. Escala Y (para las regiones o países)
            const x = d3.scaleBand()
                .range([0, width])
                .domain(summedData.map(d => d.key)) // Nombres dinámicos en base a la columna yColumn
                .padding(2);
    
            // Añadir el eje X (valores)
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("font-size", "12px") // Aumentar el tamaño de las etiquetas de las regiones
                    .style("text-anchor", "end");
    
            // 4. Escala X (para los valores de inmigración)
            const y = d3.scaleLinear()
                .domain([0, d3.max(summedData, d => d.value) || 1]) // Máximo dinámico en base a los datos
                .range([height, 0]);
    
            // Añadir el eje Y (regiones o países)
            svg.append("g")
                .call(d3.axisLeft(y).tickSize(0));
    
            // 6. Escala de colores dinámica
            const colorScale = d3.scaleOrdinal(d3[colorScheme]).domain(summedData.map(d => d.key));
    
            // 7. Añadir las líneas (solo hasta el círculo)
            svg.selectAll("myLine")
                .data(summedData)
                .enter()
                .append("line")
                .attr("x1", function(d) { return x(d.key); })
                .attr("x2", function(d) { return x(d.key); })
                .attr("y1", function(d) { return y(d.value); })
                .attr("y2", y(0))
                .attr("stroke", "grey")
                .attr("stroke-width", 1);
    
            // 8. Añadir los círculos en la punta de las líneas
            svg.selectAll("myCircle")
                .data(summedData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.key)) // Los círculos están en el extremo de las líneas, en el eje X
                .attr("cy", d => y(d.value)) // Los círculos están alineados con la posición de la región en el eje Y
                .attr("r", 7)
                .style("fill", d => colorScale(d.key))
                .attr("stroke", "black");
    
            // 9. Añadir título al gráfico
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Ranking de ${dataSource} por ${yColumn}`);
        }).catch(error => console.error('Error al cargar los datos:', error));
    }

    export function renderLollipopPlotDinamicoDrill(
        containerId,
        dataSource = "inmigracion",
        yColumn = "inmigrations",
        groupColumn = "country_birth_name",
        colorScheme = "schemeCategory10"
    ) {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
    
            // Filtrar los datos con la misma lógica que en la dona
            const filteredData = chartData.filter(d =>
                d[groupColumn] !== "UNKNOWN" && d[groupColumn] !== "Other" && d[groupColumn] !== "Todas" &&
                d["country_birth"] !== "US" && d["country_birth"] !== "IN" &&
                d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU" && d["country_birth_name"] !== "Europe"
            );
    
            // Agrupar y sumar los datos utilizando d3.rollup
            const groupedData = d3.rollup(
                filteredData,
                v => d3.sum(v, d => +d[yColumn]), // Sumar los valores de yColumn (inmigrations)
                d => d[groupColumn] // Agrupar por groupColumn (country_birth_name)
            );
    
            // Convertir a lista, ordenar por valor y seleccionar los Top 20
            const top20Data = Array.from(groupedData, ([key, value]) => ({ key, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 20);
    
            // Configuración del gráfico
            const margin = { top: 60, right: 30, bottom: 150, left: 100 },
                width = 1100 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            // Escala X
            const x = d3.scaleBand()
                .range([0, width])
                .domain(top20Data.map(d => d.key)) // Nombres dinámicos en base a la columna groupColumn
                .padding(2);
    
            // Añadir el eje X
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("font-size", "12px")
                .style("text-anchor", "end");
    
            // Escala Y
            const y = d3.scaleLinear()
                .domain([0, d3.max(top20Data, d => d.value) || 1]) // Máximo dinámico en base a los datos
                .range([height, 0]);
    
            // Añadir el eje Y
            svg.append("g")
                .call(d3.axisLeft(y).tickSize(0));
    
            // Escala de colores dinámica
            const colorScale = d3.scaleOrdinal(d3[colorScheme]).domain(top20Data.map(d => d.key));
    
            // Añadir las líneas (solo hasta el círculo)
            svg.selectAll("myLine")
                .data(top20Data)
                .enter()
                .append("line")
                .attr("x1", d => x(d.key))
                .attr("x2", d => x(d.key))
                .attr("y1", d => y(d.value))
                .attr("y2", y(0))
                .attr("stroke", "grey")
                .attr("stroke-width", 1);
    
            // Añadir los círculos en la punta de las líneas
            svg.selectAll("myCircle")
                .data(top20Data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.key))
                .attr("cy", d => y(d.value))
                .attr("r", 7)
                .style("fill", d => colorScale(d.key))
                .attr("stroke", "black");
    
            // Añadir título al gráfico
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Ranking top 20 de ${dataSource} por ${groupColumn}`);
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    

    export function render2dDensityPlotDinamico(containerId, xColumn = "jan", yColumn = "death", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Usar datos solo totales de inmigración
            const chartData = data.inmigration.onlyTotal;
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }

            console.log("datos para density:", chartData)
    
            // Configurar las dimensiones y márgenes del gráfico
            const margin = { top: 10, right: 30, bottom: 40, left: 50 },
                  width = 800 - margin.left - margin.right,
                  height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            // Escala X
            const x = d3.scaleLinear()
                .domain([d3.min(chartData, d => +d[xColumn]), d3.max(chartData, d => +d[xColumn]) || 1]) // Rango dinámico basado en los datos
                .range([margin.left, width - margin.right]);
    
            svg.append("g")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x));
    
            // Escala Y
            const y = d3.scaleLinear()
                .domain([0, d3.max(chartData, d => +d[yColumn]) || 1]) // Rango dinámico basado en los datos
                .range([height - margin.bottom, margin.top]);
    
            svg.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y));
    
            // Escala de color
            const color = d3.scaleLinear()
                .domain([0, 1]) // Densidad relativa
                .range(colorScheme);
    
            // Calcular datos de densidad
            const densityData = d3.contourDensity()
                .x(d => x(+d[xColumn]))
                .y(d => y(+d[yColumn]))
                .size([width, height])
                .bandwidth(20) // Ajusta el ancho de banda para suavizar la densidad
                (chartData);
    
            // Dibujar las formas de densidad
            svg.insert("g", "g")
                .selectAll("path")
                .data(densityData)
                .enter().append("path")
                .attr("d", d3.geoPath())
                .attr("fill", d => color);
    
            // Añadir título
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Gráfico de Densidad 2D");
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    
    export function renderBubblePlot(containerId, poblacionColumn = "jan", muertesColumn = "death", inmigrationsColumn = "inmigrations", subregionColumn = "reporting_country_sub-region", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar el contenedor antes de agregar el gráfico
        
        getCachedData().then(data => {
            // Seleccionamos los datos (se usará el dataset de inmigraciones y muertes)
            const chartData = data.inmigration.onlyTotal; // Usa tus propios datos si son diferentes
            
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
    
            // Filtramos datos inválidos
            const filteredData = chartData.filter(d => {
                const poblacion = +d[poblacionColumn];
                const muertes = +d[muertesColumn];
                const inmigrations = +d[inmigrationsColumn];
                return !isNaN(poblacion) && !isNaN(muertes) && !isNaN(inmigrations);
            });
    
            if (filteredData.length === 0) {
                console.error("No hay datos válidos para graficar.");
                return;
            }
    
            // Configuración del gráfico
            const margin = { top: 50, right: 100, bottom: 50, left: 100 },
                  width = 1000 - margin.left - margin.right,
                  height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
    
            const chartGroup = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            // Escala X para la población
            const x = d3.scaleLinear()
                .domain(d3.extent(filteredData, d => +d[poblacionColumn])) // Rango dinámico
                .nice()
                .range([0, width]);
    
            chartGroup.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5));
    
            // Escala Y para las muertes
            const y = d3.scaleLinear()
                .domain(d3.extent(filteredData, d => +d[muertesColumn])) // Rango dinámico
                .nice()
                .range([height, 0]);
    
            chartGroup.append("g")
                .call(d3.axisLeft(y).ticks(5));
    
            // Escala para el tamaño de las burbujas (basado en las inmigraciones)
            const z = d3.scaleLinear()
                .domain([d3.min(filteredData, d => +d[inmigrationsColumn]), d3.max(filteredData, d => +d[inmigrationsColumn])])
                .range([4, 40]); // Tamaño mínimo y máximo de la burbuja
    
            // Escala de colores (basado en subregión)
            const myColor = d3.scaleOrdinal(d3[colorScheme]) // Usar el esquema de colores proporcionado
                .domain(filteredData.map(d => d[subregionColumn])); // Usamos subregión como criterio para color
    
            // Añadir burbujas
            chartGroup.append('g')
                .selectAll("dot")
                .data(filteredData)
                .join("circle")
                    .attr("cx", d => x(d[poblacionColumn]))
                    .attr("cy", d => y(d[muertesColumn]))
                    .attr("r", d => z(d[inmigrationsColumn]))
                    .style("fill", d => myColor(d[subregionColumn])) // Coloreamos según subregión
                    .style("opacity", "0.7")
                    .attr("stroke", "white")
                    .style("stroke-width", "2px");
    
            // Añadir título al gráfico
            svg.append("text")
                .attr("x", (width + margin.left + margin.right) / 2)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Inmigraciones vs Muertes vs Población según subregiones de Europa");
    
           
            // Add X axis label:
            svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width)
            .attr("y", height+ margin.top+50 )
            .text("Población");

            svg.append("text")
                .attr("x", -height / 2 + margin.top)
                .attr("y", 30)
                .attr("transform", "rotate(-90)")
                .attr("text-anchor", "middle")
                .text("Muertes");

        // Añadir leyenda de colores
        const size = 20;
        const allGroups = Array.from(new Set(filteredData.map(d => d[subregionColumn]))); // Subregiones únicas

        // Añadir rectángulos para leyenda (fuera del gráfico)
        svg.selectAll("myrect")
            .data(allGroups)
            .enter()
            .append("circle")
                .attr("cx", width + margin.right - 10) // Ajuste para moverlo fuera a la derecha
                .attr("cy", (d, i) => margin.top + i * (size + 5)) // Espaciado entre círculos
                .attr("r", 7)
                .style("fill", d => myColor(d))
                .style("opacity", 0.7)
                .attr("stroke", "white")
                .style("stroke-width", "2px");

        // Añadir etiquetas de texto a la leyenda
        svg.selectAll("mylabels")
            .data(allGroups)
            .enter()
            .append("text")
                .attr("x", width + margin.right ) // Posición de la etiqueta de la leyenda
                .attr("y", (d, i) => margin.top + i * (size + 5) + (size / 2)) // Espaciado entre etiquetas
                .style("fill", d => myColor(d))
                .text(d => d) // Nombre de la subregión
                .attr("text-anchor", "left")
                .style("font-size", "12px")
                .style("alignment-baseline", "middle");
    }).catch(error => console.error('Error al cargar los datos:', error));

    }
        
    export function renderHeatmap(containerId, xColumn = "year", yColumn = "age", dataSource = "inmigracion", colorScheme = "interpolateViridis") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar el contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal;
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal;
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
    
            const edadesValidas = [
                'Y10-14', 'Y15-19', 'Y20-24', 'Y25-29', 'Y30-34', 'Y35-39',
                'Y40-44', 'Y45-49', 'Y50-54', 'Y55-59', 'Y5-9', 'Y60-64',
                'Y65-69', 'Y70-74', 'Y75-79', 'Y80-84', 'Y85-89', 'Y90-94', 'Y95-99'
            ];
    
            const filteredData = chartData.filter(d => edadesValidas.includes(d[yColumn]));
    
            const groupedData = d3.group(filteredData, d => d[xColumn], d => d[yColumn]);
    
            const years = Array.from(new Set(filteredData.map(d => d[xColumn])));
            const ages = edadesValidas;
    
            const heatmapData = years.map(year => {
                return ages.map(age => {
                    const value = groupedData.get(year)?.get(age)?.reduce((sum, d) => sum + d.inmigrations, 0) || 0;
                    return { year, age, inmigrations: value };
                });
            }).flat();
    
            const margin = { top: 50, right: 150, bottom: 50, left: 100 },
                  width = 1000 - margin.left - margin.right,
                  height = 600 - margin.top - margin.bottom;
    
            const svg = container.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
    
            const chartGroup = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            const x = d3.scaleBand()
                .domain(years)
                .range([0, width])
                .padding(0.05);
    
            chartGroup.append("g")
                .style("font-size", 15)
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickSize(0))
                .select(".domain").remove();
    
            const y = d3.scaleBand()
                .domain(ages)
                .range([height, 0])
                .padding(0.05);
    
            chartGroup.append("g")
                .style("font-size", 15)
                .call(d3.axisLeft(y).tickSize(0))
                .select(".domain").remove();
    
            let colorInterpolator;
            switch (colorScheme) {
                case 'schemeDark2': 
                    colorInterpolator = d3.interpolateCool;
                    break;
                case 'schemeCategory10': 
                    colorInterpolator = d3.interpolatePlasma;
                    break;
                default: 
                    colorInterpolator = d3[colorScheme] || d3.interpolateViridis;
                    break;
            }
    
            const minValue = d3.min(heatmapData, d => d.inmigrations);
            const maxValue = d3.max(heatmapData, d => d.inmigrations);
    
            const colorScale = d3.scaleSequential(colorInterpolator)
                .domain([minValue, maxValue]);
    
            chartGroup.selectAll()
                .data(heatmapData)
                .enter()
                .append("rect")
                .attr("x", d => x(d.year))
                .attr("y", d => y(d.age))
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("fill", d => colorScale(d.inmigrations))
                .style("stroke", "none")
                .style("opacity", 0.8);
    
            // Crear la leyenda
            const legendHeight = 200;
            const legendWidth = 20;
    
            const legendGroup = svg.append("g")
                .attr("transform", `translate(${width + margin.left + 20},${margin.top})`);
    
            // Gradiente para la barra de color
            const legendGradient = legendGroup.append("defs")
                .append("linearGradient")
                .attr("id", "legendGradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%");
    
            for (let i = 0; i <= 100; i++) {
                legendGradient.append("stop")
                    .attr("offset", `${i}%`)
                    .attr("stop-color", colorScale(minValue + (maxValue - minValue) * (1 - i / 100)));
            }
    
            legendGroup.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legendGradient)");
    
            // Escala numérica para la leyenda
            const legendScale = d3.scaleLinear()
                .domain([minValue, maxValue])
                .range([legendHeight, 0]);
    
            legendGroup.append("g")
                .attr("transform", `translate(${legendWidth}, 0)`)
                .call(d3.axisRight(legendScale).ticks(6));
            
          
            svg.append("text")
                .attr("x", (width + margin.left + margin.right) / 2)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Inmigraciones de Europa por rangos de edad y año");
    
    
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    
export async function renderConnectedScatterPlot(containerId, xColumn = "year", yColumn = "inmigrations", groupColumn = "age", colorScheme = "schemeCategory10") {
        const margin = { top: 50, right: 150, bottom: 50, left: 100 },
                  width = 1000 - margin.left - margin.right,
                  height = 600 - margin.top - margin.bottom;
        
        // Seleccionar el contenedor y limpiarlo
        const container = d3.select(containerId);
        container.html('');
        
        // Crear SVG
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        try {
            // Leer los datos
            const data = await getCachedData();
            const chartData = data.inmigration.withoutTotal;
        
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
            
            // Lista de grupos (columnas de edad) que queremos ver
            const validaAges =  [
                'Y10-14', 'Y15-19', 'Y20-24', 'Y25-29', 'Y30-34', 'Y35-39',
                'Y40-44', 'Y45-49', 'Y50-54', 'Y55-59', 'Y5-9', 'Y60-64',
                'Y65-69', 'Y70-74', 'Y75-79', 'Y80-84', 'Y85-89', 'Y90-94', 'Y95-99'
            ];
    
            // Filtramos los datos por los grupos que necesitamos
            const filteredData = chartData.filter(d => validaAges.includes(d[groupColumn]));
    
            // Agrupamos los datos por año y grupo de edad usando d3.group
            const groupedData = d3.group(filteredData, d => d.year, d => d[groupColumn]);
    
            // Preparamos los datos para cada grupo de edad
            const dataReady = Array.from(groupedData, ([year, ageGroupMap]) => {
                return Array.from(ageGroupMap, ([age, records]) => {
                    return {
                        year: year,
                        age: age,
                        value: d3.sum(records, d => d[yColumn])  // Sumar las inmigraciones para cada año y grupo de edad
                    };
                });
            }).flat();  // Aplanamos el array para que sea más fácil trabajar con él
    
            // Escalas para los ejes X y Y
            const x = d3.scaleLinear()
                .domain(d3.extent(dataReady, d => d.year))  // Usamos el año de los datos agregados
                .range([0, width]);
    
            const y = d3.scaleLinear()
                .domain([0, d3.max(dataReady, d => d.value)])  // Tomamos el máximo de inmigraciones agregadas
                .range([height, 0]);
    
            // Escala de color
            const color = d3.scaleOrdinal(d3[colorScheme])
                .domain(validaAges);
            
            // Ejes
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    
            svg.append("g")
                .call(d3.axisLeft(y));
    
            // Línea
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.value));
    
            // Dibujar las líneas para cada grupo de edad
            svg.selectAll(".line")
                .data(d3.group(dataReady, d => d.age))  // Agrupar por edad para crear líneas por grupo
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", ([age, values]) => line(values))
                .attr("stroke", ([age]) => color(age))
                .style("stroke-width", 4)
                .style("fill", "none");
    
            // Puntos en las líneas
            svg.selectAll(".points")
                .data(dataReady)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d.value))
                .attr("r", 5)
                .attr("stroke", "white")
                .style("fill", d => color(d.age));
    
            // Etiquetas finales de las líneas (solo la última para cada grupo de edad)
            svg.selectAll(".labels")
                .data(d3.group(dataReady, d => d.age))
                .enter()
                .append("text")
                .datum(([age, values]) => ({
                    name: age,
                    value: values[values.length - 1]  // Último valor del grupo de edad
                }))
                .attr("transform", d => `translate(${x(d.value.year)},${y(d.value.value)})`)
                .attr("x", 12)
                .text(d => d.name)
                .style("fill", d => color(d.name))
                .style("font-size", 15);
            
            // Añadir título al gráfico
            svg.append("text")
                .attr("x", (width + margin.left ) / 2)
                .attr("y", margin.top / 10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Inmigraciones de Europa por rangos de edad y año");
    
        } catch (error) {
            console.error('Error al cargar los datos:', error);
        }
    }
    
    
 export async function renderConnectedScatterplotExample(containerId) {
    // Configuración de las dimensiones y márgenes del gráfico
    const margin = { top: 10, right: 100, bottom: 30, left: 30 },
          width = 460 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Seleccionar el contenedor y limpiar su contenido
    const container = d3.select(containerId);
    container.html('');

    // Crear el elemento SVG
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    try {
        // Leer los datos de forma asíncrona
        const data = await d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_connectedscatter.csv");

        // Lista de grupos (una por columna en el dataset)
        const allGroup = ["valueA", "valueB", "valueC"];

        // Reformatear los datos para obtener un array de arrays de tuplas {x, y}
        const dataReady = allGroup.map(grpName => ({
            name: grpName,
            values: data.map(d => ({ time: +d.time, value: +d[grpName] }))
        }));

        // Escala de colores: un color por cada grupo
        const myColor = d3.scaleOrdinal()
            .domain(allGroup)
            .range(d3.schemeSet2);

        // Agregar el eje X
        const x = d3.scaleLinear()
            .domain([0, 10])
            .range([0, width]);
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Agregar el eje Y
        const y = d3.scaleLinear()
            .domain([0, 20])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Definir la línea
        const line = d3.line()
            .x(d => x(d.time))
            .y(d => y(d.value));

        // Agregar las líneas
        svg.selectAll("myLines")
            .data(dataReady)
            .enter()
            .append("path")
            .attr("d", d => line(d.values))
            .attr("stroke", d => myColor(d.name))
            .style("stroke-width", 4)
            .style("fill", "none");

        // Agregar los puntos
        svg.selectAll("myDots")
            .data(dataReady)
            .enter()
            .append('g')
            .style("fill", d => myColor(d.name))
            .selectAll("myPoints")
            .data(d => d.values)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.time))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .attr("stroke", "white");

        // Agregar las etiquetas al final de cada línea
        svg.selectAll("myLabels")
            .data(dataReady)
            .enter()
            .append('g')
            .append("text")
            .datum(d => ({ name: d.name, value: d.values[d.values.length - 1] })) // Último valor de cada serie
            .attr("transform", d => `translate(${x(d.value.time)},${y(d.value.value)})`)
            .attr("x", 12) // Mover el texto ligeramente a la derecha
            .text(d => d.name)
            .style("fill", d => myColor(d.name))
            .style("font-size", 15);
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
}

export function renderSmallMultipleLineplot(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "country_birth_name", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        // Seleccionar el conjunto de datos según el parámetro dataSource
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar "UNKNOWN" y "Other"
        const filteredData = chartData.filter(d => d[yColumn] !== "UNKNOWN" && d[yColumn] !== "Other" 
                && d["country_birth"] !== "US" && d["country_birth"] !== "IN" && d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU");

        // Filtramos los datos para obtener solo las inmigraciones en 2022
        const filtered2022 = filteredData.filter(d => d.year === 2022);

        // Agrupar por país y sumar las inmigraciones para 2022
        const grouped2022 = d3.group(filtered2022, d => d[yColumn]); // Agrupar por país

        console.log("Datos agrupados 2022:", grouped2022);
        const summed2022 = Array.from(grouped2022, ([key, values]) => ({
            key: key,
            value: d3.sum(values, d => +d[xColumn]) // Sumar las inmigraciones por país
        }));

        // Ordenar por inmigraciones de mayor a menor
        summed2022.sort((a, b) => b.value - a.value);

        // Seleccionar los 9 países con más inmigraciones en 2022
        const top9Countries = summed2022.slice(0, 9);

        // Filtrar los datos para esos 9 países y para los años 2015-2022
        const selectedCountries = top9Countries.map(d => d.key);
        const filteredTop9Data = filteredData.filter(d => selectedCountries.includes(d[yColumn]) && d.year >= 2015 && d.year <= 2022);

        // Agrupar los datos por país y año
        const groupedData = d3.group(filteredTop9Data, d => d[yColumn], d => d.year);

        // Configuración del gráfico
        const margin = { top: 50, right: 0, bottom: 50, left: 50 },
            width = 270 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

        // Añadir un título general al contenedor principal
        container.append("svg")
            .attr("width", 1000) // Ajusta el ancho según sea necesario
            .attr("height", 50) // Altura para el título
            .append("text")
            .attr("x", 500) // Centrar el texto en el ancho
            .attr("y", 30) // Posicionar el texto verticalmente
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Evolución de inmigraciones de los 9 países con más inmigraciones en 2022");

        // Crear SVG para cada gráfico pequeño
        const svgContainer = container.selectAll("svg.graph")
            .data(top9Countries)
            .enter()
            .append("svg")
            .attr("class", "graph")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Escala X (para los años)
        const x = d3.scaleLinear()
            .domain([2015, 2022]) // Los años que vamos a mostrar
            .range([0, width]);

        // Escala Y (para las inmigraciones)
        const y = d3.scaleLinear()
            .domain([0, 1800])
            //.domain([0, d3.max(filteredTop9Data, d => +d[xColumn])]) // Inmigraciones totales
            .range([height, 0]);

        // Paleta de colores
        const color = d3.scaleOrdinal(d3[colorScheme]);
        
        // Dibujar líneas para cada país
        svgContainer.each(function(d) {
            const svg = d3.select(this);
            const countryData = Array.from(groupedData.get(d.key) || [], ([year, values]) => ({
                year: year,
                value: d3.sum(values, d => +d[xColumn]) // Sumar las inmigraciones por año
            }));

            // Eje X
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x)
                    .ticks(5) // Número de marcas en el eje
                    .tickFormat(d3.format("d")) // Formato para números enteros sin comas
                )
                .selectAll("text") // Seleccionar los textos de las marcas
                .attr("transform", "rotate(-90)") // Rotar 90 grados hacia la izquierda
                .style("text-anchor", "end") // Alinear el texto al final para que no se superponga
                .attr("dy", "15px") // Mover hacia abajo para separar del eje
                .attr("dx", "-10px") // Mover hacia abajo para separar del eje
                .style("font-size", "12px"); // Opcional: ajustar el tamaño del texto

            // Eje Y
            svg.append("g")
                .call(d3.axisLeft(y).ticks(5));

            // Dibujar la línea para cada país
            svg.append("path")
                .attr("fill", "none")
                .attr("stroke", color(d.key))
                .attr("stroke-width", 1.9)
                .attr("d", function() {
                    return d3.line()
                        .x(d => x(d.year)) // Año
                        .y(d => y(d.value)) // Inmigraciones
                        (countryData);
                });

            // Añadir el nombre del país
            svg.append("text")
                .attr("text-anchor", "start")
                .attr("y", -5)
                .attr("x", 0)
                .text(d.key)
                .style("fill", color(d.key))
                .style("font-size", "12px")
                .style("font-family", "Arial, sans-serif");
        });
    }).catch(error => console.error('Error al cargar los datos:', error));
}

export async function renderLinePlot(containerId, xColumn = "year", yColumn = "inmigrations", groupColumn = "country_birth_name", colorScheme = "schemeCategory10") {
    const margin = { top: 50, right: 150, bottom: 50, left: 100 },
        width = 1000 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const container = d3.select(containerId);
    container.html('');

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    try {
        const data = await getCachedData();
        console.log('Datos cargados:', data);

        const chartData = data?.inmigration?.withoutTotal;
        if (!chartData || !Array.isArray(chartData)) {
            console.error('Datos de inmigración no disponibles o mal formateados:', chartData);
            return;
        }

        const validaRegions = ['Europe'];
        const filteredData = chartData.filter(d => validaRegions.includes(d["country_birth_region"]));
        //console.log('Datos filtrados:', filteredData);

        if (!filteredData.length) {
            console.error('No hay datos después del filtro:', filteredData);
            return;
        }
        //console.log('Ejemplo de filteredData:', filteredData[0]);
        //console.log('xColumn:', xColumn, '->', filteredData[0]?.[xColumn]);
        //console.log('groupColumn:', groupColumn, '->', filteredData[0]?.[groupColumn]);

        const groupedData = d3.group(filteredData, d => d[xColumn], d => d[groupColumn]);
        //console.log('Datos groupedData para el gráfico:', groupedData);
        const dataReady = Array.from(groupedData, ([year, countryMap]) => {
            return Array.from(countryMap, ([country, records]) => ({
                year: +year,
                country: country,
                value: d3.sum(records, d => +d[yColumn])
            }));
        }).flat();

        console.log('Datos preparados para el gráfico:', dataReady);

        const x = d3.scaleLinear()
            .domain(d3.extent(dataReady, d => d.year))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dataReady, d => d.value)])
            .range([height, 0]);

        if (!x.domain() || !y.domain()) {
            console.error('Las escalas no pudieron ser configuradas correctamente.');
            return;
        }

        const uniqueCountries = Array.from(new Set(dataReady.map(d => d.country)));

        const color = d3.scaleOrdinal(d3[colorScheme]).domain(uniqueCountries);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g").call(d3.axisLeft(y));

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.value));

        svg.selectAll(".line")
            .data(d3.group(dataReady, d => d.country))
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", ([country, values]) => line(values))
            .attr("stroke", ([country]) => country === "Ukraine" ? "#ff0000" : "#ccc") // Color rojo para Ukraine, gris para el resto
            .style("stroke-width", ([country]) => country === "Ukraine" ? 4 : 2) // Más gruesa para Ukraine
            //.attr("stroke", ([country]) => color(country))
            //.style("stroke-width", 2)
            .style("fill", "none");

        // Añadir etiqueta solo para Ukraine
        svg.selectAll(".line-label")
        .data(d3.group(dataReady, d => d.country)) // Agrupar datos por país
        .enter()
        .filter(([country]) => country === "Ukraine" || country === "Russian Federation") // Filtrar solo Ukraine
        .append("text")
        .datum(([country, values]) => ({
            country: country,
            lastValue: values[values.length - 1] // Último valor de la línea
        }))
        .attr("transform", d => `translate(${x(d.lastValue.year)},${y(d.lastValue.value)})`) // Posicionar al final de la línea
        .attr("x", 5) // Desplazar un poco a la derecha para que no toque la línea
        .attr("dy", "-0.5em") // Desplazar hacia arriba para que quede sobre la línea
        .style("font-size", "12px")
        .style("font-weight", d => d.country === "Ukraine" ? "bold" : "normal") // Destacar si es Ukraine
        .style("fill", d => d.country === "Ukraine" ? "#ff0000" : "#000") // Color del texto
        .text(d => d.country); // Mostrar "Ukraine" como texto

        
/*
        svg.selectAll(".points")
            .data(dataReady)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 4)
            .attr("stroke", "white")
            .style("fill", d => color(d.country));
*/
        svg.append("text")
            .attr("x", (width + margin.left) / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Evolución de inmigraciones de ${groupColumn} en Europa`);

    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

export function renderSankey(containerId, dataSource = "inmigracion", source = "country_birth_sub-region", target = "reporting_country_name", filtroregionsource = 'Africa', colorScheme = "schemeCategory10", maxNodes = 50) {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usamos los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar "UNKNOWN" y "Other" y limitar a África y año 2022
        const filteredData = chartData.filter(d => d[source] !== "UNKNOWN" && d[target] !== "UNKNOWN" && d[source] !== "Other" && d[target] !== "Other"
            && d["country_birth_region"] === filtroregionsource
            && d["country_birth"] !== "US" && d["country_birth"] !== "IN"
            && d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU");

        // Filtramos los datos para obtener solo las inmigraciones en 2022
        const filtered2022 = filteredData.filter(d => d.year === 2022);

        // Crear el gráfico de nodos y enlaces
        const graph = { nodes: [], links: [] };

        // Agrupar y filtrar datos antes de crear nodos y enlaces
        filtered2022.forEach(d => {
            graph.nodes.push({ name: d[source] });
            graph.nodes.push({ name: d[target] });
            graph.links.push({
                source: d[source],
                target: d[target],
                value: +d.inmigrations // Aquí cambiamos "d.value" por "d.inmigrations" para usar la propiedad correcta
            });
        });

        // Eliminar nodos duplicados
        graph.nodes = Array.from(new Set(graph.nodes.map(d => d.name))).map(name => ({ name }));

        // Actualizar los índices de los nodos en los enlaces
        graph.links.forEach(d => {
            d.source = graph.nodes.findIndex(node => node.name === d.source);
            d.target = graph.nodes.findIndex(node => node.name === d.target);
        });

        // Definir las dimensiones del gráfico y márgenes
        const margin = { top: 50, right: 20, bottom: 20, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        // Crear el SVG y agregar el título
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)  // Asegúrate de incluir los márgenes en el tamaño total
            .attr("height", height + margin.top + margin.bottom)  // Incluir márgenes también
            .style("display", "block")  // Hace que el SVG se vea como bloque y ocupe el espacio disponible
            .style("margin", "0 auto")  // Centra el SVG en el contenedor

        // Agregar el título (fuera del área del gráfico)
        svg.append("text")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", margin.top / 2)  // Colocar el título fuera del área del gráfico
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Inmigración desde ${filtroregionsource} a Europa (2022)`);

        // Configuración del diagrama Sankey
        const sankey = d3.sankey()
            .nodeWidth(36)
            .nodePadding(10)
            .size([width, height])
            .iterations(0); // Reduce las iteraciones del algoritmo de Sankey

        const sankeyData = sankey({
            nodes: graph.nodes,  // Usar todos los nodos
            links: graph.links  // Usar todos los enlaces
        });

        // Crear escala de colores para los enlaces basada en el país de destino
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        // Optimización de los enlaces
        const link = svg.append("g")
            .selectAll(".link")
            .data(sankeyData.links)
            .join("path")
            .attr("class", "link")
            .attr("d", d3.sankeyLinkHorizontal()) // Usar d3.sankeyLinkHorizontal()
            .style("stroke-width", d => Math.max(1, d.width))
            .style("fill", "none")
            .style("stroke", d => colorScale(d.target.name))  // Color según el reporting_country_name
            .style("opacity", 0.5);

        // Ajustar las posiciones de los enlaces para incluir márgenes
        link.attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Optimización de los nodos
        const node = svg.append("g")
            .selectAll(".node")
            .data(sankeyData.nodes)
            .join("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x0 + margin.left},${d.y0 + margin.top})`); // Asegúrate de aplicar los márgenes aquí

        node.append("rect")
            .attr("height", d => d.y1 - d.y0)
            .attr("width", sankey.nodeWidth())
            .style("fill", (d, i) => d3.scaleOrdinal(d3[colorScheme])(i))
            .style("stroke", "black");

        node.append("text")
            .attr("x", -6)
            .attr("y", d => (d.y1 - d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .text(d => d.name)
            .filter(d => d.x0 < width / 2)
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

    }).catch(error => console.error('Error al cargar los datos:', error));
}


export function renderChord_example(containerId) {
    const container = d3.select(containerId);
    container.html(''); // Limpiar el contenedor antes de agregar el gráfico

    // Dimensiones del SVG
    const width = 440;
    const height = 440;
    const innerRadius = Math.min(width, height) / 2 - 40;
    const outerRadius = innerRadius + 10;

    const matrix = [
        [0, 5871, 8916, 2868],
        [1951, 0, 2060, 6171],
        [8010, 16145, 0, 8045],
        [1013, 990, 940, 0]
    ];
    
    const colors = ["#440154ff", "#31668dff", "#37b578ff", "#fde725ff"];
    
    // Crear el contenedor SVG
    const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Calcular el diagrama de acordes
    const res = d3.chord()
        .padAngle(0.05) // Espaciado entre grupos
        .sortSubgroups(d3.descending) // Ordenar subgrupos descendentes
        (matrix);

    // Agregar los grupos en la parte externa del círculo
    const group = svg
        .datum(res)
        .append("g")
        .selectAll("g")
        .data(d => d.groups)
        .join("g");

    group.append("path")
        .style("fill", (d, i) => colors[i])
        .style("stroke", "black")
        .attr("d", d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
        );

    // Agregar los enlaces entre grupos
    svg
        .datum(res)
        .append("g")
        .selectAll("path")
        .data(d => d)
        .join("path")
        .attr("d", d3.ribbon()
            .radius(innerRadius)
        )
        .style("fill", d => colors[d.source.index]) // Color según el grupo fuente
        .style("stroke", "black");
}

export function renderChord21(containerId, dataSource = "inmigracion", source = "country_birth_sub-region", target = "reporting_country_name", filtroregionsource = 'Africa', colorScheme = "schemeCategory10", maxNodes = 50) {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usamos los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar "UNKNOWN" y "Other" y limitar a África y año 2022
        const filteredData = chartData.filter(d => d[source] !== "UNKNOWN" && d[target] !== "UNKNOWN" && d[source] !== "Other" && d[target] !== "Other"
            && d["country_birth_region"] === filtroregionsource
            && d["country_birth"] !== "US" && d["country_birth"] !== "IN"
            && d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU");

        // Filtramos los datos para obtener solo las inmigraciones en 2022
        const filtered2022 = filteredData.filter(d => d.year === 2022);

        // Crear la matriz de migración (matriz de origen y destino)
        const nodes = Array.from(new Set([
            ...filtered2022.map(d => d[source]),
            ...filtered2022.map(d => d[target])
        ])).slice(0, maxNodes);  // Limitar el número de nodos

        const matrix = nodes.map(() => Array(nodes.length).fill(0));

        filtered2022.forEach(d => {
            const sourceIndex = nodes.indexOf(d[source]);
            const targetIndex = nodes.indexOf(d[target]);
            if (sourceIndex !== -1 && targetIndex !== -1) {
                matrix[sourceIndex][targetIndex] += +d.inmigrations; // Sumar las inmigraciones
            }
        });

        // Definir las dimensiones del gráfico y márgenes
        const margin = { top: 50, right: 20, bottom: 20, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;
        
        const svg = container
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("display", "block")
            .style("margin", "0 auto");

        // Agregar el título (fuera del área del gráfico)
        svg.append("text")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Inmigración desde ${filtroregionsource} a Europa (2022)`);

        // Calcular el diagrama de acordes
        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)
            (matrix);

        const innerRadius = Math.min(width, height) / 2 - 40;
        const outerRadius = innerRadius + 10;

        // Crear el contenedor para el gráfico
        const g = svg
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Colores para los nodos y enlaces
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        // Agregar los grupos (nodos)
        const group = g
            .datum(chord)
            .append("g")
            .selectAll("g")
            .data(d => d.groups)
            .join("g");

        group.append("path")
            .style("fill", (d, i) => colorScale(i))
            .style("stroke", "black")
            .attr("d", d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
            );

        // Agregar etiquetas a los grupos
        group.append("text")
            .attr("x", d => (outerRadius + innerRadius) / 2 * Math.cos((d.startAngle + d.endAngle) / 2))
            .attr("y", d => (outerRadius + innerRadius) / 2 * Math.sin((d.startAngle + d.endAngle) / 2))
            .attr("dy", "0.35em")
            .attr("text-anchor", d => (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start")
            .style("font-size", "12px")
            .style("fill", "black")
            .text((d, i) => nodes[i]);  // Mostrar el nombre del nodo (subregión o país)

        // Agregar los enlaces entre los grupos
        g
            .datum(chord)
            .append("g")
            .selectAll("path")
            .data(d => d)
            .join("path")
            .attr("d", d3.ribbon()
                .radius(innerRadius)
            )
            .style("fill", d => colorScale(d.source.index))
            .style("stroke", "black");

    }).catch(error => console.error('Error al cargar los datos:', error));
}

export function renderChord(containerId, dataSource = "inmigracion", source = "country_birth_sub-region", target = "reporting_country_name", filtroregionsource = 'Africa', colorScheme = "schemeCategory10", maxNodes = 50) { 
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usamos los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar "UNKNOWN" y "Other" y limitar a África y año 2022
        const filteredData = chartData.filter(d => d[source] !== "UNKNOWN" && d[target] !== "UNKNOWN" && d[source] !== "Other" && d[target] !== "Other"
            && d["country_birth_region"] === filtroregionsource
            && d["country_birth"] !== "US" && d["country_birth"] !== "IN"
            && d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU");

        // Filtramos los datos para obtener solo las inmigraciones en 2022
        const filtered2022 = filteredData.filter(d => d.year === 2022);

        // Crear la matriz de migración (matriz de origen y destino)
        const nodes = Array.from(new Set([
            ...filtered2022.map(d => d[source]),
            ...filtered2022.map(d => d[target])
        ])).slice(0, maxNodes);  // Limitar el número de nodos

        const matrix = nodes.map(() => Array(nodes.length).fill(0));

        filtered2022.forEach(d => {
            const sourceIndex = nodes.indexOf(d[source]);
            const targetIndex = nodes.indexOf(d[target]);
            if (sourceIndex !== -1 && targetIndex !== -1) {
                matrix[sourceIndex][targetIndex] += +d.inmigrations; // Sumar las inmigraciones
            }
        });

        // Definir las dimensiones del gráfico y márgenes
        const margin = { top: 50, right: 150, bottom: 20, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;

        const svg = container
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("display", "block")
            .style("margin", "0 auto");

        // Agregar el título (fuera del área del gráfico)
        const title = svg.append("text")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Inmigración desde ${filtroregionsource} a Europa (2022)`);

        // Calcular el diagrama de acordes
        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)
            (matrix);

        const innerRadius = Math.min(width, height) / 2 - 40;
        const outerRadius = innerRadius + 10;

        // Crear el contenedor para el gráfico
        const g = svg
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Colores para los nodos y enlaces (correspondientes a los países target)
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        // Lista de países a mostrar en la leyenda y el gráfico (según lo proporcionado)
        const allowedCountries = [
            "Austria", "Croatia", "Czechia", "Denmark", "Estonia", "Finland", "France", 
            "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Latvia", 
            "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Netherlands, Kingdom of the", 
            "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Slovenia", "Spain", "Sweden"
        ];

        // Filtrar los nodos para solo incluir los países de destino permitidos
        const filteredNodes = nodes.filter(node => allowedCountries.includes(node));

        // Creamos un objeto para guardar los colores de los nodos (países)
        const nodeColors = {};

        // Crear los grupos (nodos) y asignar colores a cada uno
        const group = g
            .datum(chord)
            .append("g")
            .selectAll("g")
            .data(d => d.groups)
            .join("g");

        group.append("path")
            .style("fill", (d, i) => {
                const color = colorScale(i);
                nodeColors[nodes[i]] = color;  // Guardamos el color en el objeto
                return color;
            })  // Los colores se asignan según el índice del target
            .style("stroke", "black")
            .attr("d", d3.arc()
                .innerRadius(innerRadius)
                .outerRadius(outerRadius)
            );

        // Agregar los enlaces entre los grupos (flujos)
        const ribbons = g
            .datum(chord)
            .append("g")
            .selectAll("path")
            .data(d => d)
            .join("path")
            .attr("d", d3.ribbon()
                .radius(innerRadius)
            )
            .style("fill", d => nodeColors[nodes[d.target.index]])  // Usar el color del nodo correspondiente
            .style("stroke", "black")
            .style("opacity", 0.7);

        // Hover para mostrar los flujos de inmigración (con los nombres de source y target)
        ribbons.on("mouseover", function(event, d) {
            d3.select(this).style("opacity", 1);
            const sourceRegion = nodes[d.source.index];
            const targetCountry = nodes[d.target.index];
            const value = matrix[d.source.index][d.target.index]; // Acceder al valor correcto de inmigración
            title.text(`Inmigración: ${sourceRegion} → ${targetCountry}: ${value}`); // Actualizar el título con la información del hover
        })
        .on("mouseout", function(event, d) {
            d3.select(this).style("opacity", 0.7);
            title.text(`Inmigración desde ${filtroregionsource} a Europa (2022)`); // Restaurar el título original al salir del hover
        });

        // Crear la leyenda, solo mostrando los países de destino permitidos
        const legendData = filteredNodes.map((node, i) => ({
            label: node,  // El nombre del país o la subregión
            color: nodeColors[node]  // Usar el color guardado para ese país
        }));

        const legend = svg.append("g")
            .attr("transform", `translate(${width }, 50)`); // Ubicar la leyenda a la derecha

        const legendItem = legend.selectAll(".legend-item")
            .data(legendData)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItem.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .style("fill", d => d.color);  // Usar el color guardado

        legendItem.append("text")
            .attr("x", 18)
            .attr("y", 6)
            .attr("dy", ".35em")
            .style("font-size", "12px")
            .style("fill", "black")
            .text(d => d.label);  // Nombre del país o subregión correspondiente
        
    }).catch(error => console.error('Error al cargar los datos:', error));
}



export function renderTreemap(containerId, dataSource = "inmigracion", maxNodes = 50, colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usamos los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar los datos para solo mostrar inmigraciones a España y que pertenezcan a Africa
        const filteredData = chartData.filter(d => d["reporting_country_name"] === "Spain" && d["country_birth_region"] === "Africa");

        // Verificar si hay datos después del filtro
        if (filteredData.length === 0) {
            console.error('No se encontraron datos para la región especificada.');
            return;
        }

        // Crear la jerarquía de datos
        const hierarchyData = createHierarchy(filteredData);

        // Crear un nodo raíz único para envolver la jerarquía
        const root = {
            key: "root", // Nodo raíz
            children: hierarchyData
        };

        // Aplicar d3.stratify
        const stratifiedRoot = d3.stratify()
            .id(d => d.key)  // ID de cada nodo
            .parentId(d => d.parent ? d.parent.key : null)  // ID del padre
            (root);

        // Verificar si el stratifiedRoot tiene nodos
        if (!stratifiedRoot.children || stratifiedRoot.children.length === 0) {
            console.error('No se pudieron generar nodos para el treemap.');
            return;
        }

        stratifiedRoot.sum(d => +d.value);  // Sumar el valor de inmigración (ajusta según los datos)

        // Configuración de las dimensiones y márgenes del gráfico
        const margin = { top: 10, right: 10, bottom: 10, left: 10 },
              width = 445 - margin.left - margin.right,
              height = 445 - margin.top - margin.bottom;
        
        const colorScale = d3.scaleOrdinal(d3[colorScheme]);

        const svg = container
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Aplicar el algoritmo de treemap
        d3.treemap()
            .size([width, height])
            .padding(4)
            (stratifiedRoot);

        // Crear los rectángulos para el treemap
        svg
            .selectAll("rect")
            .data(stratifiedRoot.leaves())
            .enter()
            .append("rect")
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .style("stroke", "black")
            .style("fill", d => colorScale(d.data.key));  // Usamos colorScale para cada subgrupo

        // Añadir las etiquetas de texto en los rectángulos
        svg
            .selectAll("text")
            .data(stratifiedRoot.leaves())
            .enter()
            .append("text")
            .attr("x", d => d.x0 + 10)    // Ajustar la posición del texto
            .attr("y", d => d.y0 + 20)    // Ajustar la posición del texto
            .text(d => d.data.key)
            .attr("font-size", "15px")
            .attr("fill", "white");

    }).catch(error => console.error('Error al cargar los datos:', error));
}

// Función auxiliar para crear la jerarquía a partir de los datos filtrados
function createHierarchy(filteredData) {
    // Usamos d3.group para agrupar los datos por subregión y país
    const hierarchy = d3.group(filteredData, 
        d => d["country_birth_sub-region"],  // Agrupamos por sub-región
        d => d["country_birth_name"]         // Agrupamos por país
    );

    // Convertir la jerarquía a la forma esperada por d3.stratify
    return Array.from(hierarchy, ([subRegion, countriesMap]) => {
        // Asegurarnos de que 'countriesMap' sea un array
        const countries = Array.from(countriesMap, ([countryKey, countryData]) => ({
            key: countryKey, // Nombre del país
            value: countryData.reduce((acc, curr) => acc + (curr.value || 0), 0) // Sumar los valores de inmigración
        }));

        return {
            key: subRegion,  // Sub-región
            children: countries // Lista de países en la sub-región
        };
    });
}

export function renderDonought(containerId, yColumn = "inmigrations", groupColumn = "country_birth_name", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar el contenedor antes de renderizar

    getCachedData().then(data => {
        // Filtrar y agrupar los datos
        const chartData = data.inmigration.withoutTotal;
        const filteredData = chartData.filter(d =>
            d[groupColumn] !== "UNKNOWN" && d[groupColumn] !== "Other" && d[groupColumn] !== "Todas" &&
            d["country_birth"] !== "US" && d["country_birth"] !== "IN" &&
            d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU"
        );

        const groupedData = d3.rollup(
            filteredData,
            v => d3.sum(v, d => +d[yColumn]), // Sumar los valores de la columna especificada
            d => d[groupColumn] // Agrupar por la columna especificada
        );

        // Convertir a un formato adecuado para d3.pie
        const dataEntries = Array.from(groupedData, ([key, value]) => ({ key, value }));

        // Configuración de dimensiones más grandes
        const width = 600,
              height = 600,
              margin = 100; // Margen amplio para centrar mejor
        const radius = Math.min(width, height) / 2 - margin;

        // Crear el SVG con un margen explícito
       // Crear el SVG con un margen explícito
        const svg = container
        .append("svg")
        .attr("width", width + margin * 4) // Agregar margen al ancho total
        .attr("height", height + margin * 2) // Agregar margen al alto total
        .append("g")
        .attr("transform", `translate(${(width + margin * 2) / 2 + margin},${(height + margin * 2) / 2})`);

        // Escala de colores
        const color = d3.scaleOrdinal()
            .domain(dataEntries.map(d => d.key))
            .range(d3[colorScheme]);

        // Generador de la dona
        const pie = d3.pie()
            .sort(null) // No ordenar los datos
            .value(d => d.value);

        const data_ready = pie(dataEntries);

        const arc = d3.arc()
            .innerRadius(radius * 0.6) // Tamaño del agujero de la dona
            .outerRadius(radius * 0.9);

        const outerArc = d3.arc()
            .innerRadius(radius * 1.1)
            .outerRadius(radius * 1.1);

        // Calcular el total de valores para filtrar etiquetas pequeñas
        const totalValue = d3.sum(dataEntries, d => d.value);
        const threshold = 0.02 * totalValue; // 2% del total

        // Dibujar los segmentos
        svg
            .selectAll('allSlices')
            .data(data_ready)
            .join('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.key))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.9);

        // Añadir líneas entre el gráfico y las etiquetas
        svg
            .selectAll('allPolylines')
            .data(data_ready)
            .join('polyline')
            .attr("stroke", "black")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr('points', function(d) {
                if (d.data.value < threshold) return null; // Omitir líneas para valores bajos
                const posA = arc.centroid(d); // Línea dentro del segmento
                const posB = outerArc.centroid(d); // Línea de quiebre
                const posC = [...outerArc.centroid(d)]; // Posición de la etiqueta
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                posC[0] += midangle < Math.PI ? 15 : -15; // Ajuste horizontal para evitar superposición
                return [posA, posB, posC];
            });

        // Añadir etiquetas para regiones con valores mayores al umbral
        svg
            .selectAll('allLabels')
            .data(data_ready)
            .join('text')
            .text(d => d.data.value >= threshold ? `${d.data.key} (${d.data.value})` : '')
            .attr('transform', function(d) {
                if (d.data.value < threshold) return null; // Omitir etiquetas para valores bajos
                const pos = [...outerArc.centroid(d)];
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] += midangle < Math.PI ? 25 : -25; // Mover etiquetas horizontalmente según su posición
                return `translate(${pos})`;
            })
            .style("font-size", "14px")
            .style('text-anchor', function(d) {
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return (midangle < Math.PI ? 'start' : 'end');
            })
            .style("font-weight", "bold");

            // Añadir título al gráfico
            svg.append("text")
            .attr("x", 45)
            .attr("y", -350)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Ranking de inmigración por sub-region de nacimiento`);


    }).catch(error => console.error('Error al cargar los datos:', error));
}

export function renderDonoughtDrill(containerId, yColumn = "inmigrations", groupColumn = "country_birth_name", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar el contenedor antes de renderizar

    getCachedData().then(data => {
        // Filtrar y agrupar los datos
        const chartData = data.inmigration.withoutTotal;
        const filteredData = chartData.filter(d =>
            d[groupColumn] !== "UNKNOWN" && d[groupColumn] !== "Other" && d[groupColumn] !== "Todas" &&
            d["country_birth"] !== "US" && d["country_birth"] !== "IN" &&
            d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU" && d["country_birth_name"] !== "Europe"
        );

        // Agrupar datos y sumar por la columna especificada
        const groupedData = d3.rollup(
            filteredData,
            v => d3.sum(v, d => +d[yColumn]), // Sumar los valores de la columna especificada
            d => d[groupColumn] // Agrupar por la columna especificada
        );

        // Convertir a lista, ordenar por valor y tomar los Top 20
        const sortedData = Array.from(groupedData, ([key, value]) => ({ key, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 20);

        // Configuración de dimensiones
        const width = 600,
              height = 600,
              margin = 100; // Margen amplio para centrar mejor
        const radius = Math.min(width, height) / 2 - margin;

        // Crear el SVG con un margen explícito
        const svg = container
            .append("svg")
            .attr("width", width + margin * 4) // Agregar margen al ancho total
            .attr("height", height + margin * 2) // Agregar margen al alto total
            .append("g")
            .attr("transform", `translate(${(width + margin * 2) / 2 + margin},${(height + margin * 2) / 2})`);

        // Escala de colores
        const color = d3.scaleOrdinal()
            .domain(sortedData.map(d => d.key))
            .range(d3[colorScheme]);

        // Generador de la dona
        const pie = d3.pie()
            .sort(null) // No ordenar los datos
            .value(d => d.value);

        const data_ready = pie(sortedData);

        const arc = d3.arc()
            .innerRadius(radius * 0.6) // Tamaño del agujero de la dona
            .outerRadius(radius * 0.9);

        const outerArc = d3.arc()
            .innerRadius(radius * 1.1)
            .outerRadius(radius * 1.1);

        // Dibujar los segmentos
        svg
            .selectAll('allSlices')
            .data(data_ready)
            .join('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.key))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.9);

        // Calcular el total de valores para filtrar etiquetas pequeñas
        const totalValue = d3.sum(sortedData, d => d.value);
        const threshold = 0.02 * totalValue; // 2% del total

        // Añadir líneas entre el gráfico y las etiquetas
        svg
            .selectAll('allPolylines')
            .data(data_ready)
            .join('polyline')
            .attr("stroke", "black")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr('points', function(d) {
                if (d.data.value < threshold) return null; // Omitir líneas para valores bajos
                const posA = arc.centroid(d); // Línea dentro del segmento
                const posB = outerArc.centroid(d); // Línea de quiebre
                const posC = [...outerArc.centroid(d)]; // Posición de la etiqueta
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                posC[0] += midangle < Math.PI ? 15 : -15; // Ajuste horizontal para evitar superposición
                return [posA, posB, posC];
            });

        // Añadir etiquetas para regiones con valores mayores al umbral
        svg
            .selectAll('allLabels')
            .data(data_ready)
            .join('text')
            .text(d => d.data.value >= threshold ? `${d.data.key} (${d.data.value})` : '')
            .attr('transform', function(d) {
                if (d.data.value < threshold) return null; // Omitir etiquetas para valores bajos
                const pos = [...outerArc.centroid(d)];
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] += midangle < Math.PI ? 25 : -25; // Mover etiquetas horizontalmente según su posición
                return `translate(${pos})`;
            })
            .style("font-size", "14px")
            .style('text-anchor', function(d) {
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return (midangle < Math.PI ? 'start' : 'end');
            })
            .style("font-weight", "bold");

        // Añadir título al gráfico
        svg.append("text")
            .attr("x", 0)
            .attr("y", -radius - margin )
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("Ranking de inmigración por país de nacimiento");

    }).catch(error => console.error('Error al cargar los datos:', error));
}

export function renderGroupedBarplot(containerId, dataSource = "inmigracion", yColumn = "inmigrations", xColumn="year", groupColumn = "sex", colorScheme = "schemeCategory10") {
    const container = d3.select(containerId);
    container.html(''); // Limpiar el contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        // Seleccionar el conjunto de datos según el parámetro dataSource
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        if (!Array.isArray(chartData)) {
            console.error('chartData no es un array:', chartData);
            return;
        }

        // Filtrar los datos para eliminar registros no deseados
        const filteredData = chartData.filter(d =>
            d[groupColumn] !== "UNKNOWN" && d[groupColumn] !== "Other" && d[groupColumn] !== "Todas" &&
            d["country_birth"] !== "US" && d["country_birth"] !== "IN" &&
            d["country_birth"] !== "EFTA_FOR" && d["country_birth"] !== "RU" && d["country_birth_name"] !== "Europe"
        );

        console.log("Datos a enseñar en grouped barplot:", filteredData);

        // Obtener los valores únicos de los años (xColumn)
        const years = Array.from(new Set(filteredData.map(d => d[xColumn])));

        // Agrupar por año y sexo
        const groupedData = d3.rollup(filteredData, v => d3.sum(v, d => +d[yColumn]), d => d[xColumn], d => d[groupColumn]);

        // Configuración del gráfico
        const margin = { top: 10, right: 30, bottom: 40, left: 50 },
            width = 800 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // Crear el SVG
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Escala del eje X (por los años)
        const x = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.1);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSize(0));

        // Escala del eje Y (por los valores de inmigración)
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[yColumn])])
            .range([height, 0]);

        svg.append("g")
            .call(d3.axisLeft(y));

        // Escala de color para las categorías de sexo
        const color = d3.scaleOrdinal(d3[colorScheme]);

        // Ancho de las barras (se dividen entre las categorías de sexo)
        const xSubgroup = d3.scaleBand()
            .domain(["F", "M"])
            .range([0, x.bandwidth()])
            .padding(0.05);

        // Mostrar las barras agrupadas por sexo para cada año
        svg.append("g")
            .selectAll("g")
            .data(years)
            .enter()
            .append("g")
            .attr("transform", function(d) { return "translate(" + x(d) + ",0)"; })
            .selectAll("rect")
            .data(function(d) {
                return ["F", "M"].map(function(sex) {
                    const value = groupedData.get(d)?.get(sex) || 0;
                    return { key: sex, value: value };
                });
            })
            .enter().append("rect")
            .attr("x", function(d) { return xSubgroup(d.key); })
            .attr("y", function(d) { return y(d.value); })
            .attr("width", xSubgroup.bandwidth())
            .attr("height", function(d) { return height - y(d.value); })
            .attr("fill", function(d) { return color(d.key); });

    }).catch(error => console.error('Error al cargar los datos:', error));
}


export function renderGroupedBarplotEjemplo(containerId) {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor
    
        // Set the dimensions and margins of the graph
        const margin = { top: 10, right: 30, bottom: 20, left: 50 },
              width = 460 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;
    
        // Append the svg object to the body of the page
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
        // Parse the Data
        d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_stacked.csv").then(function(data) {
            // Verificar que los datos no estén vacíos
            if (!data || data.length === 0) {
                console.error("Los datos están vacíos o no se pudieron cargar.");
                return;
            }
    
            // List of subgroups = header of the csv files
            const subgroups = Object.keys(data[0]).slice(1); // Tomar las claves del primer objeto, omitiendo la primera columna
    
            // List of groups = species here = value of the first column called group -> I show them on the X axis
            const groups = d3.map(data, function(d) { return d.group; }).keys();
    
            // Verificar que los subgrupos y grupos estén definidos
            if (!subgroups || subgroups.length === 0) {
                console.error("No se encontraron subgrupos.");
                return;
            }
            if (!groups || groups.length === 0) {
                console.error("No se encontraron grupos.");
                return;
            }
    
            // Add X axis
            const x = d3.scaleBand()
                .domain(groups)
                .range([0, width])
                .padding([0.2]);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickSize(0));
    
            // Add Y axis
            const y = d3.scaleLinear()
                .domain([0, 40])  // Ajusta el dominio según el rango de tus datos
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));
    
            // Another scale for subgroup position
            const xSubgroup = d3.scaleBand()
                .domain(subgroups)
                .range([0, x.bandwidth()])
                .padding([0.05]);
    
            // Color palette = one color per subgroup
            const color = d3.scaleOrdinal()
                .domain(subgroups)
                .range(['#e41a1c', '#377eb8', '#4daf4a']); // Paleta de colores para los subgrupos
    
            // Mostrar las barras
            svg.append("g")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function(d) { return "translate(" + x(d.group) + ",0)"; })
                .selectAll("rect")
                .data(function(d) {
                    return subgroups.map(function(key) {
                        return { key: key, value: d[key] }; // Agregar el valor de la columna correspondiente a cada subgrupo
                    });
                })
                .enter().append("rect")
                .attr("x", function(d) { return xSubgroup(d.key); })
                .attr("y", function(d) { return y(d.value); })
                .attr("width", xSubgroup.bandwidth())
                .attr("height", function(d) { return height - y(d.value); })
                .attr("fill", function(d) { return color(d.key); });
        }).catch(function(error) {
            console.error("Error al cargar los datos CSV: ", error);
        });
    }

    export function renderBarplotDinamicoVertical(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "year", groupedColumn="sex", colorScheme = "schemeCategory10") {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            // Seleccionar el conjunto de datos según el parámetro dataSource
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal; // Usar los datos de emigración
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal; // Usar los datos de inmigración
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            if (!Array.isArray(chartData)) {
                console.error('chartData no es un array:', chartData);
                return;
            }
            
            // Filtramos UNKNOWN y Other
            const filteredData = chartData.filter(d => d["country_birth_region"] !== "UNKNOWN" && d["country_birth_region"] !== "Other");
    
            // Encontrar el año con el valor máximo de inmigración
            const maxInmigrations = d3.max(filteredData, d => +d[xColumn]);
            const yearWithMaxInmigrations = filteredData.find(d => +d[xColumn] === maxInmigrations)[yColumn];
    
            // Configuración del gráfico con dimensiones más grandes
            const margin = { top: 50, right: 50, bottom: 150, left: 80 },
                  width = 800 - margin.left - margin.right,
                  height = 600 - margin.top - margin.bottom;
    
            // Crear SVG
            const svg = container
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            // Escala X (ahora para las categorías)
            const x = d3.scaleBand()
                .domain(filteredData.map(d => d[yColumn])) // Nombres dinámicos en base a la columna yColumn
                .range([0, width])
                .padding(0.1);
    
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickSize(0))
                .selectAll("text")
                .style("font-size", "12px")
                .style("text-anchor", "middle")
                .style("angle", "-90px");
    
            // Escala Y (ahora para los valores)
            const y = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => +d[xColumn]) || 1]) // Máximo dinámico en base a los datos
                .range([height, 0]);
    
            svg.append("g")
                .call(d3.axisLeft(y).ticks(5))
                .selectAll("text")
                .style("font-size", "12px");
    
            // Barras (ahora verticales)
            svg.selectAll("myRect")
                .data(filteredData)
                .enter()
                .append("rect")
                .attr("x", d => x(d[yColumn]))
                .attr("y", d => y(d[xColumn]))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d[xColumn]))
                .attr("fill", d => d[yColumn] === yearWithMaxInmigrations ? "red" : "gray"); // Colorear de rojo el año con el valor máximo, los demás de gris
    
            // Añadir título al gráfico
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Ranking de ${xColumn} en ${dataSource} por ${yColumn} `);
        }).catch(error => console.error('Error al cargar los datos:', error));
    }
    
    export function renderBarplotDinamicoVerticalStacked(
    containerId, 
    dataSource = "inmigracion", 
    xColumn = "year", 
    yColumn = "inmigrations", 
    groupedColumn = "sex", 
    colorScheme = "schemeCategory10"
) {
    const container = d3.select(containerId);
    container.html(''); // Limpiar contenedor antes de agregar el gráfico

    getCachedData().then(data => {
        let chartData;
        switch (dataSource) {
            case 'emigracion':
                chartData = data.emigration.withoutTotal;
                break;
            case 'inmigracion':
                chartData = data.inmigration.withoutTotal;
                break;
            default:
                console.error('Tipo de datos desconocido:', dataSource);
                return;
        }

        // Filtrar valores inválidos
        const filteredData = chartData.filter(d => d[xColumn] !== "UNKNOWN" && d[xColumn] !== "Other");
        if (!filteredData.length) {
            console.error('No se encontraron datos válidos después del filtrado.');
            return;
        }

        // Obtener las claves para stackedData
        const keys = [...new Set(filteredData.map(d => d[groupedColumn]))];

        // Reestructurar datos para apilado
        const preparedData = d3.groups(filteredData, d => d[xColumn])
            .map(([key, values]) => {
                const aggregated = { [xColumn]: key };
                keys.forEach(k => {
                    const item = values.find(v => v[groupedColumn] === k);
                    aggregated[k] = item ? +item[yColumn] : 0;
                });
                return aggregated;
            });

        // Generar datos apilados
        const stackedData = d3.stack()
            .keys(keys)(preparedData);

        // Dimensiones del gráfico
        const svgWidth = 600, svgHeight = 400;
        const margin = { top: 20, right: 20, bottom: 50, left: 50 };
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        const svg = container.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Escalas
        const x = d3.scaleBand()
            .domain(preparedData.map(d => d[xColumn]))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal(d3[colorScheme]);

        // Dibujar barras apiladas
        g.selectAll("g")
            .data(stackedData)
            .join("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data[xColumn]))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        // Ejes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        g.append("g")
            .call(d3.axisLeft(y));
    });
}

        
    export function renderBarplotDinamicoVerticalGrouped(
        containerId, 
        dataSource = "inmigracion", 
        xColumn = "year", 
        yColumn = "inmigrations", 
        groupedColumn = "sex", 
        colorScheme = "schemeCategory10"
    ) {
        const container = d3.select(containerId);
        container.html(''); // Limpiar contenedor antes de agregar el gráfico
    
        getCachedData().then(data => {
            let chartData;
            switch (dataSource) {
                case 'emigracion':
                    chartData = data.emigration.withoutTotal;
                    break;
                case 'inmigracion':
                    chartData = data.inmigration.withoutTotal;
                    break;
                default:
                    console.error('Tipo de datos desconocido:', dataSource);
                    return;
            }
    
            const filteredData = chartData.filter(d => d["country_birth_region"] !== "UNKNOWN" && d["country_birth_region"] !== "Other");
            if (!filteredData.length) {
                console.error('No se encontraron datos válidos después del filtrado.');
                return;
            }
    
            const groupedData = d3.group(filteredData, d => d[xColumn]);
            console.log("datos agrupados:", groupedData)
            const svgWidth = 600, svgHeight = 400;
            const margin = { top: 20, right: 20, bottom: 50, left: 50 };
            const width = svgWidth - margin.left - margin.right;
            const height = svgHeight - margin.top - margin.bottom;
    
            const svg = container.append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight);
    
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
    
            const x0 = d3.scaleBand()
                .domain([...groupedData.keys()])
                .range([0, width])
                .padding(0.2);
    
            const x1 = d3.scaleBand()
                .domain([...new Set(filteredData.map(d => d[groupedColumn]))])
                .range([0, x0.bandwidth()])
                .padding(0.1);
    
            const y = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => +d[yColumn])])
                .nice()
                .range([height, 0]);
    
            const color = d3.scaleOrdinal(d3[colorScheme]);
    
            g.append("g")
                .selectAll("g")
                .data(groupedData)
                .join("g")
                .attr("transform", d => `translate(${x0(d[0])},0)`)
                .selectAll("rect")
                .data(d => d[1])
                .join("rect")
                .attr("x", d => x1(d[groupedColumn]))
                .attr("y", d => y(d[yColumn]))
                .attr("width", x1.bandwidth())
                .attr("height", d => height - y(d[yColumn]))
                .attr("fill", d => color(d[groupedColumn]));
    
            g.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x0));
    
            g.append("g")
                .call(d3.axisLeft(y));
        });
    }
    
    
export function renderBarplotDinamicoVerticalStacked2(containerId, dataSource = "inmigracion", xColumn = "inmigrations", yColumn = "year", groupedColumn = "sex", colorScheme = "schemeCategory10") {    
        // Establecer las dimensiones y márgenes del gráfico
        const margin = {top: 10, right: 30, bottom: 40, left: 50},
              width = 460 - margin.left - margin.right,
              height = 400 - margin.top - margin.bottom;
    
        // Agregar el objeto svg al contenedor de la página
        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
        // Obtener los datos desde el origen de datos
        d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_stacked.csv").then(data => {
    
            // Listado de subgrupos = los encabezados de la columna después de la primera
            const subgroups = data.columns.slice(1); // Suponiendo que la primera columna es 'group' y el resto son subgrupos
    
            // Listado de grupos = valores de la primera columna llamada 'group' -> los mostramos en el eje X
            const groups = d3.map(data, function(d) { return d.group; }).keys();
    
            // Añadir el eje X
            const x = d3.scaleBand()
                .domain(groups)
                .range([0, width])
                .padding([0.2]);
    
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).tickSizeOuter(0))
                .selectAll("text")
                .style("font-size", "12px")
                .style("text-anchor", "middle")
                .style("angle", "45deg");  // Rotar etiquetas del eje X para que se vean mejor
    
            // Añadir el eje Y
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, function(d) { return d3.sum(subgroups, function(key) { return +d[key]; }); })])
                .range([height, 0]);
    
            svg.append("g")
                .call(d3.axisLeft(y));
    
            // Paleta de colores = un color por subgrupo
            const color = d3.scaleOrdinal()
                .domain(subgroups)
                .range(d3.schemeCategory10);  // Usar una paleta de colores
    
            // Apilar los datos (stacking)
            const stackedData = d3.stack()
                .keys(subgroups)
                (data);
    
            // Mostrar las barras apiladas
            svg.append("g")
                .selectAll("g")
                .data(stackedData)
                .enter().append("g")
                .attr("fill", function(d) { return color(d.key); })
                .selectAll("rect")
                .data(function(d) { return d; })
                .enter().append("rect")
                .attr("x", function(d) { return x(d.data.group); })
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return y(d[0]) - y(d[1]); })
                .attr("width", x.bandwidth());
    
            // Añadir título al gráfico
            svg.append("text")
                .attr("x", (width + margin.left + margin.right) / 2)  // Centrar el título
                .attr("y", -20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Evolución de inmigraciones por sexo en Europa`);
        }).catch(error => {
            console.error("Error al cargar los datos CSV:", error);
        });
    }
    

export async function renderLinePlot2(containerId, xColumn = "year", yColumn = "inmigrations", groupColumn = "reporting_country_name", colorScheme = "schemeCategory10") {
        const margin = { top: 50, right: 150, bottom: 50, left: 100 },
            width = 1000 - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;
    
        const container = d3.select(containerId);
        container.html('');
    
        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        try {
            const data = await getCachedData();
            console.log('Datos cargados:', data);
    
            const chartData = data?.inmigration?.withoutTotal;
            if (!chartData || !Array.isArray(chartData)) {
                console.error('Datos de inmigración no disponibles o mal formateados:', chartData);
                return;
            }
    
            const filteredData = chartData
            //console.log('Datos filtrados:', filteredData);
    
            if (!filteredData.length) {
                console.error('No hay datos después del filtro:', filteredData);
                return;
            }
            //console.log('Ejemplo de filteredData:', filteredData[0]);
            //console.log('xColumn:', xColumn, '->', filteredData[0]?.[xColumn]);
            //console.log('groupColumn:', groupColumn, '->', filteredData[0]?.[groupColumn]);
    
            const groupedData = d3.group(filteredData, d => d[xColumn], d => d[groupColumn]);
            //console.log('Datos groupedData para el gráfico:', groupedData);
            const dataReady = Array.from(groupedData, ([year, countryMap]) => {
                return Array.from(countryMap, ([country, records]) => ({
                    year: +year,
                    country: country,
                    value: d3.sum(records, d => +d[yColumn])
                }));
            }).flat();
    
            console.log('Datos preparados para el gráfico:', dataReady);
    
            const x = d3.scaleLinear()
                .domain(d3.extent(dataReady, d => d.year))
                .range([0, width]);
    
            const y = d3.scaleLinear()
                .domain([0, d3.max(dataReady, d => d.value)])
                .range([height, 0]);
    
            if (!x.domain() || !y.domain()) {
                console.error('Las escalas no pudieron ser configuradas correctamente.');
                return;
            }
    
            const uniqueCountries = Array.from(new Set(dataReady.map(d => d.country)));
    
            const color = d3.scaleOrdinal(d3[colorScheme]).domain(uniqueCountries);
    
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    
            svg.append("g").call(d3.axisLeft(y));
    
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.value));
    
            svg.selectAll(".line")
                .data(d3.group(dataReady, d => d.country))
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("d", ([country, values]) => line(values))
                .attr("stroke", ([country]) => country === "Germany" ? "#ff0000" : "#ccc") // Color rojo para Ukraine, gris para el resto
                .style("stroke-width", ([country]) => country === "Germany" ? 4 : 2) // Más gruesa para Ukraine
                //.attr("stroke", ([country]) => color(country))
                //.style("stroke-width", 2)
                .style("fill", "none");
    
            // Añadir etiqueta solo para Germany
            svg.selectAll(".line-label")
            .data(d3.group(dataReady, d => d.country)) // Agrupar datos por país
            .enter()
            .filter(([country]) => country === "Germany" || country === "Spain") // Filtrar solo Ukraine
            .append("text")
            .datum(([country, values]) => ({
                country: country,
                lastValue: values[values.length - 1] // Último valor de la línea
            }))
            .attr("transform", d => `translate(${x(d.lastValue.year)},${y(d.lastValue.value)})`) // Posicionar al final de la línea
            .attr("x", 5) // Desplazar un poco a la derecha para que no toque la línea
            .attr("dy", "-0.5em") // Desplazar hacia arriba para que quede sobre la línea
            .style("font-size", "12px")
            .style("font-weight", d => d.country === "Germany" ? "bold" : "normal") // Destacar si es Ukraine
            .style("fill", d => d.country === "Germany" ? "#ff0000" : "#000") // Color del texto
            .text(d => d.country); // Mostrar "Germany" como texto
    
            svg.append("text")
                .attr("x", (width + margin.left) / 2)
                .attr("y", -20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text(`Evolución de inmigraciones de ${groupColumn} en Europa`);
    
        } catch (error) {
            console.error('Error al cargar los datos:', error);
        }
    }
    
    