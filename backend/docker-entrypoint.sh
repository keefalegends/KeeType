#!/bin/sh
set -e

# Ensure SQLite database exists
if [ ! -f /var/www/html/database/database.sqlite ]; then
    touch /var/www/html/database/database.sqlite
fi

# Ensure storage directory permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Run Laravel setup
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# Start PHP-FPM or artisan serve
exec php artisan serve --host=0.0.0.0 --port=8000
