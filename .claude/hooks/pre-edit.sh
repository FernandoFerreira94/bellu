#!/usr/bin/env bash
set -e
FILE="$1"

# 1. Bloquear edição em pastas excluídas
case "$FILE" in
  */node_modules/*|*/dist/*|*/.next/*|*/build/*|*/.turbo/*|*/.nuxt/*|*/.git/*)
    echo "BLOCKED: $FILE está em pasta excluída. Confirmar com o Fernando antes."
    exit 1
    ;;
esac

# 2. Listar dependentes via grafo
echo "--- Dependentes de $FILE ---"
graphify deps "$FILE" --map .claude/graphify-map.json 2>/dev/null || echo "(grafo indisponível)"

# 3. Avisar se é arquivo de config crítico
case "$FILE" in
  *tsconfig*.json|*next.config*|*prisma/schema.prisma|*.env*)
    echo "⚠ ARQUIVO CRÍTICO — confirmar mudança com Fernando antes."
    ;;
esac
