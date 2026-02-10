#!/usr/bin/env bash
set -euo pipefail

echo "Running custom Nextcloud config tweaks..."

php occ app:disable bruteforcesettings
php occ config:system:set ratelimit.protection.enabled --type bool --value=false
php occ config:system:set auth.bruteforce.protection.enabled --type bool --value=false

echo "Custom config done."
