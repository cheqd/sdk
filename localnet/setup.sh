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


# get latest cheqd-node beta image version, where 'develop' is included in the tag
# NOTE: switch logic to use `latest` tag to avoid circular dependency issues, if developing on SDK against stable network. Beta `cheqd-node` releases are to be used for testing transient features.
# NOTE: Transient features are features that are not yet ready for production use, but are being tested in a beta environment. These features may change or be removed in future releases.
# NOTE: Or use `develop` tag to test major dependency updates, such as Tendermint, Cosmos SDK, IBC, new modules, etc.
# NOTE: Don't forget to set prerelease to true in the release on GitHub, otherwise it won't be picked up by the script, if you are using production stable tag.
BETA_TAG=$(curl -s https://api.github.com/repos/cheqd/cheqd-node/releases | jq -r '.[] | select(.prerelease == true) | .tag_name' | grep 'develop' | sort -V | tail -n 1)

# trim v prefix from the tag
BETA_TAG=${BETA_TAG#v}

# check if BETA_TAG is empty
if [[ -z "$BETA_TAG" ]]; then
    echo "No beta release found with 'develop' in the tag."
    exit 1
fi

# set beta tag as the image version in environment variable
# temporarily bypass latest beta; use specific version for stability in tests
# CHEQD_NODE_BETA_IMAGE="ghcr.io/cheqd/cheqd-node:${BETA_TAG}"
CHEQD_NODE_BETA_IMAGE="ghcr.io/cheqd/cheqd-node:4.2.0"

echo "Using cheqd-node beta image: $CHEQD_NODE_BETA_IMAGE"

# pull the latest cheqd-node beta image
docker pull "$CHEQD_NODE_BETA_IMAGE"

# tag the image as cheqd-noded beta latest
docker tag "$CHEQD_NODE_BETA_IMAGE" cheqd-node:beta-latest

info "Running cheqd network"
docker compose up -d cheqd
docker compose cp ./ cheqd:/cheqd
docker compose exec cheqd bash /cheqd/init.sh
docker compose exec cheqd cp /cheqd/price-feeder.toml /home/cheqd/.cheqdnode
docker compose exec -d cheqd node-start


info "Waiting for chains"
# TODO: Get rid of this
sleep 20

info "Checking statuses"
CHEQD_STATUS=$(docker compose exec cheqd cheqd-noded status 2>&1)
assert_network_running_comet_v38_or_above "${CHEQD_STATUS}"

# Transfer funds to test account
docker compose exec -d cheqd cheqd-noded tx bank send validator cheqd1rnr5jrt4exl0samwj0yegv99jeskl0hsxmcz96 10000000000000000ncheq --from validator --gas auto --gas-adjustment=1.8 --fees 10000000000ncheq --chain-id cheqd --keyring-backend test -y && sleep 2
