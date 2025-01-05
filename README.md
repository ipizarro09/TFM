# Trabajo Fin de Master - Master de Ciencias de Datos de la UOC 
# Automatización de la Selección de Visualizaciones de Datos para la Alfabetización de Datos (Area2: Natural Language Processing and Visual Analytics)

## Descripción

Este repositorio contiene el código de la herramienta que permite la selección de visualizaciones automática basada en reglas o en IA, en base a unas variables y respuestas a un cuestionario. 

## Miembros del equipo

El trabajo ha sido realizada de manera completa por **Inmaculada Pizarro**.

## Ficheros del código fuente

* **questionaire-app/src/App.js**: punto de entrada al programa.
* **questionaire-app/src/App.css**: estilos globales de la herramienta.
* **questionaire-app/src/components/FileUploader.js**: Componente para cargar csv y detectar tipos datos y tamaño dataset
* **questionaire-app/src/components/Questionnaire.js**: Parte dinámica del cuestionario
* **questionaire-app/src/components/VisualizationPurposeSelector.js**: Pregunta el propósito
* **questionaire-app/src/components/VisualizationContextSelector.js**: Pregunta el contexto
* **Backend/Server.js**: Gestiona con la base de datos y Python la petición de recomendación
* **Backend/recomendador/Recomendador.py**: Funciones por reglas y por IA que devuelven recomendación al backend

Visualización React.js

* **questionaire-app/public/visualization/Index.html**: Interfaz con usuario. Importa las funciones de gráficos. Informa parámetros: contenedor, selector o Colorblind.
* **questionaire-app/public/visualization/dataLoader.js**: Función para cargar datos sólo una vez. 
* **questionaire-app/public/visualization/miscomponentesd3.js**: Funciones parametrizables para renderizar gráficos.
questionaire-app/public/visualization/


## Instalación ##

Esta aplicación se basa en el uso de React.js que se instala siguiendo las instrucciones de la siguiente URL: https://www.guvi.in/blog/guide-to-install-reactjs-on-windows/


El proyecto está estructurado del siguiente modo:

- questionaire-app: frontend react.js
- backend: node.js y ficheros sql para postgresql.

Visualización interactiva D3.js:
- questionaire-app/public/visualization/





