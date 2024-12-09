#!/usr/bin/env python
# coding: utf-8

# In[116]:


import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import pickle
import sys 
import datetime
import time
import xgboost as xgb
from sklearn.model_selection import GridSearchCV
from matplotlib import pyplot as plt
import numpy as np
import scipy.stats as stats
from sklearn.model_selection import cross_val_score
from sklearn.metrics import accuracy_score
import seaborn as sns
from matplotlib import pyplot as plt
from imblearn.over_sampling import SMOTE


# Cargar el dataset desde un archivo Excel
file_path =  r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\Dataset_entrenamiento_recomendador.xlsx"
df = pd.read_excel(file_path)

print(df)

# Comprobar las columnas esperadas

expected_columns = ['CASO','Nº dimensiones', 'Tipo de datos', 'Ordenadas', 'Nº grupos alto', 'Relacion entre variables', 
                    'Observacion por grupo', 'Proposito', 'Tamano dataset', 'Contexto', 'Gráfico']
if not all(col in df.columns for col in expected_columns):
    raise ValueError(f"El archivo debe contener las columnas: {', '.join(expected_columns)}")

# Separar características (X) y etiqueta objetivo (y)
X = df[expected_columns[1:-1]].copy()  # Todas las columnas excepto 'Gráfico' y 'Caso'
y = df['Gráfico'].copy()  # Columna objetivo


# In[164]:


# desde postgresql

import psycopg2
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import pickle
import sys 
import datetime
import time
import xgboost as xgb
from sklearn.model_selection import GridSearchCV


def fetch_dataset():
    # Conexión a PostgreSQL en mi pc local
    try:
        conn = psycopg2.connect(
            dbname="vizquest",
            user="ipizarro",
            password="ipizarro",
            host="localhost",
            port=5432,
            options="-c client_encoding=UTF8"
        )
        cursor = conn.cursor()

        # SQL para obtener los datos para entrenar el modelo
        cursor.execute("SELECT * FROM DATASET_ENTRENAMIENTO_GRAFICOS")
        rows = cursor.fetchall()

        # Cogemos los nombres de las columnas
        column_names = [desc[0] for desc in cursor.description]

        # Cierro conexión
        cursor.close()
        conn.close()

        # Crear DataFrame
        df = pd.DataFrame(rows, columns=column_names)
        return df

    except psycopg2.Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        sys.exit(1)

# Cargar dataset
df = fetch_dataset()
#print(df)

expected_columns = ['caso','n_dimensiones', 'tipo_datos', 'ordenadas', 'n_grupos_alto', 'relacion', 
                    'obs_grupo', 'proposito', 'dataset_size', 'contexto', 'grafico_recomendado']
if not all(col in df.columns for col in expected_columns):
    raise ValueError(f"El archivo debe contener las columnas: {', '.join(expected_columns)}")

# Separamos características (X) y etiqueta objetivo (y)
X = df[expected_columns[1:-1]].copy()  # Todas las columnas excepto 'Gráfico' y 'Caso'
y = df['grafico_recomendado'].copy()  # Columna objetivo es grafico_recomendado

#print(df['grafico_recomendado'])
#print(y)


# In[165]:


#Preparación de datos I - División datos en Train & Test
from sklearn.model_selection import train_test_split

# Division Train (66%) y Test (33%)
# Dividir los datos en conjuntos de entrenamiento y prueba con stratify para tener todas las clases en ambos subconjuntos
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.33, random_state=42,stratify=y)


# In[158]:


# visualizamos las clases antes del oversampling en el conjunto de training
import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)
from matplotlib import pyplot as plt
import seaborn as sns

print('Dimensiones de todo el conjunto de datos', X.shape)
# la variable objetivo debe ser categórica no numérica para ver la tabla de frecuencias
df['grafico_recomendado'] = df['grafico_recomendado'].astype('category')
frec_clase = df['grafico_recomendado'].astype('category').value_counts().reset_index()
frec_clase.columns = ['clase', 'frecuencia']
total_obs = len(df)
frec_clase['porcentaje'] = np.round((frec_clase['frecuencia']/total_obs)*100,2)
#print(frec_clase)
# Grafica la frecuencia de cada clase
plt.figure(figsize=(30, 20))
ax = sns.barplot(data=frec_clase, x='frecuencia', y='clase', palette='viridis')
ax.bar_label(ax.containers[0], fontsize=12)
#plt.xlabel('Frecuencia', fontsize=8)
#plt.ylabel('Clase', fontsize=8)
plt.title('Frecuencia por clase', fontsize=14)
plt.show()


# In[159]:


#preparación de datos II

#oversampling usando oversampling pues solo duplica y no introduce nueva lógica
#creo datos sintéticos sobremuestreando para balancear el número de observaciones en cada clase

from imblearn.over_sampling import RandomOverSampler

# instanciación de objeto RandomOverSampler
oversampler = RandomOverSampler(random_state=24)

# sobremuestreamos el dataset de entrenamiento
X_train_resampled, y_train_resampled = oversampler.fit_resample(X_train, y_train)

#valores antes de reemplazar atributos en el dataset
print('Dimensiones de Conjunto Original Train', X_train.shape)

# dataframe con la variable objetivo en train
y_train_df = pd.DataFrame(y_train, columns=['grafico_recomendado'])
# Contar las frecuencias de las clases
frec_clase = y_train_df['grafico_recomendado'].astype('category').value_counts().reset_index()
frec_clase.columns = ['clase', 'frecuencia']
#print(frec_clase)
total_obs = len(X_train)
frec_clase['porcentaje'] = np.round((frec_clase['frecuencia']/total_obs)*100,2)

# Grafica la frecuencia de cada clase
plt.figure(figsize=(30, 20))
ax = sns.barplot(data=frec_clase, x='frecuencia', y='clase', palette='viridis')
ax.bar_label(ax.containers[0], fontsize=7)
#plt.xlabel('Frecuencia', fontsize=12)
#plt.ylabel('Clase', fontsize=8)
plt.title('Frecuencia por clase en Train sin sobremuestreo', fontsize=14)
plt.show()

print('Dimensiones de Training con sobremuestreo', X_train_resampled.shape)
# la variable objetivo en tes
y_train_resampled_df = pd.DataFrame(y_train_resampled, columns=['grafico_recomendado'])
# Contar las frecuencias de las clases
frec_clase = y_train_resampled_df['grafico_recomendado'].astype('category').value_counts().reset_index()
frec_clase.columns = ['clase', 'frecuencia']
#print(frec_clase)
total_obs = len(X_train_resampled)
frec_clase['porcentaje'] = np.round((frec_clase['frecuencia']/total_obs)*100,2)

# Grafica la frecuencia de cada clase
plt.figure(figsize=(30, 20))
ax = sns.barplot(data=frec_clase, x='frecuencia', y='clase', palette='viridis')
ax.bar_label(ax.containers[0], fontsize=7)
#plt.xlabel('Frecuencia', fontsize=12)
#plt.ylabel('Clase', fontsize=8)
plt.title('Frecuencia por clase en Train con sobremuestreo', fontsize=14)
plt.show()


# In[167]:


# preparación de datos III - codificamos las caracteristicas
from sklearn.preprocessing import LabelEncoder

X_train_resampled_encoded = X_train_resampled.copy()

encoders = {}
for col in X_train_resampled.columns:
    encoder = LabelEncoder()
    X_train_resampled_encoded.loc[:, col] = encoder.fit_transform(X_train_resampled[col])
    encoders[col] = encoder

label_encoder_y = LabelEncoder()
y_train_resampled_encoded = label_encoder_y.fit_transform(y_train_resampled)

#Aplicamos las mismas transformaciones al conjunto de prueba

X_test_encoded = X_test.copy()

for col, encoder in encoders.items():
    X_test_encoded.loc[:, col] = encoder.transform(X_test[col])

y_test_encoded = label_encoder_y.transform(y_test)

#print(X_train_resampled)
#print(X_train_resampled_encoded)
#print(y_test)
#print(y_test_encoded)


# In[168]:


import xgboost as xgb
import pandas as pd
import time
import datetime
import pickle
from sklearn.metrics import accuracy_score
import json

def to_string(l):
  s = ' '
  for ele in l:
    s = s + ' '.join(str(ele))
  return(s)

def format_importance(importance):
    """
    Formateamos la importancia de las características como un dataframe.
    """
    importance_df = pd.DataFrame(importance, columns=["Feature Importance", "Feature"])
    importance_df = importance_df.sort_values(by="Feature Importance", ascending=False)
    return importance_df

def build_output(duracion, accuracy, importance_df, parametros):
    """
    Construyo un dataframe con la salida del modelo.
    """
    # Crea una tabla bien formateada con los resultados
    df = pd.DataFrame({
        'Fecha_Lanzamiento': [datetime.datetime.now()],
        'Accuracy': [accuracy],
        'Tiempo_Ejecucion': [duracion],
        'Modelo': ['XGBoost']
    })
    return df

def train_pred(X, Xtra, ytra, Xtest, ytest):
    """
    Entrena el modelo XGBoost y calcula métricas y resultados.
    """
    # Inicializa el modelo y mide el tiempo de ejecución
    clf = xgb.XGBClassifier()
    start = time.time()
    clf.fit(Xtra, ytra)
    duracion = time.time() - start

    # Predicciones
    y_pred = clf.predict(Xtest)

    # Cálculo de Accuracy
    accuracy = accuracy_score(ytest, y_pred.round(), normalize=True)

    # Importancia de características
    names = X.columns
    importance = sorted(zip(clf.feature_importances_, names), reverse=True)
    importance_df = format_importance(importance)

    # Parámetros del modelo
    parametros = clf.get_params(deep=True)

    return duracion, accuracy, clf, importance_df, parametros

# Entrenamiento con XGBoost
dur, accuracy, clf, importance, parametros = train_pred(
    X, X_train_resampled_encoded, y_train_resampled_encoded, X_test_encoded, y_test_encoded
)

# Guardar el modelo entrenado
pickle.dump(clf, open(r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\XGBOOST_F.sav", 'wb'))

if 'encoders' in globals() and 'label_encoder_y' in globals():
    # Guardar encoders de las características
    with open(r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\feature_encoders.sav", 'wb') as encoders_file:
        pickle.dump(encoders, encoders_file)
    # Guardar encoder de las etiquetas
    with open(r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\label_encoder_y.sav", 'wb') as label_encoder_file:
        pickle.dump(label_encoder_y, label_encoder_file)  
else:
    print("Encoders o label_encoder_y no están definidos.")

# Construir la tabla de salida
df_modelo_f = build_output(dur, accuracy, importance, parametros)

# Mostrar los resultados en un formato legible
print("Resultados del Modelo XGBoost:")
print(df_modelo_f)

'''
print("\Parámetros del modelo:")
print(json.dumps(parametros, indent=2))
'''

# Muestro la tabla de importancia de características
print("\nImportancia de Características:")
print(importancef)


# In[169]:


# prediccion usando modelo entrenado y guardado

model_path = r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\XGBOOST_F.sav"
encoder_path = r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\feature_encoders.sav"
label_encoder_path = r"C:\Users\34617\Documents\MASTER_DATA_SCIENCE\TFM\recomendador_AI\label_encoder_y.sav"

# Cargar el modelo con pickle
loaded_model = pickle.load(open(model_path, 'rb'))

# Cargar los encoders
encoders = pickle.load(open(encoder_path, 'rb'))
label_encoder_y = pickle.load(open(label_encoder_path, 'rb'))

# Evaluar el modelo
y_pred = loaded_model.predict(X_test_encoded)
print("Reporte de clasificación:")
print(classification_report(y_test_encoded, y_pred, target_names=label_encoder_y.classes_))

# Función para sugerir tipo de gráfico
def suggest_chart(features, modelo):
    input_data = []
    for col in X.columns:
        if col in features:
            value = features[col]
            if pd.isna(value) or value not in encoders[col].classes_:
                raise ValueError(f"Valor inválido o no visto en la columna '{col}': {value}")
            input_data.append(encoders[col].transform([value])[0])
        else:
            raise ValueError(f"Falta la característica '{col}' en las características proporcionadas.")
    
    # Convertir a DataFrame con las columnas de X para que coincidan con las características entrenadas
    input_data = pd.DataFrame([input_data], columns=X.columns)
    
    predicted = modelo.predict(input_data)
    return label_encoder_y.inverse_transform(predicted)[0]


# Ejemplo de uso
example_features = {
    'n_dimensiones': '2D',
    'tipo_datos': 'Numeric',
    'ordenadas': 'No',
    'n_grupos_alto': 'Not applicable',
    'relacion': 'Not applicable',
    'obs_grupo': 'Not applicable',
    'proposito': 'Distribution',
    'dataset_size': 'Medium',
    'contexto': 'Technical presentation'
}

suggested_chart = suggest_chart(example_features,loaded_model)
print(f"El gráfico sugerido es: {suggested_chart}")


# In[174]:


# Evaluacion modelo

import numpy as np
import pandas as pd
import pickle
import seaborn as sns
import matplotlib.pyplot as plt
get_ipython().run_line_magic('matplotlib', 'inline')
import matplotlib.ticker as ticker
import warnings
warnings.filterwarnings('ignore', message='^.*will change.*$', category=FutureWarning)

modelo=clf
titulo='XGBoost'

df_scores = pd.DataFrame()

if 'df_scores' not in globals():
    df_scores = pd.DataFrame(columns=['Model', 'Accuracy', 'Precision','Recall', 'Specificity', 'F1 Score', 'Avg CV Accuracy', 'Standard Deviation of CV Accuracy'])

def plot_matrizconfusion(titulo, cm):
    # La figura y los ejes
    fig, ax = plt.subplots(figsize=(12, 10))  # Aumentamos el tamaño de la figura

    # matriz de confusión como una imagen
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)

    # barra de color
    fig.colorbar(im, ax=ax)

    # número de clases (número de ticks)
    n_clases = cm.shape[0]

    # etiquetas de los ejes (usamos las etiquetas originales)
    ax.set(yticks=np.arange(n_clases),
           xticks=np.arange(n_clases),
           yticklabels=np.unique(y_test),  # Etiquetas reales
           xticklabels=np.unique(y_test))  # Etiquetas reales

    # Rotar las etiquetas del eje X para que se vean verticales
    plt.xticks(rotation=90, ha='center')

    # Ajustar la posición de las etiquetas de los ejes
    ax.xaxis.set_major_locator(ticker.IndexLocator(base=1, offset=0.5))
    ax.yaxis.set_major_locator(ticker.IndexLocator(base=1, offset=0.5))

    # iteramos ahora sobre los valores de la matriz de confusión y para añadirlos como texto en cada celda
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, str(cm[i, j]), ha='center', va='center', color='black', fontsize=8)

    # Etiquetas
    plt.xlabel('Etiquetas Predichas')
    plt.ylabel('Etiquetas Verdaderas')
    plt.title(f'Matriz de Confusión {titulo}')

    # Ajustar los márgenes para evitar que las etiquetas se corten
    plt.tight_layout()

    plt.show()


def entrenamiento_prediccion_evaluacion(modelo,titulo,accuracy_cv,accuracy_cv_std,X_train,y_train,X_test,y_test):

  #entrenamiento
  modelo.fit(X_train,y_train)
  # predicción en set test
  y_test_pred = modelo.predict(X_test)
  # predicción en set training
  y_train_pred = modelo.predict(X_train)

  # calculo de matriz de confusión
  cm = metrics.confusion_matrix(y_test.squeeze(), y_test_pred.squeeze())

  n_clases=cm.shape[0]

  tp = np.zeros(n_clases)
  fp = np.zeros(n_clases)
  fn = np.zeros(n_clases)
  tn = np.zeros(n_clases)
  specificity = []
  fpr = dict()
  tpr = dict()
  roc_auc = dict()

  for i in range(n_clases):
    tp[i] = cm[i, i]
    print(f"True positive clase  {titulo} " , i, ":", tp[i])
    fp[i] = np.sum(cm[:, i]) - tp[i]
    print(f"False positive clase {titulo} " , i, ":",fp[i])
    fn[i] = np.sum(cm[i, :]) - tp[i]
    print(f"False negative clase {titulo} " , i, ":",fn[i])
    tn[i] = np.sum(cm) - tp[i] - fp[i] - fn[i]
    print(f"True negative clase {titulo} " , i, ":",tn[i],"\n")
    spe = tn[i] / (tn[i] + fp[i])
    specificity.append(spe)

  # calculamos las métricas principales para train
  accuracy = metrics.accuracy_score(y_train, y_train_pred) # fracción de clasificaciones correctas
  f1 = metrics.f1_score(y_train, y_train_pred, average='macro') # media ponderada o media armonizada
  prec = metrics.precision_score(y_train, y_train_pred, average='macro', zero_division=0) # fracción de positivos que son correctos TP / TP + FP
  recall = metrics.recall_score(y_train, y_train_pred, average='macro') # francción de verdaderos positivos (sensibilidad) TP / TP + FN

  print(f"Accuracy set train {titulo} =  {accuracy:.2%}")
  print(f"Precisión set train {titulo}   =  {prec:.2%}")
  print(f"Recall set train {titulo} =   {recall:.2%} ")
  print(f"F1 score set train {titulo}   =  {f1:.2%}")
  print("\n")

  # calculamos las métricas principales para test
  accuracy = metrics.accuracy_score(y_test, y_test_pred) # fracción de clasificaciones correctas
  f1 = metrics.f1_score(y_test, y_test_pred, average='macro') # media ponderada o media armonizada
  prec = metrics.precision_score(y_test, y_test_pred, average='macro', zero_division=0) # fracción de positivos que son correctos TP / TP + FP
  recall = metrics.recall_score(y_test, y_test_pred, average='macro') # francción de verdaderos positivos (sensibilidad) TP / TP + FN
  specificity_avg = np.mean(specificity) # francción de verdaderos negativos (specificity) tn / (tn + fp)

  print(f"Accuracy set test {titulo} =  {accuracy:.2%}")
  print(f"Precisión set test {titulo}   =  {prec:.2%}")
  print(f"Recall set test {titulo} =   {recall:.2%}")
  print(f"Specificity set test {titulo} =  {specificity_avg:.2%}")
  print(f"F1 score set test {titulo}   =  {f1:.2%}")
  print("\n")

  lscores = [(accuracy, prec, recall, specificity_avg, f1, accuracy_cv, accuracy_cv_std)]

  global df_scores
  if 'df_scores' not in globals():
    df_scores = pd.DataFrame(columns=['Model', 'Accuracy', 'Precision', 'Recall', 'Specificity', 'F1 Score', 'Avg CV Accuracy', 'Standard Deviation of CV Accuracy'])

  nuevoregistro = pd.DataFrame(data=lscores, columns=['Accuracy', 'Precision', 'Recall', 'Specificity', 'F1 Score', 'Avg CV Accuracy', 'Standard Deviation of CV Accuracy'])
  nuevoregistro.insert(0, 'Model', titulo)
  df_scores = pd.concat([df_scores, nuevoregistro], ignore_index=True)

  print(f"Training MSE {titulo} = %f" % metrics.mean_squared_error(y_train_resampled_encoded, y_train_pred))
  print(f"Test MSE {titulo} = %f" % metrics.mean_squared_error(y_test, y_test_pred))
  print("\n")
  print("Resumen scores modelos")
  print(df_scores)

  plot_matrizconfusion(titulo, cm)



entrenamiento_prediccion_evaluacion(modelo,titulo,accuracy_cv,accuracy_cv_std,X_train_resampled_encoded, y_train_resampled_encoded, X_test_encoded, y_test_encoded)



# In[180]:


# Integracion con Herramienta 

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

# Cargar el modelo con pickle
loaded_model = pickle.load(open(model_path, 'rb'))
# Cargar los encoders
encoders = pickle.load(open(encoder_path, 'rb'))
label_encoder_y = pickle.load(open(label_encoder_path, 'rb'))

# Función para sugerir tipo de gráfico
def recommend_AI(features, modelo, label_encoder_y, encoders, required_columns):
    input_data = []
    for col in required_columns:
        if col in features:
            value = features[col]

            # Verificar si la característica es categórica y usar el codificador adecuado
            if col in encoders:  # Si existe un encoder para la columna
                if pd.isna(value) or value not in encoders[col].classes_:
                    raise ValueError(f"Valor inválido o no visto en la columna '{col}': {value}")
                # Codificar la característica
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


# Ejemplo de uso
example_features = {
    'n_dimensiones': '2D',
    'tipo_datos': 'Numeric',
    'ordenadas': 'No',
    'n_grupos_alto': 'Not applicable',
    'relacion': 'Not applicable',
    'obs_grupo': 'Not applicable',
    'proposito': 'Distribution',
    'dataset_size': 'Medium',
    'contexto': 'Technical presentation'
}

suggested_chart = recommend_AI(example_features,loaded_model,label_encoder_y, encoders, required_columns)
print(f"El gráfico sugerido es: {suggested_chart}")


# In[ ]:




