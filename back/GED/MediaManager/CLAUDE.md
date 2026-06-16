# RandoHost — GED API (MediaManager)

API ASP.NET Core 9 de gestion des médias (photos/vidéos), albums/activités, commentaires et réactions.

## Port Docker : 5000 (8080 en interne)

## Stack

- **ASP.NET Core 9** + **C#**
- **Entity Framework Core** + **Npgsql** + **PostGIS** (géolocalisation GPS)
- **MinIO** / AWS SDK S3 pour les fichiers médias
- Architecture **Clean Architecture** : Core / Infrastructure / API

## Structure

```
MediaManager/
├── MediaManager.Core/
│   └── Entities/
│       ├── Media.cs         → fichier média + coordonnées GPS (PostGIS Point)
│       ├── Album.cs         → activité/album
│       ├── AlbumMedia.cs    → liaison Album ↔ Media
│       ├── Comment.cs       → commentaire sur un média
│       └── Reaction.cs      → réaction emoji sur un média
├── MediaManager.Infrastructure/
│   ├── Data/AppDbContext.cs
│   └── Repositories/
└── MediaManager.API/
    ├── Controllers/
    │   ├── MediaController.cs  → /api/media
    │   └── AlbumController.cs  → /api/album
    └── Program.cs
```

## Endpoints

### Media (`/api/media`)
| Méthode | Route                         | Description                          |
|---------|-------------------------------|--------------------------------------|
| GET     | /                             | Liste paginée (?page=1&pageSize=20)  |
| GET     | /{id}                         | Détail + presigned URL               |
| POST    | /upload                       | Upload fichier (multipart/form-data) |
| PATCH   | /{id}                         | Modifier titre/description           |
| DELETE  | /{id}                         | Supprimer                            |
| GET     | /{id}/comments                | Liste commentaires                   |
| POST    | /{id}/comments                | Ajouter commentaire                  |
| DELETE  | /{id}/comments/{commentId}    | Supprimer commentaire                |
| GET     | /{id}/reactions               | Liste réactions groupées             |
| POST    | /{id}/reactions               | Toggle réaction emoji                |

### Album (`/api/album`)
| Méthode | Route                              | Description               |
|---------|------------------------------------|---------------------------|
| GET     | /                                  | Liste albums/activités    |
| GET     | /{id}                              | Détail + médias           |
| POST    | /                                  | Créer album               |
| PATCH   | /{id}                              | Modifier album            |
| POST    | /{albumId}/media/{mediaId}         | Ajouter média à album     |
| DELETE  | /{albumId}/media/{mediaId}         | Retirer média d'album     |
| DELETE  | /{id}                              | Supprimer album           |

## Authentification

L'API GED ne valide PAS le JWT directement. Elle reçoit les infos utilisateur via **headers HTTP** injectés par le frontend :

```
X-User-Id     → UUID de l'utilisateur connecté
X-User-Name   → Pseudo
X-User-Avatar → URL de l'avatar
```

Ces headers sont envoyés automatiquement par les instances axios du frontend.

## GPS / PostGIS

Les médias peuvent avoir des coordonnées GPS extraites des métadonnées EXIF lors de l'upload.
Stockées sous forme de `Point` PostGIS (longitude = X, latitude = Y).

## MinIO / Stockage

- Bucket : `media`
- Upload → clé unique générée, stockée en BDD
- Presigned URLs pour les GET (accès temporaire)
- Réécriture d'URL : interne `minio:9000` → public `localhost:9000`

## Base de données (mediamanager — PostGIS)

Tables principales :
- `Media` — id, filename, contentType, storageKey, title, description, location (Point), uploadedById, uploadedByName, uploadedByAvatar, createdAt
- `Albums` — id, name, description, lieu, date
- `AlbumMedia` — albumId, mediaId (liaison N-N)
- `Comments` — id, mediaId (FK cascade), authorId, authorName, authorAvatar, content, createdAt
- `Reactions` — id, mediaId (FK cascade), authorId, emoji, createdAt (unique sur mediaId+authorId+emoji)

## Migration manuelle appliquée

`20260615200000_AddUploaderCommentsReactions` — ajout des colonnes uploader sur Media + tables Comments et Reactions.
Appliquée directement en SQL (pas via `dotnet ef`) car le fichier Designer.cs était absent.
