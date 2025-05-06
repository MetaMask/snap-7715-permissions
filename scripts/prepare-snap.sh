#!/bin/bash

# Check if the submodule directory exists
if [ ! -d "./external/message-signing-snap" ]; then
  echo "Submodule not found. Initializing..."
  git submodule update --init --recursive
else
  echo "Submodule already present. Skipping initialization."
fi

# Use the correct node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use

# Install dependencies for all packages
yarn install

# Install dependencies for external submodules
cd external/message-signing-snap
yarn install
