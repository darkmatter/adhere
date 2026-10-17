#!/bin/sh
# Installs this machine's adhere executable from the latest GitHub release in
# ~/.local/bin, replacing any already there:
#
#   curl -fsSL https://github.com/darkmatter/adhere/raw/main/scripts/install.sh | sh
#
# The release names each executable for `uname -s` and `uname -m`
# (scripts/npm-packages.ts).
set -eu

dir="$HOME/.local/bin"
url="https://github.com/darkmatter/adhere/releases/latest/download/adhere-$(uname -s)-$(uname -m)"

mkdir -p "$dir"
# Download beside it, then rename over it, so a failed update keeps the old one.
curl -fsSL -o "$dir/adhere.tmp" "$url"
chmod 755 "$dir/adhere.tmp"
mv "$dir/adhere.tmp" "$dir/adhere"
echo "Installed $dir/adhere"
