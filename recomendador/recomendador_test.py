import psycopg2
import sys

def fetch_responses_from_db(id):
    conn = psycopg2.connect(
        dbname="vizquest",
        user="ipizarro",
        password="ipizarro",
        host="localhost",
        port=5432
    )
    cursor = conn.cursor()
    query = "SELECT * FROM respuestas WHERE id = %s"
    cursor.execute(query, (id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise ValueError(f"No se encontró una fila con id = {id}")
    return row

def main():
    if len(sys.argv) != 2:
        print("Uso: python recomendador.py <id>")
        sys.exit(1)

    id = int(sys.argv[1])
    try:
        row = fetch_responses_from_db(id)
        print(f"Respuestas recuperadas: {row}")
        # Aquí puedes incluir lógica adicional de recomendación
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()