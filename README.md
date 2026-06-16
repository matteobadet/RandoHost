# RandoHost

Application de gestion de médias (photos/vidéos) pour randonneurs — partagez vos activités, vos clichés et échangez avec votre groupe.

## Fonctionnalités

- 📸 Upload et galerie de photos/vidéos avec métadonnées GPS
- 🗺️ Carte interactive des médias géolocalisés par activité
- 👥 Gestion d'utilisateurs avec rôles (Admin, Contributeur, Lecture seule)
- 💬 Commentaires et réactions emoji sur les médias
- 🔐 Authentification JWT avec refresh token
- 🖥️ Application web et desktop (Electron)

## Architecture

Application en microservices, conteneurisée avec Docker :

```
RandoHost/
├── front/          → React 19 + Vite (SPA)
├── back/
│   ├── GED/        → API média/album — ASP.NET Core 9
│   └── UserManager/→ API auth/utilisateurs — ASP.NET Core 9
├── electron/       → Application desktop (wrapper Electron)
└── docker-compose.yml
```

### Stack technique

| Couche       | Technologies                                          |
|--------------|--------------------------------------------------------|
| Frontend     | React 19, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS |
| Backend      | ASP.NET Core 9, Entity Framework Core, JWT             |
| Base de données | PostgreSQL + PostGIS (géolocalisation)              |
| Stockage     | MinIO (S3-compatible)                                   |
| Desktop      | Electron                                                |
| Conteneurs   | Docker / Docker Compose, nginx                          |

## Démarrage rapide

Prérequis : [Docker](https://www.docker.com/) et Docker Compose installés.

```bash
git clone https://github.com/matteobadet/RandoHost.git
cd RandoHost
docker compose up -d
```

L'application est ensuite accessible sur [http://localhost](http://localhost).

## Documentation

Chaque sous-projet dispose de son propre fichier `CLAUDE.md` détaillant son architecture, ses endpoints et ses particularités :

- [`CLAUDE.md`](./CLAUDE.md) — vue d'ensemble du projet
- [`front/CLAUDE.md`](./front/CLAUDE.md) — frontend React
- [`back/UserManager/CLAUDE.md`](./back/UserManager/CLAUDE.md) — API authentification/utilisateurs
- [`back/GED/MediaManager/CLAUDE.md`](./back/GED/MediaManager/CLAUDE.md) — API médias/albums
- [`electron/CLAUDE.md`](./electron/CLAUDE.md) — application desktop

## Licence

Projet personnel — tous droits réservés.
