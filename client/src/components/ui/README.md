# shadcn/ui primitives

## Responsibility

Locally owned shadcn/ui source components, generated through the official registry and themed for CIRCA.

## Structure and boundaries

Initial primitives: button, input, badge, tabs, separator, and textarea. Theme tokens live in `../../app/globals.css`; class composition is in `../../lib/utils.ts`. No application UI is implemented here.

Preserve semantic markup, keyboard behavior, focus indicators, and registry accessibility. CIRCA uses zero-radius corners, compact uppercase labels, naval surfaces, and directional bevels. Add components from the client root using `bunx --bun shadcn@latest add <component>` and review generated changes. Verify with client lint, typecheck, and build commands.
