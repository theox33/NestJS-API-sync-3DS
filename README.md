# 3DS Save Sync API -- v1

Backend fiable en **NestJS** exposé en HTTPS via **Nginx Proxy
Manager**\
Stockage des sauvegardes sur **NAS Synology** via NFS\
Client final : homebrew Nintendo **3DS** (à venir)

URL publique de l'API :

    https://theo-avril.fr/api/3ds

Toutes les routes doivent être appelées par le client avec le préfixe
`/api/3ds`.

------------------------------------------------------------------------

# 🏗️ 1. Architecture complète

                ┌──────────────────────────┐
                │        Console 3DS       │
                │  (homebrew sync client)  │
                └─────────────▲────────────┘
                              HTTPS
                 https://theo-avril.fr/api/3ds
                              │
                    ┌─────────┴──────────┐
                    │ Nginx Proxy Manager│
                    │  (Raspberry Pi)    │
                    └─────────▲──────────┘
                              │ HTTP proxy
                    ┌─────────┴──────────┐
                    │   VM Proxmox       │
                    │  3ds-sync-api      │
                    │  Docker + NestJS   │
                    └─────────▲──────────┘
                              │ NFS
                    ┌─────────┴─────────┐
                    │   NAS Synology    │
                    │ /mnt/3ds-saves    │
                    └───────────────────┘

------------------------------------------------------------------------

# 🔐 2. Authentification

Toutes les routes requièrent une API key envoyée dans le header :

    x-api-key: <API_KEY>

Définie dans le fichier `.env` du backend :

    API_KEY=super-secret-key

------------------------------------------------------------------------

# 📁 3. Structure de stockage

Sauvegardes stockées suivant la convention :

    /mnt/3ds-saves/<consoleId>/<gameId>/<slot>.sav

Exemples :

    /mnt/3ds-saves/3ds-xyz/pokemon-black/slot1.sav
    /mmnt/3ds-saves/3ds-abc/zeldabotw/slot2.sav

------------------------------------------------------------------------

# 🌐 4. Endpoints

## 4.1 Health Check

    GET /saves/health

Réponse :

``` json
{"status": "ok"}
```

------------------------------------------------------------------------

## 4.2 Upload d'une sauvegarde

    POST /saves/upload
    Content-Type: multipart/form-data

Champs requis :

-   `file` : fichier binaire `.sav`
-   `gameId`
-   `consoleId`
-   `slot` (défaut : `slot1`)

Réponse :

``` json
{
  "message": "Save uploaded",
  "relativePath": "3ds-xyz/pokemon-black/slot1.sav"
}
```

------------------------------------------------------------------------

## 4.3 Lister les sauvegardes

    GET /saves/list?gameId=pokemon-black

Réponse :

``` json
{
  "files": [
    "3ds-xyz/pokemon-black/slot1.sav"
  ]
}
```

------------------------------------------------------------------------

## 4.4 Télécharger une sauvegarde

    GET /saves/download?path=3ds-xyz/pokemon-black/slot1.sav

Renvoie le fichier binaire.

------------------------------------------------------------------------

# 🖥️ 5. Installation backend (VM Proxmox)

## 5.1 Installer Docker

    sudo apt update
    sudo apt install ca-certificates curl gnupg -y
    # + repository docker + install docker-ce

Puis :

    sudo usermod -aG docker $USER

------------------------------------------------------------------------

## 5.2 Cloner le projet

    mkdir ~/3ds-sync-api
    cd ~/3ds-sync-api

Copier :

-   Dockerfile\
-   docker-compose.yml\
-   src/\
-   package.json\
-   nest-cli.json\
-   tsconfig.json

------------------------------------------------------------------------

## 5.3 Lancer le backend

    docker compose build
    docker compose up -d

Test :

    curl -H "x-api-key: <API_KEY>" http://localhost:3000/api/saves/health

------------------------------------------------------------------------

# 📡 6. Configuration Nginx Proxy Manager

Custom Location pour `theo-avril.fr/api/3ds` :

-   Location : `/api/3ds`
-   Forward IP : IP de la VM (ex. `192.168.1.50`)
-   Forward Port : `3000`
-   SSL : Let's Encrypt → Force SSL + HTTP/2
-   **Custom Nginx config :**

```{=html}
<!-- -->
```
    rewrite ^/api/3ds/?(.*)$ /api/$1 break;

------------------------------------------------------------------------

# 📱 7. Prototype de Workflow 3DS

1.  L'utilisateur configure :
    -   API URL : `https://theo-avril.fr/api/3ds`
    -   API KEY
    -   consoleId
2.  Upload :
    -   lecture du fichier sur `sdmc:/...`
    -   POST `/saves/upload`
3.  Récupération :
    -   GET `/saves/list`
    -   choix utilisateur
    -   GET `/saves/download`
4.  Écriture sur la SD.

------------------------------------------------------------------------

# 🚀 8. Plans pour la v2

Prévu :

-   Metadata des saves (taille, timestamp, hash)
-   Token par console
-   Gestion avancée des conflits
-   Compression + delta sync éventuel
-   Interface web de gestion des saves

------------------------------------------------------------------------

# © 9. Licence

Projet personnel -- libre d'utilisation pour usage privé.
