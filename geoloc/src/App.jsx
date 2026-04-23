import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const API = 'http://localhost:5010'

const AUTEURS = [
  'Sophie Martin', 'Thomas Dupont', 'Julie Bernard', 'Marc Leblanc',
  'Camille Rousseau', 'Antoine Moreau', 'Léa Petit', 'Nicolas Girard',
  'Emma Durand', 'Paul Lambert'
]

const CATEGORIES = {
  observation: { label: 'Observation', couleur: '#3498db' },
  anomalie: { label: 'Anomalie', couleur: '#e74c3c' },
  infrastructure: { label: 'Infrastructure', couleur: '#f39c12' },
  vegetation: { label: 'Végétation', couleur: '#2ecc71' },
  autre: { label: 'Autre', couleur: '#9b59b6' }
}

const styles = {
  panel: {
    position: 'absolute',
    background: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    marginBottom: '14px',
    padding: '8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '13px',
    background: '#fafafa',
    boxSizing: 'border-box'
  }
}

function formatMeteo(meteo) {
  if (!meteo) return '<span style="color:#aaa">Météo indisponible</span>'
  return `🌡️ ${meteo.temperature}°C &nbsp; 💧 ${meteo.humidite}% &nbsp; 🔵 ${meteo.pression} hPa`
}

function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markerRef = useRef(null)
  const markersReleves = useRef([])
  const [clickedPoint, setClickedPoint] = useState(null)
  const [formData, setFormData] = useState({
    auteur: AUTEURS[0],
    categorie: 'observation',
    commentaire: '',
    photos: []
  })
  const [geolocError, setGeolocError] = useState(null)

  const chargerReleves = async () => {
    const res = await fetch(`${API}/api/releves`)
    const geojson = await res.json()

    markersReleves.current.forEach(m => m.remove())
    markersReleves.current = []

    geojson.features.forEach(feature => {
      const { categorie, commentaire, auteur, meteo, photos, created_at } = feature.properties
      const [lng, lat] = feature.geometry.coordinates
      const couleur = CATEGORIES[categorie]?.couleur || '#999'

      const el = document.createElement('div')
      el.style.cssText = `
        width: 12px; height: 12px;
        border-radius: 50%;
        background: ${couleur};
        border: 2px solid white;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      `
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        marker.togglePopup()
      })

      const photosHtml = photos && photos.length > 0
        ? photos.map(p => `<img src="${API}/uploads/${p}" style="width:100%;border-radius:4px;margin-top:6px;cursor:pointer" onclick="window.open('${API}/uploads/${p}')" />`).join('')
        : ''

      const popup = new maplibregl.Popup({ offset: 12, maxWidth: '280px' }).setHTML(`
        <div style="font-family: system-ui; font-size: 13px;">
          <div style="font-weight: 700; color: ${couleur}; text-transform: capitalize; margin-bottom: 2px;">${categorie}</div>
          <div style="color: #888; font-size: 11px; margin-bottom: 6px;">
            ${auteur || '—'} · ${new Date(created_at).toLocaleString('fr-FR')}
          </div>
          <div style="color: #333; margin-bottom: 8px;">${commentaire || '—'}</div>
          <div style="font-size: 11px; color: #666;">${formatMeteo(meteo)}</div>
          ${photosHtml}
        </div>
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
    markerRef.current = new maplibregl.Marker({ color: '#2c3e50' })
      .setLngLat([lng, lat])
      .addTo(map.current)
    setClickedPoint({ lng, lat })
    setFormData({ auteur: AUTEURS[0], categorie: 'observation', commentaire: '', photos: [] })
  }

  const handleGeoloc = () => {
    setGeolocError(null)
    if (!navigator.geolocation) {
      setGeolocError('Géolocalisation non supportée.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        map.current.flyTo({ center: [longitude, latitude], zoom: 16 })
        placerMarqueur(longitude, latitude)
      },
      () => setGeolocError('Position GPS indisponible.')
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
    const fd = new FormData()
    fd.append('auteur', formData.auteur)
    fd.append('categorie', formData.categorie)
    fd.append('commentaire', formData.commentaire)
    fd.append('lat', clickedPoint.lat)
    fd.append('lng', clickedPoint.lng)
    formData.photos.forEach(f => fd.append('photos', f))

    try {
      await fetch(`${API}/api/releves`, { method: 'POST', body: fd })
      setClickedPoint(null)
      if (markerRef.current) markerRef.current.remove()
      chargerReleves()
    } catch (err) {
      console.error('Erreur :', err)
    }
  }

  const now = new Date().toLocaleString('fr-FR')

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Titre */}
      <div style={{ ...styles.panel, top: 16, left: 16, padding: '10px 16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', letterSpacing: '0.3px' }}>GeoLoc</div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', marginBottom: '8px' }}>Relevés terrain collaboratifs</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <a href="https://cartonicolasrey.duckdns.org/portfolio/" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3498db', textDecoration: 'none' }}>🌐 Portfolio</a>
          <a href="https://github.com/NicolasPro38/geoloc" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3498db', textDecoration: 'none' }}>⌥ GitHub</a>
        </div>
      </div>

      {/* Légende */}
      <div style={{ ...styles.panel, bottom: 32, left: 16, padding: '12px 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Catégories</div>
        {Object.entries(CATEGORIES).map(([key, { label, couleur }]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: couleur, border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#333' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Bouton Ma position */}
      <button onClick={handleGeoloc} style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        padding: '10px 22px', background: '#1a1a2e', color: 'white', border: 'none',
        borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)', letterSpacing: '0.3px', zIndex: 10
      }}>
        📍 Ma position
      </button>

      {geolocError && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: '#e74c3c', color: 'white', padding: '8px 16px',
          borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap'
        }}>
          {geolocError}
        </div>
      )}

      {/* Formulaire */}
      {clickedPoint && (
        <div style={{ ...styles.panel, top: 16, right: 16, padding: '20px', width: '300px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '4px' }}>Nouveau relevé</div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', fontFamily: 'monospace' }}>
            {clickedPoint.lat.toFixed(5)}, {clickedPoint.lng.toFixed(5)}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '16px' }}>🕐 {now}</div>

          <label style={styles.label}>Auteur</label>
          <select value={formData.auteur} onChange={(e) => setFormData({ ...formData, auteur: e.target.value })} style={styles.input}>
            {AUTEURS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <label style={styles.label}>Catégorie</label>
          <select value={formData.categorie} onChange={(e) => setFormData({ ...formData, categorie: e.target.value })} style={styles.input}>
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <label style={styles.label}>Commentaire</label>
          <textarea
            value={formData.commentaire}
            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
            rows={3}
            style={{ ...styles.input, resize: 'none' }}
            placeholder="Décris ce que tu observes..."
          />

          <label style={styles.label}>Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFormData({ ...formData, photos: Array.from(e.target.files) })}
            style={{ marginBottom: '14px', fontSize: '12px', width: '100%' }}
          />
          {formData.photos.length > 0 && (
            <div style={{ marginBottom: '14px', fontSize: '11px', color: '#888' }}>
              {formData.photos.length} photo(s) sélectionnée(s)
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSubmit} style={{
              flex: 1, padding: '9px', background: '#1a1a2e', color: 'white',
              border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
            }}>Enregistrer</button>
            <button onClick={() => { setClickedPoint(null); if (markerRef.current) markerRef.current.remove() }} style={{
              flex: 1, padding: '9px', background: '#f5f5f5', color: '#555',
              border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px', cursor: 'pointer'
            }}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App