#!/bin/bash
# Restart the Laravel PHP dev server whenever it dies.
cd /home/z/kaldi-procurement-laravel/public
export PHPRC=/home/z/.local/bin/php84.ini
export PHP_INI_SCAN_DIR=
export PHP_CLI_SERVER_WORKERS=10

while true; do
    echo "[$(date)] Starting PHP dev server..."
    /home/z/.local/bin/php84 -S 127.0.0.1:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
    EXIT=$?
    echo "[$(date)] PHP server exited with code $EXIT. Restarting in 1s..."
    sleep 1
done
