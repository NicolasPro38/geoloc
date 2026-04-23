from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import uuid
import urllib.request
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_db():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )

def get_meteo(lat, lng):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,surface_pressure&wind_speed_unit=kmh"
        with urllib.request.urlopen(url, timeout=5) as r:
            data = json.loads(r.read())
        c = data['current']
        return {
            'temperature': c.get('temperature_2m'),
            'humidite': c.get('relative_humidity_2m'),
            'pression': c.get('surface_pressure')
        }
    except:
        return None

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/releves', methods=['GET'])
def get_releves():
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, auteur, categorie, commentaire, meteo, photos,
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
            'geometry': { 'type': 'Point', 'coordinates': [row['lng'], row['lat']] },
            'properties': {
                'id': row['id'],
                'auteur': row['auteur'],
                'categorie': row['categorie'],
                'commentaire': row['commentaire'],
                'meteo': row['meteo'],
                'photos': row['photos'] or [],
                'created_at': str(row['created_at'])
            }
        })

    return jsonify({ 'type': 'FeatureCollection', 'features': features })

@app.route('/api/releves', methods=['POST'])
def add_releve():
    auteur = request.form.get('auteur')
    categorie = request.form.get('categorie')
    commentaire = request.form.get('commentaire')
    lat = float(request.form.get('lat'))
    lng = float(request.form.get('lng'))

    meteo = get_meteo(lat, lng)

    photo_paths = []
    for f in request.files.getlist('photos'):
        if f.filename:
            ext = os.path.splitext(f.filename)[1].lower()
            filename = f"{uuid.uuid4().hex}{ext}"
            f.save(os.path.join(UPLOAD_FOLDER, filename))
            photo_paths.append(filename)

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO releves (geom, auteur, categorie, commentaire, meteo, photos)
        VALUES (ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        lng, lat, auteur, categorie, commentaire,
        json.dumps(meteo) if meteo else None,
        photo_paths if photo_paths else None
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({ 'success': True, 'id': new_id }), 201

@app.route('/api/releves/<int:id>', methods=['DELETE'])
def delete_releve(id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM releves WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({ 'success': True })

if __name__ == '__main__':
    app.run(debug=True, port=5010)
