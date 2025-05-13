#!/bin/bash

# Initialize the submodule
git submodule update --init --recursive

# Use the correct node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use

# Install dependencies for all packages
yarn install

# Install dependencies for external submodules
cd external/message-signing-snap
yarn install
