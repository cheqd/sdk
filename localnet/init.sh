#!/bin/bash
# shellcheck disable=SC2086

set -euox pipefail

# sed in MacOS requires extra argument
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_EXT='.orig'
else
  SED_EXT=''
fi

# get latest cheqd-node beta image version, where 'develop' is included in the tag
BETA_TAG=$(curl -s https://api.github.com/repos/cheqd/cheqd-node/releases | jq -r '.[] | select(.prerelease == true) | .tag_name' | grep 'develop' | sort -V | tail -n 1)

# trim v prefix from the tag
BETA_TAG=${BETA_TAG#v}

# check if BETA_TAG is empty
if [[ -z "$BETA_TAG" ]]; then
  echo "No beta release found with 'develop' in the tag."
  exit 1
fi

# set beta tag as the image version in environment variable
CHEQD_NODE_BETA_IMAGE="ghcr.io/cheqd/cheqd-node:${BETA_TAG}"

echo "Using cheqd-node beta image: $CHEQD_NODE_BETA_IMAGE"

# pull the latest cheqd-node beta image
docker pull "$CHEQD_NODE_BETA_IMAGE"

# tag the image as cheqd-noded beta latest
docker tag "$CHEQD_NODE_BETA_IMAGE" cheqd-node:beta-latest

CHAIN_ID="cheqd"

# Node
cheqd-noded init node0 --chain-id "$CHAIN_ID"
NODE_0_VAL_PUBKEY=$(cheqd-noded tendermint show-validator)

# User
echo 'success claw flock lecture soul photo jump pause sadness enter uncle stage cherry teach inside now fun fuel oval angry unveil horn tobacco penalty' | cheqd-noded keys add cheqd-user --keyring-backend test --recover

CONFIG_TOML="$HOME/.cheqdnode/config/config.toml"

# Config
sed -i $SED_EXT 's|minimum-gas-prices = ""|minimum-gas-prices = "50ncheq"|g' "$HOME/.cheqdnode/config/app.toml"
sed -i $SED_EXT 's|addr_book_strict = true|addr_book_strict = false|g' "${CONFIG_TOML}"
sed -i $SED_EXT 's/timeout_propose = "3s"/timeout_propose = "500ms"/g' "${CONFIG_TOML}"
sed -i $SED_EXT 's/timeout_prevote = "1s"/timeout_prevote = "500ms"/g' "${CONFIG_TOML}"
sed -i $SED_EXT 's/timeout_precommit = "1s"/timeout_precommit = "500ms"/g' "${CONFIG_TOML}"
sed -i $SED_EXT 's/timeout_commit = "5s"/timeout_commit = "2s"/g' "${CONFIG_TOML}"
sed -i $SED_EXT 's/log_level = "info"/log_level = "debug"/g' "${CONFIG_TOML}"
sed -i $SED_EXT 's/"voting_period": "172800s"/"voting_period": "12s"/' "$HOME/.cheqdnode/config/genesis.json"
sed -i $SED_EXT 's/"expedited_voting_period": "86400s"/"expedited_voting_period": "10s"/' "$HOME/.cheqdnode/config/genesis.json"

# shellcheck disable=SC2086
sed -i $SED_EXT 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|g' "$HOME/.cheqdnode/config/config.toml"
sed -i $SED_EXT 's|address = "localhost:9090"|address = "0.0.0.0:9090"|g' "$HOME/.cheqdnode/config/app.toml"
sed -i $SED_EXT 's|log_level = "error"|log_level = "info"|g' "$HOME/.cheqdnode/config/config.toml"

# Genesis
GENESIS="$HOME/.cheqdnode/config/genesis.json"
sed -i $SED_EXT 's/"stake"/"ncheq"/' "$GENESIS"

cheqd-noded genesis add-genesis-account cheqd-user 1000000000000000000ncheq --keyring-backend test
cheqd-noded genesis gentx cheqd-user 10000000000000000ncheq --chain-id $CHAIN_ID --pubkey "$NODE_0_VAL_PUBKEY" --keyring-backend test

cheqd-noded genesis collect-gentxs
cheqd-noded genesis validate-genesis

# set default output format to json
cheqd-noded config set client output json
