#!/bin/sh
set -e

# Remplace les placeholders par les vraies valeurs d'env au démarrage du conteneur.
# Permet de changer les URLs d'API sans rebuild.
API_USER="${VITE_API_USER:-http://localhost:5001}"
API_GED="${VITE_API_GED:-http://localhost:5000}"

find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.html" \) | while read -r file; do
    sed -i "s|__VITE_API_USER__|${API_USER}|g" "$file"
    sed -i "s|__VITE_API_GED__|${API_GED}|g" "$file"
done

echo "API_USER=${API_USER}"
echo "API_GED=${API_GED}"

exec "$@"
