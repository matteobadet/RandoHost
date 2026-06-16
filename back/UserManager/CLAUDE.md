# RandoHost — UserManager API

API ASP.NET Core 9 de gestion des utilisateurs, authentification et permissions.

## Port Docker : 5001 (8080 en interne)

## Stack

- **ASP.NET Core 9** + **C#**
- **Entity Framework Core** + **Npgsql** (PostgreSQL)
- **JWT Bearer** auth (`System.IdentityModel.Tokens.Jwt`)
- **MinIO** / AWS SDK S3 pour les avatars
- Architecture **Clean Architecture** : Core / Infrastructure / API

## Structure

```
UserManager/
├── UserManager.Core/
│   ├── Entities/
│   │   ├── User.cs          → entité utilisateur + GetEffectivePermissions()
│   │   ├── Role.cs          → enum RoleName + class Role + static Permissions
│   │   └── RefreshToken.cs
│   └── Interfaces/
│       ├── IUserRepository.cs
│       ├── IRefreshTokenRepository.cs
│       └── IAvatarService.cs
├── UserManager.Infrastructure/
│   ├── Data/AppDbContext.cs  → seed des rôles avec DefaultPermissions
│   ├── Repositories/
│   └── Migrations/
└── UserManager.API/
    ├── Controllers/
    │   ├── AuthController.cs   → /api/auth/login|register|refresh|logout
    │   └── UsersController.cs  → /api/users (CRUD admin + /me)
    ├── Middleware/
    │   └── PermissionMiddleware.cs → [RequirePermission("xxx")] attribute
    ├── Services/
    │   ├── AuthService.cs      → LoginAsync, RefreshAsync, LogoutAsync
    │   ├── UserService.cs      → CRUD utilisateurs
    │   └── AvatarService.cs    → upload/URL avatars MinIO
    └── Program.cs
```

## Endpoints

### Auth (`/api/auth`)
| Méthode | Route      | Auth | Description                          |
|---------|-----------|------|--------------------------------------|
| POST    | /login    | ✗    | Login → accessToken + cookie refresh |
| POST    | /register | ✗    | Inscription                          |
| POST    | /refresh  | ✗    | Renouvelle le token via cookie       |
| POST    | /logout   | ✓    | Révoque le refresh token             |

### Users (`/api/users`)
| Méthode | Route              | Permission    | Description           |
|---------|--------------------|---------------|-----------------------|
| GET     | /me                | auth          | Profil personnel      |
| PUT     | /me                | auth          | Modifier profil       |
| PUT     | /me/avatar         | auth          | Uploader avatar       |
| GET     | /                  | user.manage   | Liste tous les users  |
| GET     | /{id}              | user.manage   | Détail un user        |
| PATCH   | /{id}/role         | user.manage   | Changer le rôle       |
| PATCH   | /{id}/permissions  | user.manage   | Extra/revoked perms   |
| PATCH   | /{id}/active       | user.manage   | Activer/désactiver    |
| DELETE  | /{id}              | user.manage   | Supprimer             |

## Rôles et permissions

```csharp
public enum RoleName { Admin, Contributor, ReadOnly }

// Permissions
"media.view", "media.upload", "media.edit_own", "media.delete_own",
"media.edit_any", "media.delete_any", "album.manage", "user.manage"

// Admin → toutes
// Contributor → view, upload, edit_own, delete_own
// ReadOnly → view seulement
```

`GetEffectivePermissions()` = `Role.DefaultPermissions ∪ ExtraPermissions − RevokedPermissions`

## JWT

- `MapInboundClaims = false` (IMPORTANT — sinon les claims custom sont renommés)
- `ClockSkew = TimeSpan.Zero`
- Claims : `sub` (userId), `pseudo`, `email`, `role`, `permission` (1 claim par permission)
- Access token : 15 min | Refresh token : 7 jours

## Cookie refresh_token

```csharp
// Dev : SameSite=Lax, Secure=false
// Prod : SameSite=None, Secure=true
```

**IMPORTANT** : Le cookie est posé sur le domaine qui répond (nginx proxy → `localhost`).
Ne PAS appeler `127.0.0.1:5001` directement depuis le navigateur, sinon SameSite bloque le cookie.

## Réponse login

```json
{
  "accessToken": "...",
  "user": {
    "id": "...", "pseudo": "...", "email": "...",
    "role": "Admin",
    "permissions": ["media.view", "..."],
    "avatarKey": null
  }
}
```

## Migrations EF Core

Appliquées automatiquement au démarrage (`db.Database.MigrateAsync()`).
Le seed des rôles est dans `AppDbContext.OnModelCreating` via `HasData`.

## CORS

Origines autorisées : `http://localhost:5173` (Vite dev), `http://localhost` (Docker), `app://.` (Electron).
