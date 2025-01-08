import psycopg2
import sys
from sklearn.preprocessing import LabelEncoder
import numpy as np
import pandas as pd
import pickle
import json

'''Obtención respuestas desde la bbdd para pasar a los recomendadores'''

def fetch_responses(id):
    # Conexión a PostgreSQL
    conn = psycopg2.connect(
        dbname="vizquest",
        user="ipizarro",
        password="ipizarro",
        host="localhost",
        port=5432,
        options="-c client_encoding=UTF8"
    )
    cursor = conn.cursor()

    # Obtenemos las respuestas datos por ID
    cursor.execute("SELECT * FROM respuestas WHERE id = %s", (id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise ValueError(f"Responses not found for the ID {id}")

    return {
            'n_dimensiones': row[1] ,
            'tipo_datos': row[2],
            'ordenadas': row[3],
            'n_grupos_alto': row[4],
            'relacion': row[5],
            'obs_grupo': row[6],
            'proposito': row[7],
            'dataset_size': row[8],
            'contexto': row[9]
        }

'''Recomendador por reglas'''

def recommend_rule(data):
    tipo_datos = data.get('tipo_datos')
    n_dimensiones = data.get('n_dimensiones')
    ordenadas = data.get('ordenadas')
    proposito = data.get('proposito')
    dataset_size = data.get('dataset_size')
    contexto = data.get('contexto')
    relacion = data.get('relacion')
    n_grupos_alto = data.get('n_grupos_alto')
    obs_grupo = data.get('obs_grupo')
    
    if tipo_datos == 'Numeric':
        if n_dimensiones == '1D':
            if proposito == 'Distribution':
                if dataset_size in ['Small', 'Medium']:
                    return 'Histograma'
                elif dataset_size == 'Big':
                    return 'Density plot'

        elif n_dimensiones == '2D':
            if ordenadas == 'No':
                if dataset_size in ['Small', 'Medium']:
                    if proposito == 'Distribution':
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return 'Histograma'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Boxplot'
                    elif proposito == 'Correlation':
                        return 'Scatter'
                elif dataset_size == 'Big':
                    if proposito == 'Distribution':
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return 'Density plot'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Violin plot'                    
                    elif proposito == 'Correlation':
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return '2D Density plot'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Scatter with marginal point'                        
            elif ordenadas == 'Yes':
                if proposito == 'Correlation':
                    return 'Connected scatterplot'
                elif proposito == 'Evolution':
                    return 'Line plot'

        elif n_dimensiones == '3D':
            if ordenadas == 'No':
                if proposito == 'Distribution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Boxplot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Violin plot'
                elif proposito == 'Correlation':
                    return 'Bubble plot'
            elif ordenadas == 'Yes':
                if proposito == 'Evolution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Line plot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Area plot'

        elif n_dimensiones == '3D+':
            if ordenadas == 'No':
                if proposito == 'Distribution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Boxplot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        if dataset_size == 'Big':
                            return 'Ridge line'
                        else:
                            return 'Violin plot'
                elif proposito == 'Correlation':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Correlogram'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Heatmap'
                elif proposito == 'Part-to-whole' and relacion == 'Subgroup': # no cambiar a nested pues es una pregunta dinamica para estos casos
                    if dataset_size == 'Small':
                        return 'Dendrograma'
                    elif contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Circular packing'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Treemap'
            elif ordenadas == 'Yes':
                if proposito == 'Evolution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Line plot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Area plot'

    elif tipo_datos == 'Categorical':
        if n_dimensiones == '1D':
            if proposito == 'Ranking':
                if dataset_size == 'Big':
                    return 'Wordcloud'
                elif contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                    return 'Lollipop'
                elif contexto in ['Technical presentation', 'Technical report']:
                    return 'Barplot'
            elif proposito == 'Part-to-whole':
                if relacion == 'Subgroup': # no cambiar a nested pues es una pregunta dinamica para estos casos
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Circular packing'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Treemap'
                else:
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Doughnut'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Waffle'

        elif n_dimensiones in ['2D', '3D', '3D+']:
            if n_dimensiones in ['2D', '3D'] and relacion == 'Independent' and proposito == 'Part-to-whole':
                return 'Venn diagram' # añadir en caso de ser 3D+ podemos usar UpSet plot
            elif relacion == 'Nested':
                if proposito == 'Part-to-whole':
                    if dataset_size == 'Small':
                        return 'Dendrograma'
                    elif contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Circular packing'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Treemap'
                elif proposito == 'Ranking':
                    return 'Barplot'
            elif relacion == 'Subgroup':
                if proposito == 'Correlation':
                    if n_grupos_alto == 'No':
                        return 'Grouped scatterplot'
                    else:
                        return 'Heatmap'
                elif proposito == 'Ranking':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Lollipop'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Parallel plot'
                elif proposito == 'Part-to-whole':
                    if n_grupos_alto == 'Yes':
                        return 'Stacked barplot'
                    else:
                        return 'Grouped barplot'
                elif proposito == 'Flow':
                    return 'Sankey diagram'
            elif relacion == 'Adjacency':
                if proposito == 'Flow':
                    if dataset_size == 'Big':
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return 'Network'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Chord'
                    else:
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return 'Sankey diagram'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Arc'
                elif proposito == 'Correlation':
                    return 'Heatmap'
                
    elif tipo_datos == '1NUM1CAT':
        if obs_grupo == 'One':
            if proposito == 'Distribution':
                return 'Boxplot'
            elif proposito == 'Ranking':
                if dataset_size == 'Big':
                    return 'Wordcloud'
                else:
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Lollipop'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Barplot'
            elif proposito == 'Part-to-whole': 
                if relacion == 'Subgroup': # no cambiar a nested pues es una pregunta dinamica para estos casos
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Circular packing'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Treemap'
                else:
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Doughnut'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Waffle'
        else:  # obs_grupo != 'One'
            if proposito == 'Distribution':
                if dataset_size in ['Small', 'Medium']:
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Histograma'
                    else:
                        return 'Boxplot'
                elif dataset_size == 'Big':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Density plot'
                    else:
                        return 'Ridge line'

    elif tipo_datos == '1CAT+2+NUM':
        if obs_grupo == 'Several':
            if ordenadas == 'No':
                if proposito == 'Distribution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Boxplot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Violin plot'
                elif proposito == 'Correlation':
                    if dataset_size == 'Big':
                        return '2D Density plot'
                    else:
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return 'Grouped scatterplot'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Correlogram'
            else:  # ordenadas != 'No'
                if proposito == 'Evolution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Line plot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Area plot'
                elif proposito == 'Correlation':
                    return 'Connected scatterplot'
        elif obs_grupo == 'One':
            if proposito == 'Correlation':
                if n_grupos_alto == 'No':
                    return 'Grouped scatterplot'
                else:
                    return 'Heatmap'
            elif proposito == 'Ranking':
                if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                    return 'Lollipop'
                elif contexto in ['Technical presentation', 'Technical report']:
                    return 'Parallel plot'
            elif proposito == 'Part-to-whole':
                if n_grupos_alto == 'Yes':
                    return 'Stacked barplot'
                else:
                    return 'Grouped barplot'
            elif proposito == 'Flow':
                return 'Sankey diagram'

    elif tipo_datos == '1NUM2+CAT':
        if relacion == 'Subgroup':
            if obs_grupo == 'One':
                if proposito == 'Correlation':
                    if n_grupos_alto == 'No':
                        return 'Grouped scatterplot'
                    else:
                        return 'Heatmap'
                elif proposito == 'Ranking':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Lollipop'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Parallel plot'
                elif proposito == 'Part-to-whole':
                    if n_grupos_alto == 'Yes':
                        return 'Stacked barplot'
                    else:
                        return 'Grouped barplot'
                elif proposito == 'Flow':
                    return 'Sankey diagram'
            elif obs_grupo == 'Several':
                if proposito == 'Distribution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Boxplot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Violin plot'

        elif relacion == 'Nested':
            if obs_grupo == 'One':
                if proposito == 'Part-to-whole':
                    if dataset_size == 'Small':
                        return 'Dendrograma'
                    else:
                        if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                            return 'Circular packing'
                        elif contexto in ['Technical presentation', 'Technical report']:
                            return 'Treemap'
                elif proposito == 'Ranking':
                    return 'Barplot'
            elif obs_grupo == 'Several':
                if proposito == 'Distribution':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Boxplot'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Violin plot'

        elif relacion == 'Adjacency':
            if proposito == 'Flow':
                if dataset_size == 'Big':
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Network'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Chord'
                else:
                    if contexto in ['Exploration', 'Non technical report', 'Non technical presentation']:
                        return 'Sankey diagram'
                    elif contexto in ['Technical presentation', 'Technical report']:
                        return 'Arc'
            elif proposito == 'Correlation':
                return 'Heatmap'
                

    return 'No suggestion available'

'''Recomendador IA'''

# Función para sugerir tipo de gráfico for IA
def recommend_AI(features, modelo, label_encoder_y, encoders, required_columns):
    input_data = []
    for col in required_columns:
        if col in features:
            value = features[col]

            # Verificamos si la característica es categórica y usar el codificador adecuado
            if col in encoders:  # Si existe un encoder para la columna
                if pd.isna(value) or value not in encoders[col].classes_:
                    raise ValueError(f"Valor inválido o no visto en la columna '{col}': {value}")
                # Codificamos la característica
                encoded_value = encoders[col].transform([value])[0]
                input_data.append(encoded_value)
            else:
                # Si la columna no es categórica, simplemente la agregamos
                input_data.append(value)
        else:
            raise ValueError(f"Falta la característica '{col}' en las características proporcionadas.")
    
    input_array = np.array(input_data).reshape(1, -1)
    predicted = modelo.predict(input_array)
    #return input_array
    return label_encoder_y.inverse_transform(predicted)[0]

'''Llamada pasando id y ejecucion funciones'''

if __name__ == "__main__":
    id = sys.argv[1]  # Obtener el ID de las respuestas desde los argumentos de la línea de comandos
    try:
        responses = fetch_responses(id)
        # obtenemos la recomendacion por reglas según las respuestas del cuestionario que recogemos de la bbdd
        recommendation_rule = recommend_rule(responses)

        required_columns = [ 'n_dimensiones' ,
            'tipo_datos',
            'ordenadas',
            'n_grupos_alto',
            'relacion',
            'obs_grupo',
            'proposito',
            'dataset_size',
            'contexto']  # Definir las columnas requeridas
        # prediccion usando modelo entrenado y guardado
        model_path = r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\XGBOOST_F.sav"
        encoder_path = r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\feature_encoders.sav"
        label_encoder_path = r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\label_encoder_y.sav"
        # Cargamos el modelo entrenado con pickle
        loaded_model = pickle.load(open(model_path, 'rb'))
        # Cargamos también los encoders que se usaron para las caracteristicas
        encoders = pickle.load(open(encoder_path, 'rb'))
        label_encoder_y = pickle.load(open(label_encoder_path, 'rb'))
        # obtenemos la recomendacion por IA según las respuestas del cuestionario que recogemos de la bbdd
        recommendation_ai = recommend_AI(responses,loaded_model, label_encoder_y, encoders, required_columns)

        # Empaquetamos ambas recomendaciones en un diccionario
        recommendations = {
            "rule_based": recommendation_rule,
            "ai_based": recommendation_ai
        }

        # Convertimos el diccionario a JSON y lo imprimimos para enviarlo de vuelta a node.js
        print(json.dumps(recommendations))

        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
