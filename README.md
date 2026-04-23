# GeoLoc — Application de relevés terrain collaboratifs

Application web de saisie et visualisation de relevés terrain, conçue pour les bureaux d'études environnementales. Permet la collecte de données géolocalisées (faune, flore, habitat, pollution...) depuis n'importe quel navigateur, avec synchronisation en temps réel vers QGIS via PostGIS.

---

## Stack technique

- **Frontend** : React + MapLibre GL JS (Vite)
- **Backend** : Flask + Gunicorn
- **Base de données** : PostgreSQL 16 + PostGIS
- **Déploiement** : Docker + docker-compose
- **Intégration SIG** : Connexion native PostGIS → QGIS

---

## Fonctionnalités

- Placement de points par clic sur la carte ou géolocalisation GPS
- Formulaire de relevé : auteur, catégorie, commentaire, photos, météo automatique
- Affichage des relevés avec popups (photo, météo, horodatage)
- Suppression de points depuis la carte
- Synchronisation temps réel (polling 30s)
- Connexion QGIS native via PostGIS

---

## Prérequis

- Docker >= 20.x
- docker-compose >= 1.29
- Un navigateur moderne (Chrome, Firefox, Safari)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/NicolasPro38/geoloc.git
cd geoloc
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` pour personnaliser les identifiants de la base de données.

### 3. Lancer l'application

```bash
docker-compose up -d
```

L'application est accessible à `http://localhost:8081/geoloc/`

### 4. Arrêter l'application

```bash
docker-compose down
```

---

## Connexion QGIS

Une fois l'application lancée, connectez QGIS à la base PostGIS :

- **Hôte** : localhost (ou IP du serveur)
- **Port** : 5433
- **Base de données** : geoloc
- **Utilisateur** : geoloc
- **Mot de passe** : geoloc2024 (ou celui défini dans `.env`)

La couche `releves` contient tous les points saisis sur le terrain.
Rafraîchissez la couche dans QGIS (F5) pour voir les nouveaux relevés en temps réel.

---

## Accès tablette / mobile terrain

Depuis n'importe quel navigateur sur le réseau local :
http://[IP_DU_SERVEUR]:8081/geoloc/

---

## Auteur

Nicolas Rey Romano — Géographe / Cartographe / Géomaticien  
[Portfolio](https://cartonicolasrey.duckdns.org/portfolio/) · [LinkedIn](https://www.linkedin.com/in/nicolas-rey-5898b3116/)
