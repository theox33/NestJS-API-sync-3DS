# 3DS Save Sync API -- v1

Backend : NestJS (Node.js)\
Stockage : NAS Synology monté en NFS sur `/mnt/3ds-saves`\
Accès public (via Nginx Proxy Manager) :

    https://theo-avril.fr/api/3ds

Toutes les routes ci-dessous sont **préfixées** par `/api/3ds` côté
client 3DS.

## 1. Authentification

L'API utilise une **API key** partagée (V1 simple).

``` http
x-api-key: <API_KEY>
```

## 2. Organisation des données

### 2.1. Arborescence

    <BASE_PATH>/<consoleId>/<gameId>/<slot>.sav

Exemple :

    /mnt/3ds-saves/3ds-xyz/pokemon-black/slot1.sav

### 2.2. relativePath

Format renvoyé par l'API : `3ds-xyz/pokemon-black/slot1.sav`

## 3. Endpoints

### 3.1 Health

`GET /saves/health`

### 3.2 Upload

`POST /saves/upload` (multipart/form-data)

Champs : - file - gameId - consoleId - slot (optionnel)

### 3.3 List

`GET /saves/list?gameId=...`

### 3.4 Download

`GET /saves/download?path=<relativePath>`

## 4. Flow client 3DS

1.  Configure API URL + API key
2.  Upload : POST /saves/upload
3.  List : GET /saves/list
4.  Download : GET /saves/download

## 5. Variables d'environnement

    API_KEY=...
    SAVES_BASE_PATH=/mnt/3ds-saves

## 6. Limitations

-   Pas de timestamps
-   Pas de multi-tokens
-   Pas de gestion de conflits
