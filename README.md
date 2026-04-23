# GeoLoc — Application de relevés terrain collaboratifs

> ⚠️ **Application non commerciale** — GeoLoc est un projet de démonstration technique développé dans le cadre d'un portfolio professionnel. Elle est librement utilisable à des fins personnelles ou d'évaluation, mais n'est pas destinée à un usage commercial.

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

- Docker >= 20.x et docker-compose >= 1.29 installés sur le serveur
- Un navigateur moderne sur les PC/tablettes (Chrome, Firefox, Safari)
- Selon le mode d'accès choisi (voir ci-dessous) : un réseau local ou un accès internet

---

## Modes d'accès — Réseau local vs Internet

GeoLoc peut fonctionner dans deux configurations selon les besoins du client :

### Mode réseau local (intranet)

Le serveur Docker tourne sur un ordinateur ou serveur interne à l'entreprise. Les techniciens terrain et les agents au bureau accèdent à l'application via l'adresse IP locale du serveur, uniquement lorsqu'ils sont connectés au même réseau wifi ou VPN de l'entreprise.
http://[IP_DU_SERVEUR]:8081/geoloc/

**Avantages** : données hébergées en interne, aucune exposition sur internet, contrôle total.
**Limite** : inaccessible depuis l'extérieur sans VPN.

### Mode internet (accès depuis n'importe où)

Le serveur Docker est hébergé sur un serveur exposé sur internet (VPS, serveur dédié) avec un nom de domaine configuré. Les techniciens terrain y accèdent depuis n'importe où, même en 4G.
https://votre-domaine.fr/geoloc/

**Avantages** : accès terrain en mobilité totale, aucune contrainte réseau.
**Limite** : nécessite un serveur exposé sur internet et un nom de domaine.

> Pour une démonstration publique, l'application est accessible à l'adresse :
> **https://cartonicolasrey.duckdns.org/geoloc/**

---

## Installation

### 1. Installer Docker

**Sur Ubuntu/Debian (serveur Linux) :**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**Sur Windows ou Mac :**
Télécharger et installer Docker Desktop : https://www.docker.com/products/docker-desktop

### 2. Cloner le projet

```bash
git clone https://github.com/NicolasPro38/geoloc.git
cd geoloc
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` pour personnaliser les identifiants de la base de données.

### 4. Lancer l'application

```bash
docker-compose up -d
```

L'application est accessible à `http://localhost:8081/geoloc/`

Depuis les autres machines du réseau, remplacez `localhost` par l'adresse IP du serveur.

### 5. Arrêter l'application

```bash
docker-compose down
```

---

## Mettre à jour l'application

Lorsqu'une nouvelle version est disponible :

```bash
cd geoloc
git pull
docker-compose down --remove-orphans
docker-compose up -d
```

---

## Connexion QGIS

Une fois l'application lancée, connectez QGIS à la base PostGIS :

- **Hôte** : IP du serveur (ou `localhost` si QGIS est sur la même machine)
- **Port** : 5433
- **Base de données** : geoloc
- **Utilisateur** : geoloc
- **Mot de passe** : geoloc2024 (ou celui défini dans `.env`)

La couche `releves` contient tous les points saisis sur le terrain.
Rafraîchissez la couche dans QGIS (F5) pour voir les nouveaux relevés en temps réel.

---

## Accès tablette / mobile terrain

Depuis n'importe quel navigateur, ouvrez :

- **Réseau local** : `http://[IP_DU_SERVEUR]:8081/geoloc/`
- **Internet** : `https://votre-domaine.fr/geoloc/`

L'application peut être ajoutée à l'écran d'accueil de la tablette via le menu du navigateur ("Ajouter à l'écran d'accueil").

---

## Auteur

Nicolas Rey Romano — Géographe / Cartographe / Géomaticien
Projet portfolio — non commercial

[Portfolio](https://cartonicolasrey.duckdns.org/portfolio/) · [LinkedIn](https://www.linkedin.com/in/nicolas-rey-5898b3116/)
