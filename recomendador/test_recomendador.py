import subprocess

# Probar el recomendador.py pasando un ID válido
def test_recomendador():
    id_test = 100001  # Cambia este ID por uno válido en tu base de datos
    try:
        # Ejecutar el script recomendador.py con el ID de prueba
        result = subprocess.run(['python', 'recomendador_test.py', str(id_test)],
                                capture_output=True, text=True)

        # Mostrar la salida de la ejecución
        print("Salida del recomendador:")
        print(result.stdout)
        print("Errores:")
        print(result.stderr)

        if result.returncode == 0:
            print("Prueba exitosa.")
        else:
            print("Hubo un error en el recomendador.")
    except Exception as e:
        print(f"Error al ejecutar recomendador.py: {e}")

if __name__ == '__main__':
    test_recomendador()
