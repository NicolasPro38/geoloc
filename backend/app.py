from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )

@app.route('/api/releves', methods=['GET'])
def get_releves():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, categorie, commentaire,
               ST_X(geom) as lng, ST_Y(geom) as lat,
               created_at
        FROM releves
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    features = []
    for row in rows:
        features.append({
            'type': 'Feature',
            'geometry': { 'type': 'Point', 'coordinates': [row[3], row[4]] },
            'properties': {
                'id': row[0],
                'categorie': row[1],
                'commentaire': row[2],
                'created_at': str(row[5])
            }
        })

    return jsonify({ 'type': 'FeatureCollection', 'features': features })

@app.route('/api/releves', methods=['POST'])
def add_releve():
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO releves (geom, categorie, commentaire)
        VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s)
        RETURNING id
    """, (data['lng'], data['lat'], data['categorie'], data['commentaire']))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({ 'success': True, 'id': new_id }), 201

if __name__ == '__main__':
    app.run(debug=True, port=5010)
