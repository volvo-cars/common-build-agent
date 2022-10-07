#!/bin/sh

set -ex

SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/.."

rm -rf node_modules
npm install
npx @houdiniproject/noticeme -u
