CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS releves (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326),
    categorie VARCHAR(50),
    commentaire TEXT,
    auteur VARCHAR(100),
    meteo JSONB,
    photos TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);
