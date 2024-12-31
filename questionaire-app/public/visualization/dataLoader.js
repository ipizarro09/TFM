// dataLoader.js

export function loadData() {
    return new Promise((resolve, reject) => {
        Promise.all([
            d3.dsv(";", "./datasets/Population_emigration_indicators_s.csv", d3.autoType),
            d3.dsv(";", "./datasets/Population_inmigration_indicators.csv", d3.autoType)
        ]).then(([emigration, inmigration]) => {
            // Filtramos datos para in-migración sin totales
            const filtered_data_inmi_wo_total = inmigration.filter(d => 
                d.age !== 'TOTAL' && d.sex !== 'T' && d.country_birth !== 'TOTAL' && d.inmigrations > 5
            );

            //console.log("Inmigration data:", inmigration);
            //console.log("Emigration data:", emigration);
            // nueva columna 'inmigrations_log' usando Math.log1p para algunas visualizaciones
            filtered_data_inmi_wo_total.forEach(d => {
                d.inmigrations_log = Math.log1p(d.inmigrations); // Transforma 'inmigrations' logaritmicamente
                d.death_log = Math.log1p(d.death);
                d.jan_log = Math.log1p(d.jan);
            });

            // chqueo la nueva columna
            //console.log("Datos con logaritmo de inmigraciones:", filtered_data_inmi_wo_total);


            // Filtro datos para emigración sin totales
            const filtered_data_emig_wo_total = emigration.filter(d => 
                d.age !== 'TOTAL' && d.sex !== 'T' && d.country_birth !== 'TOTAL' && d.emigrations > 5
            );

            filtered_data_emig_wo_total.forEach(d => {
                d.emigrations_log = Math.log1p(d.emigrations); // Transforma 'enmigrations' logaritmicamente
            });

            // Filtro datos para in-migración solo con totales
            const filtered_data_inmi_only_total = inmigration.filter(d => 
                d.age === 'TOTAL' && d.sex === 'T' && d.country_birth === 'TOTAL' && d.inmigrations > 5
            );

            // Filtro datos para emigración solo con totales
            const filtered_data_emig_only_total = emigration.filter(d => 
                d.age === 'TOTAL' && d.sex === 'T' && d.country_birth === 'TOTAL' && d.emigrations > 5
            );

            //  los datos en la consola
            //console.log("Inmigration without total:", filtered_data_inmi_wo_total);
            //console.log("Emigration without total:", filtered_data_emig_wo_total);
            // console.log("Inmigration only total:", filtered_data_inmi_only_total);
            // console.log("Emigration only total:", filtered_data_emig_only_total);

            // respuesta con los todos atos completos
            resolve({
                inmigration: {
                    withoutTotal: filtered_data_inmi_wo_total,
                    onlyTotal: filtered_data_inmi_only_total
                },
                emigration: {
                    withoutTotal: filtered_data_emig_wo_total,
                    onlyTotal: filtered_data_emig_only_total
                },
                // Se puede devolver dataset completo 
                //inmigrationComplete: inmigration,
                //emigrationComplete: emigration
            });
        }).catch(error => {
            reject(error);
            console.error("Error loading data:", error);
        });
    });
}

