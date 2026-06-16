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
cp .env.example .env   # puis renseigner vos propres valeurs
docker compose up -d
```

L'application est ensuite accessible sur [http://localhost](http://localhost).

## Secrets et configuration

Aucun secret n'est commité dans ce dépôt public. Les `appsettings.json` contiennent des
placeholders `{{POSTGRES_PASSWORD}}`, `{{MINIO_ACCESS_KEY}}`, `{{MINIO_SECRET_KEY}}`, `{{JWT_SECRET}}`
qui sont :
- remplacés par les valeurs de `.env` lors d'un lancement via `docker compose` (variables d'environnement),
- ou substitués par la pipeline CI (GitHub Actions) à partir des **GitHub Secrets** du dépôt lors du build des images.

Secrets à configurer dans *Settings → Secrets and variables → Actions* du repo GitHub :

| Secret               | Description                              |
|----------------------|-------------------------------------------|
| `POSTGRES_PASSWORD`  | Mot de passe des bases PostgreSQL          |
| `MINIO_ACCESS_KEY`   | Clé d'accès MinIO                          |
| `MINIO_SECRET_KEY`   | Clé secrète MinIO                          |
| `JWT_SECRET`         | Secret de signature des JWT (32+ caractères) |

## Documentation

Chaque sous-projet dispose de son propre fichier `CLAUDE.md` détaillant son architecture, ses endpoints et ses particularités :

- [`CLAUDE.md`](./CLAUDE.md) — vue d'ensemble du projet
- [`front/CLAUDE.md`](./front/CLAUDE.md) — frontend React
- [`back/UserManager/CLAUDE.md`](./back/UserManager/CLAUDE.md) — API authentification/utilisateurs
- [`back/GED/MediaManager/CLAUDE.md`](./back/GED/MediaManager/CLAUDE.md) — API médias/albums
- [`electron/CLAUDE.md`](./electron/CLAUDE.md) — application desktop

## Licence

Projet personnel — tous droits réservés.
