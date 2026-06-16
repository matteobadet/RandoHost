# RandoHost — Frontend

## Stack

- **React 19** + **TypeScript** + **Vite**
- **TanStack Query v5** — fetching/cache (staleTime 60s)
- **Zustand** — état global (auth + thème)
- **React Router v6** — navigation
- **Tailwind CSS** — styles
- **shadcn/ui** — composants UI
- **Lucide React** — icônes
- **Axios** — HTTP avec intercepteurs
- **Leaflet / react-leaflet** — carte GPS des médias

## Structure

```
src/
├── api/           → fonctions d'appel API (auth, media, activites, admin)
├── components/    → composants réutilisables
│   ├── Layout.tsx          → sidebar + header
│   ├── MediaGrid.tsx       → grille de médias cliquables
│   ├── MediaCard.tsx       → carte média avec actions
│   ├── AvatarBadge.tsx     → avatar + nom utilisateur
│   ├── CommentSection.tsx  → liste + ajout + suppression de commentaires
│   ├── ReactionBar.tsx     → barre d'émojis réactions (10 émojis)
│   ├── PermissionGate.tsx  → affichage conditionnel selon permissions
│   └── AvatarBadge.tsx
├── hooks/
│   └── usePermission.ts    → hooks usePermission / useHasAnyPermission
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── GalleriePage.tsx    → galerie paginée
│   ├── MediaDetailPage.tsx → détail média + uploader + réactions + commentaires
│   ├── ActivitesPage.tsx   → liste des activités/albums
│   ├── ActiviteDetailPage.tsx → détail activité + carte GPS + médias
│   ├── UploadPage.tsx
│   ├── ProfilPage.tsx      → profil + avatar
│   └── AdminPage.tsx       → panel admin (search + pagination + rôles + permissions)
├── stores/
│   ├── authStore.ts        → user + accessToken (persist localStorage)
│   └── themeStore.ts       → thème clair/sombre
└── lib/
    ├── axios.ts            → instances axios + intercepteurs 401→refresh
    └── utils.ts            → formatDate, cn()
```

## Axios

Deux instances :
- `userApi` → baseURL = `VITE_API_USER` (http://localhost/user-api)
- `gedApi`  → baseURL = `VITE_API_GED`  (http://localhost/ged-api)

Les deux ont `withCredentials: true` et les mêmes intercepteurs.

**Intercepteur 401 → refresh** : évite le deadlock en excluant les appels `/auth/refresh` eux-mêmes.

## Auth Store

```typescript
// Persisté dans localStorage sous la clé 'randohost-auth'
{ user: AuthUser | null }  // accessToken exclu de la persistence

// AuthUser contient : id, pseudo, email, role, permissions[], avatarKey?, avatarUrl?
```

**IMPORTANT** : `permissions` peut être `undefined` sur d'anciens objets localStorage.
Toujours utiliser `user?.permissions?.includes()` (double optional chaining).
Le store a une migration v1 qui force `permissions = []` si absent.

## Variables d'environnement

```
VITE_API_USER  → baseURL de l'API UserManager
VITE_API_GED   → baseURL de l'API GED
```

Ces variables sont substituées **au runtime** par `entrypoint.sh` (pas au build Vite).
Les placeholders dans le bundle sont `__VITE_API_USER__` et `__VITE_API_GED__`.

## Build / Docker

```dockerfile
# Build avec placeholders
RUN VITE_API_USER=__VITE_API_USER__ VITE_API_GED=__VITE_API_GED__ npx vite build

# Runtime : entrypoint.sh remplace les placeholders dans les .js
```

Cache-Control : `public, must-revalidate` (pas `immutable` — on substitue les URLs au runtime).

## Admin Page

- Recherche temps réel (pseudo/email) via `useMemo`
- Pagination : `PAGE_SIZE = 8`
- Rôles backend : `Admin`, `Contributor`, `ReadOnly` (pas en français)
- `ROLE_DISPLAY` map pour l'affichage : `{ Contributor: 'Contributeur', ReadOnly: 'Lecture seule' }`
- L'API retourne `effectivePermissions` → mappé en `permissions` dans `getAllUsers()`

## Headers GED

Le GED reçoit les infos utilisateur via headers HTTP :
`X-User-Id`, `X-User-Name`, `X-User-Avatar`
