# shadcn/ui primitives

## Responsibility

Locally owned shadcn/ui source components, generated through the official registry and themed for CIRCA.

## Structure and boundaries

Initial primitives: button, input, badge, tabs, separator, textarea, and tooltip. Theme tokens and the shared CIRCA utilities live in `../../app/globals.css`; class composition is in `../../lib/utils.ts`. No application UI is implemented here.

Three stylesheets own the chrome this folder shares with the applications, each imported by the component or chrome that renders it:

- `menubar.css`: the Radix `Menubar` plate, trigger, panel, item, key column, and restriction marker. Imported by every application chrome that renders a menu bar.
- `message-box.css`: the portalled alert plate used by `message-box.tsx`.
- `tooltip.css`: the tooltip plate and arrow, kept in Tailwind's `utilities` layer exactly as it was when `globals.css` held it.

`tooltip.tsx` wraps the Radix tooltip in the shell's beveled plate treatment: hard outline, uppercase micro-label, hard offset shadow, and a stroked SVG arrow so no content border crosses the arrow head. Enter and exit are a 90ms 1px settle that collapses under reduced motion. A `TooltipProvider` must sit above any tooltip; the desktop shell supplies one at its root.

Preserve semantic markup, keyboard behavior, focus indicators, and registry accessibility. CIRCA uses zero-radius corners, compact uppercase labels, naval surfaces, and directional bevels. Add components from the client root using `bunx --bun shadcn@latest add <component>` and review generated changes. Verify with client lint, typecheck, and build commands.
