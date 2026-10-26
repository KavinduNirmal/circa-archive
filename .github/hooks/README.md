# Agent editor hooks

## Responsibility and structure

`impeccable.json` runs the optional repository-local Impeccable hook after editor
changes when its script is installed.

## Boundaries and usage

This configuration belongs to agent tooling, not application runtime or CI. The
command is a no-op when the optional script is absent. Repository checks validate
this folder's documentation with `bun run check`.
