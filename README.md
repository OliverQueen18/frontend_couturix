# CouturiX — Frontend

Interface Angular 19 de **CouturiX**, la gestion intelligente de votre atelier de couture.

## Prérequis

- Node.js 22+
- Backend démarré sur http://localhost:8080

## Démarrage

```bash
npm install
npm start
```

Application : http://localhost:4200

## Identité visuelle

- Logo : `public/logo-couturix.png`
- Favicon : `public/favicon-couturix.jpg`
- Violet `#2E1052`, magenta `#E21B70`, or `#F1C453`, typographie Montserrat

## Production

Jenkins construit `oliverqueen18/couturix-frontend` et le VPS OliveApps la tire via `docker-compose.couturix.yml` (même principe que Dibidani).

Le Nginx du conteneur reverse-proxie `/api/` vers le service interne `backend`. TLS : nginx-proxy (`VIRTUAL_HOST=couturix.com`).
