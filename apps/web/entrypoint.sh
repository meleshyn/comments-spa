#!/bin/sh

# Root directory for static files
ROOT_DIR=/usr/share/nginx/html

# Substitute environment variables
echo "Substituting environment variables..."
for file in $ROOT_DIR/assets/*.js;
do
  sed -i 's|__VITE_API_URL__|'"${VITE_API_URL?VITE_API_URL is not set}"'|g' $file
  sed -i 's|__VITE_RECAPTCHA_SITE_KEY__|'"${VITE_RECAPTCHA_SITE_KEY?VITE_RECAPTCHA_SITE_KEY is not set}"'|g' $file
done
echo "Substitution complete."

# Run Nginx
exec "$@"