#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_ROOT_DIR="${ROOT_DIR}/env/${2}"
SETUP_DIR="${ENV_ROOT_DIR}/setup"

load_env () {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    # shellcheck disable=SC1090
    source "$env_file"
  else
    echo "Missing environment file: $env_file"
    exit 1
  fi
}

load_env "${ENV_ROOT_DIR}/.env"
load_env "${SETUP_DIR}/setup"

case "$1" in
  "bootstrap")
    echo "########################################"
    echo "Bootstrapping: $2"
    echo "########################################"

    k6 run "${ROOT_DIR}/packages/k6-tests/artifacts/_seeds-up-k6.js"
    ;;
  "run")
    RESULT_DIR="${ENV_ROOT_DIR}/result"
    mkdir -p "$RESULT_DIR"

   for setup in $(find "$SETUP_DIR"/setup_* | sort -V); do
      echo "########################################"
      echo "# RUN: $2 - $(basename "$setup")"
      echo "########################################"

      # shellcheck disable=SC1090
      source "$setup"

      k6 run "${ROOT_DIR}/packages/k6-tests/artifacts/koko-platform-000-mixed-ramping-k6.js" \
              --summary-export "${RESULT_DIR}/$(basename "$setup").json" \
              --log-output file="${RESULT_DIR}/$(basename "$setup").log"
    done
    ;;
  *)
    echo "Invalid command. Use 'setup' or 'run'."
    exit 1
    ;;
esac
