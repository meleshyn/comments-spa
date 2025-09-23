#!/bin/sh

# Perform database migrations
echo "Running database migrations..."
npm run db:migrate

# Write the GCS credentials to the file
echo "Writing GCS credentials to the file..."
echo "$GCS_KEY_FILE_CONTENT" > /app/writable/gcs-credentials.json

# Run the main container command
echo "Starting the application..."
exec "$@"