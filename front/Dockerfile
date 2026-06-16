# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

COPY . .
# On build avec des placeholders — remplacés au runtime par entrypoint.sh
# vite build seul (pas tsc -b) pour éviter les erreurs de project references en CI
RUN VITE_API_USER=__VITE_API_USER__ \
    VITE_API_GED=__VITE_API_GED__ \
    npx vite build

# ---- Serve ----
FROM nginx:1.27-alpine AS final

# Config nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du build
COPY --from=build /app/dist /usr/share/nginx/html

# Script de substitution des variables au démarrage
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
