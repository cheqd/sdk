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

ORACLE_TESTS="DIDModule|DID Key Operations|OracleModule|ResourceModule"

# run oracle independent test cases
cd esm && npm run test -- --testNamePattern="^(?!${ORACLE_TESTS})" && cd ..
cd cjs && npm run test -- --testNamePattern="^(?!${ORACLE_TESTS})" && cd ..

# wait for network to compute WMA
cd localnet

WAIT_TIME=240 # seconds
INTERVAL=20
echo "Waiting for WMA to be available..."


while ! docker compose exec cheqd cheqd-noded q oracle wma CHEQ >/dev/null 2>&1; do

    if [ "$WAIT_TIME" -le 0 ]; then
        echo "Unable to compute WMA within timeout"
        exit 1
    fi

    sleep "$INTERVAL"
    WAIT_TIME=$((WAIT_TIME - INTERVAL))
done

cd ..

# run oracle dependent test cases
cd esm && npm run test -- --testNamePattern="(${ORACLE_TESTS})" && cd ..
cd cjs && npm run test -- --testNamePattern="(${ORACLE_TESTS})" && cd ..