# RandoHost — Application Desktop (Electron)

Wrapper Electron qui charge l'application web RandoHost depuis `http://localhost` (nginx Docker).

## Principe

L'app Electron ne contient **pas** le frontend : elle pointe simplement sur `http://localhost` où tourne le container Docker nginx. Tous les cookies, sessions et requêtes fonctionnent exactement comme dans un navigateur.

Prérequis : Docker doit être lancé avec les containers RandoHost actifs.

## Structure

```
electron/
├── main.js          → processus principal Electron
├── package.json     → config + electron-builder
├── assets/
│   ├── icon.png     → icône 256×256 PNG (générée par generate-icon.js)
│   └── icon.ico     → icône Windows (générée par generate-icon.js)
├── generate-icon.js → script de génération d'icône (one-shot)
└── dist/
    ├── win-unpacked/ → app portable Windows (RandoHost.exe)
    └── ...           → installeurs générés par electron-builder
```

## Comportement au démarrage

1. Affiche une fenêtre de chargement (spinner "Démarrage de RandoHost…")
2. Tente de joindre `http://localhost` toutes les 500ms (timeout 30s)
3. Si le serveur répond → ouvre la vraie fenêtre (1280×800, min 900×600)
4. Si timeout → affiche un écran d'erreur avec bouton "Réessayer"

## Commandes

```bash
# Lancer en développement
npm start

# Builder l'installeur Windows (nécessite droits admin pour les symlinks NSIS)
npm run build:win
# Sans signature de code :
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:win

# L'exécutable portable (sans installeur) est toujours disponible dans :
dist/win-unpacked/RandoHost.exe
```

## Build Windows

Cible : `nsis` (installeur) + `zip` (portable).

**Problème connu** : `electron-builder` télécharge `winCodeSign` qui contient des symlinks macOS.
Sur Windows sans Developer Mode, l'extraction échoue → seul `win-unpacked/` est produit.
**Solution** : lancer en tant qu'administrateur, ou activer le mode développeur Windows (Paramètres → Pour les développeurs → Mode développeur).

## Menu application

- **RandoHost** : Recharger (Ctrl+R), Quitter (Ctrl+Q)
- **Affichage** : Zoom +/−/reset, Plein écran (F11), DevTools (F12)

## Liens externes

Les liens cliqués dans l'app qui ouvrent une nouvelle fenêtre sont redirigés vers le navigateur système (via `shell.openExternal`).
