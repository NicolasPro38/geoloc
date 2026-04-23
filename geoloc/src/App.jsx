import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const API = 'http://localhost:5010'

const COULEURS = {
  observation: '#3498db',
  anomalie: '#e74c3c',
  infrastructure: '#f39c12',
  vegetation: '#2ecc71',
  autre: '#9b59b6'
}

function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markerRef = useRef(null)
  const markersReleves = useRef([])
  const [clickedPoint, setClickedPoint] = useState(null)
  const [formData, setFormData] = useState({ categorie: 'observation', commentaire: '' })
  const [geolocError, setGeolocError] = useState(null)

  const chargerReleves = async () => {
    const res = await fetch(`${API}/api/releves`)
    const geojson = await res.json()

    markersReleves.current.forEach(m => m.remove())
    markersReleves.current = []

    geojson.features.forEach(feature => {
      const { categorie, commentaire, created_at } = feature.properties
      const [lng, lat] = feature.geometry.coordinates

      const el = document.createElement('div')
      el.style.width = '14px'
      el.style.height = '14px'
      el.style.borderRadius = '50%'
      el.style.background = COULEURS[categorie] || '#999'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        marker.togglePopup()
      })

      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
        <strong>${categorie}</strong><br/>
        ${commentaire}<br/>
        <small>${new Date(created_at).toLocaleString('fr-FR')}</small>
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current)

      markersReleves.current.push(marker)
    })
  }

  const placerMarqueur = (lng, lat) => {
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = new maplibregl.Marker({ color: '#e74c3c' })
      .setLngLat([lng, lat])
      .addTo(map.current)
    setClickedPoint({ lng, lat })
    setFormData({ categorie: 'observation', commentaire: '' })
  }

  const handleGeoloc = () => {
    setGeolocError(null)
    if (!navigator.geolocation) {
      setGeolocError('Géolocalisation non supportée par ce navigateur.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        map.current.flyTo({ center: [longitude, latitude], zoom: 16 })
        placerMarqueur(longitude, latitude)
      },
      () => setGeolocError('Impossible d\'obtenir la position GPS.')
    )
  }

  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [2.3488, 48.8534],
      zoom: 12
    })

    map.current.on('load', () => chargerReleves())

    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      placerMarqueur(lng, lat)
    })
  }, [])

  const handleSubmit = async () => {
    try {
      await fetch(`${API}/api/releves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: clickedPoint.lat,
          lng: clickedPoint.lng,
          categorie: formData.categorie,
          commentaire: formData.commentaire
        })
      })
      setClickedPoint(null)
      if (markerRef.current) markerRef.current.remove()
      chargerReleves()
    } catch (err) {
      console.error('Erreur :', err)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Bouton Ma position */}
      <button
        onClick={handleGeoloc}
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: '#2c3e50',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 10
        }}
      >
        📍 Ma position
      </button>

      {geolocError && (
        <div style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#e74c3c',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          {geolocError}
        </div>
      )}

      {/* Formulaire nouveau relevé */}
      {clickedPoint && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          width: '280px'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Nouveau relevé</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666' }}>
            {clickedPoint.lat.toFixed(5)}, {clickedPoint.lng.toFixed(5)}
          </p>

          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Catégorie</label>
          <select
            value={formData.categorie}
            onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            style={{ width: '100%', marginBottom: '12px', padding: '6px' }}
          >
            <option value="observation">Observation</option>
            <option value="anomalie">Anomalie</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="vegetation">Végétation</option>
            <option value="autre">Autre</option>
          </select>

          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Commentaire</label>
          <textarea
            value={formData.commentaire}
            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
            rows={3}
            style={{ width: '100%', marginBottom: '12px', padding: '6px', boxSizing: 'border-box' }}
            placeholder="Décris ce que tu observes..."
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSubmit} style={{ flex: 1, padding: '8px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Enregistrer
            </button>
            <button onClick={() => setClickedPoint(null)} style={{ flex: 1, padding: '8px', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
