# RandoHost — Contexte global

Application de gestion de médias (photos/vidéos) pour randonneurs, déployée en microservices Docker.

## Architecture

```
RandoHost/
├── front/          → React 19 + Vite (SPA, port 80 via nginx)
├── back/
│   ├── GED/        → API média/album ASP.NET Core 9 (port 5000)
│   └── UserManager/→ API auth/users ASP.NET Core 9 (port 5001)
├── electron/       → App desktop Electron (charge http://localhost)
└── docker-compose.yml
```

## Services Docker

| Service          | Image              | Port hôte | Usage                          |
|------------------|--------------------|-----------|--------------------------------|
| `front`          | nginx:1.27-alpine  | 80        | SPA React + proxy vers les API |
| `ged-api`        | build local        | 5000      | Gestion médias, albums         |
| `user-api`       | build local        | 5001      | Auth, utilisateurs, rôles      |
| `postgres-ged`   | postgis/postgis    | 5434      | BDD mediamanager               |
| `postgres-users` | postgres:16        | 5433      | BDD usermanager                |
| `minio`          | minio/minio        | 9000/9001 | Stockage objet S3-compatible   |

## Proxy nginx (IMPORTANT)

Les deux API sont proxifiées via nginx pour éviter les problèmes de cookies SameSite :
- `/user-api/` → `http://user-api:8080/`
- `/ged-api/`  → `http://ged-api:8080/`

Les URLs côté frontend (substituées au runtime par `entrypoint.sh`) :
- `VITE_API_USER = http://localhost/user-api`
- `VITE_API_GED  = http://localhost/ged-api`

## Authentification

- **JWT Bearer** avec `MapInboundClaims = false`, `ClockSkew = TimeSpan.Zero`
- **Access token** : 15 min, stocké en mémoire (Zustand)
- **Refresh token** : 7 jours, cookie HttpOnly `refresh_token` (SameSite=Lax en dev)
- Cookie posé sur le domaine `localhost` (via le proxy nginx)
- Intercepteur axios : 401 → refresh → retry ; deadlock évité par `url.includes('/auth/refresh')`
- `restoreSession()` au démarrage avec AbortController timeout 5s

## Rôles et permissions

```
Admin       → toutes les permissions
Contributor → media.view, media.upload, media.edit_own, media.delete_own
ReadOnly    → media.view
```

Permissions disponibles : `media.view`, `media.upload`, `media.edit_own`, `media.delete_own`, `media.edit_any`, `media.delete_any`, `album.manage`, `user.manage`

Les permissions sont embarquées dans le JWT (`claim "permission"`) et vérifiées par `PermissionMiddleware.cs`.

## BDD

- **mediamanager** (PostGIS) : Media, Albums, AlbumMedia, Comments, Reactions
- **usermanager** (Postgres) : Users, Roles, RefreshTokens
- Migrations EF Core via `db.Database.MigrateAsync()` au démarrage
- Migration manuelle appliquée : `20260615200000_AddUploaderCommentsReactions`

## MinIO

- Bucket `media` (fichiers uploadés), bucket `avatars` (photos de profil)
- URLs internes → `http://minio:9000`, URLs publiques → `http://localhost:9000`
- Presigned URLs pour accès temporaire aux fichiers privés

## Commandes utiles

```bash
# Démarrer tous les services
docker compose up -d

# Rebuild uniquement le front (après modif frontend)
docker compose up -d --build front

# Rebuild uniquement une API
docker compose up -d --build ged-api
docker compose up -d --build user-api

# Voir les logs
docker compose logs -f front
docker compose logs -f user-api

# Accès BDD directement
docker exec randohost-postgres-users-1 psql -U postgres -d usermanager
docker exec randohost-postgres-ged-1   psql -U postgres -d mediamanager
```

## Problèmes connus / solutions appliquées

- **IPv6 Windows Docker** : utiliser `127.0.0.1` au lieu de `localhost` pour les ports exposés
- **SameSite cookie** : résolu via proxy nginx (même origine)
- **Cache navigateur** : `Cache-Control: public, must-revalidate` (pas `immutable`)
- **usePermission crash** : `user?.permissions?.includes()` (double optional chaining)
- **VITE_ env vars** : substituées au runtime par `entrypoint.sh`, pas au build
