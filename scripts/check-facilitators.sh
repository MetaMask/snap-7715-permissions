#!/usr/bin/env bash
set -u

envs=("prod" "uat" "dev")

# Keep this list explicit so the output order is stable across environments.
chains=(
  "ethereum-mainnet"
  "ethereum-sepolia"
  "optimism-mainnet"
  "bsc-mainnet"
  "polygon-mainnet"
  "arbitrum-mainnet"
  "avalanche-mainnet"
  "linea-mainnet"
  "base-mainnet"
  "base-sepolia"
  "sei-mainnet"
  "monad-mainnet"
  "megaeth-mainnet"
  "tempo-mainnet"
  "tempo-testnet"
  "arc-mainnet"
)

base_url() {
  local env="$1"
  local chain="$2"

  # Production uses the public API host, while lower environments add the
  # environment name before the shared API domain.
  if [[ "$env" == "prod" ]]; then
    echo "https://tx-sentinel-${chain}.api.cx.metamask.io"
  else
    echo "https://tx-sentinel-${chain}.${env}-api.cx.metamask.io"
  fi
}

extract_addresses() {
  if command -v jq >/dev/null 2>&1; then
    # The supported endpoint groups facilitator addresses by payment kind.
    jq -r '.kinds[]?.extra.facilitatorAddresses[]?' | sort -u
  else
    # Fallback: enough for this endpoint shape, but jq is strongly preferred.
    grep -oE '0x[a-fA-F0-9]{40}' | sort -u
  fi
}

for env in "${envs[@]}"; do
  echo
  echo "## ${env}"

  for chain in "${chains[@]}"; do
    url="$(base_url "$env" "$chain")/platform/v2/x402/supported"

    # Treat request failures as empty results so one unavailable endpoint does
    # not stop the full environment/chain matrix from being checked.
    response="$(curl -fsS --max-time 10 "$url" 2>/dev/null || true)"
    addresses="$(printf '%s' "$response" | extract_addresses)"

    if [[ -z "$addresses" ]]; then
      printf '%-28s %s\n' "$chain" "-"
      continue
    fi

    printf '%-28s %s\n' "$chain" "$(printf '%s' "$addresses" | paste -sd ', ' -)"
  done
done
