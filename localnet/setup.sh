#!/bin/bash
# shellcheck disable=SC2086

set -euox pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

function info() {
    printf "${GREEN}[info] %s${NC}\n" "${1}"
}

function err() {
    printf "${RED}[err] %s${NC}\n" "${1}"
}

function assert_network_running_comet_v38_or_above() {
    RES="$1"
    LATEST_HEIGHT=$(echo "${RES}" | jq --raw-output '.sync_info.latest_block_height')
    info "latest height: ${LATEST_HEIGHT}"

    if [[ $LATEST_HEIGHT -gt 1 ]]; then
        info "network is running"
    else
        err "network is not running"
        exit 1
    fi
}

info "Cleanup"
docker compose down --volumes --remove-orphans

info "Running cheqd network"
docker compose up -d cheqd
docker compose cp ./ cheqd:/
docker compose exec cheqd bash /cheqd/init.sh
docker compose exec -d cheqd cheqd-noded start

info "Waiting for chains"
# TODO: Get rid of this
sleep 20

info "Checking statuses"
CHEQD_STATUS=$(docker compose exec cheqd cheqd-noded status 2>&1)
assert_network_running_comet_v38_or_above "${CHEQD_STATUS}"
