#!/usr/bin/env bash
set -e
FILE="$1"

# Pular arquivos irrelevantes
case "$FILE" in
  *.env|*.lock|*lock.json|*.log|*/node_modules/*) exit 0 ;;
esac

# Atualizar nó no grafo (incremental)
graphify update --file "$FILE" --map .claude/graphify-map.json 2>/dev/null || true
