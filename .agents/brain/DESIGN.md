---
name: C.I.R.C.A. Tactical Institutional OS
colors:
  surface: '#0c141e'
  surface-dim: '#0c141e'
  surface-bright: '#323a45'
  surface-container-lowest: '#070f18'
  surface-container-low: '#141c26'
  surface-container: '#18202a'
  surface-container-high: '#232b35'
  surface-container-highest: '#2d3540'
  on-surface: '#dbe3f1'
  on-surface-variant: '#c3c6cf'
  inverse-surface: '#dbe3f1'
  inverse-on-surface: '#29313c'
  outline: '#8d9198'
  outline-variant: '#43474e'
  surface-tint: '#aac9f1'
  primary: '#aac9f1'
  on-primary: '#0e3252'
  primary-container: '#82a1c7'
  on-primary-container: '#153758'
  inverse-primary: '#426183'
  secondary: '#b2c8eb'
  on-secondary: '#1b314e'
  secondary-container: '#354a68'
  on-secondary-container: '#a4badd'
  tertiary: '#ffb68c'
  on-tertiary: '#532200'
  tertiary-container: '#ea8442'
  on-tertiary-container: '#5b2700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#aac9f1'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#29496a'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#b2c8eb'
  on-secondary-fixed: '#031c37'
  on-secondary-fixed-variant: '#334865'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#753400'
  background: '#0c141e'
  on-background: '#dbe3f1'
  surface-variant: '#2d3540'
typography:
  headline-xl:
    fontFamily: DM Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.04em
  headline-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.03em
  body-lg:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  body-md:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-md:
    fontFamily: DM Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: DM Sans
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 11px
    letterSpacing: 0.1em
spacing:
  gutter: 0.5rem
  margin: 0.5rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

The design system channels the clandestine, bureaucratic authority of an institutional containment terminal circa 1999–2003. It merges the austere utility of early Unix workstation environments (Motif, XFCE 3, GNOME 1.x) with the classified protocols of a covert administrative commission. Every interface element communicates state-controlled operation: deliberate, functional, dense, and unadorned by consumer-facing embellishments.

The visual style merges **Tactile Institutional Skeuomorphism** with **Retro Bureaucratic Brutalism**:
- **Tactile Chamfers & Bevels:** Hard-edged, directional light bevels emulate early X11 window managers and chunky physical workstation consoles.
- **Data-Dense Layouts:** Screen real estate is packed with system metrics, classification stamps, incident reference codes, and workspace pagers.
- **CRT & Phosphor Subtlety:** Muted blue-grey phosphors replace common hacker-green tropes. Scanline overlays, subdued bloom on high-priority status nodes, and recessed data cells ground the interface in physical cathode-ray hardware.
- **Classified Redactions:** Incident status bars and clearance notices prioritize redactions, clearance seals, and unyielding status hierarchies over friendliness.

## Colors

The palette is anchored in naval steel, chilled slates, and faded phosphor blue, punctuated by strict bureaucratic warning tones.

### Palette Architecture
- **Terminal Canvas (`#0d131a`):** Deep abyssal naval slate. Used exclusively for CRT background canvas, root workspace surfaces, and inactive terminal buffers.
- **Surfaces & Recesses (`#151d27`, `#1b2636`):** The primary container layers. Used for window client areas, data tables, and pane viewports.
- **Bevels & Elevation (`#24334a`, `#3a4f6d`):** Architectural boundary lines. Active bevel light sources, panel borders, and segmented grid guides.
- **Cool Phosphor Accents (`#526e94`, `#82a1c7`, `#a4c2e6`):** Primary reading contrast. Used for focused window title bars, active tab text, critical telemetry readouts, and primary interactives.
- **Hazard Amber (`#d97736`, `#b85d19`):** Containment breaches, advisory notices, unresolved corrective actions, and system overrides.
- **Redacted Crimson (`#8a2b2b`, `#5c1d1d`):** Incident Level 4/5 clearances, quarantine locks, kill-switch triggers, and censored document blocks.

### Contrast Application
- Never use pure `#ffffff`. All high-visibility text maxes out at `#a4c2e6` or pale zinc `#c8d6e5` to preserve the worn phosphor aesthetic.
- Inactive chrome relies on low-contrast steel pairings (`#3a4f6d` over `#151d27`) to direct operational focus to active window viewports.

## Typography

The typography is strictly sans-serif, utilitarian, and engineered for high-density legibility under simulated low-resolution raster environments.

### Rules of Usage
- **Case Conventions:** All labels, classification headers, window bar titles, table headers, and taskbar indicators must be set in full **UPPERCASE**.
- **Tabular Figures:** All numeric displays, timestamps, and metric listings enforce tabular lining (`font-feature-settings: "tnum" 1`) to ensure column rigidity.
- **Tracking:** Micro-labels (`label-sm`, `label-md`) must feature expanded letter-spacing (`0.06em` to `0.1em`) to mimic early mechanical vector rendering and bitmap screen printers.
- **Line Heights:** Tightly constrained line heights prevent unnecessary vertical drift, supporting dense layouts typical of Unix incident desks.

## Layout & Spacing

The layout philosophy mirrors an authenticated multi-window workstation operating under an X-Window System root canvas.

### Layout Model
- **Dense Grid Alignment:** Spacing adheres to a rigid 4px/8px modular unit. Whitespace is treated as wasted workstation capability; density is prioritized.
- **Fixed System Shell:** 
  - **Top/Bottom Panel:** Constant `28px` height containing the system badge, workspace switcher (Desktops [1][2][3][4]), pinned task items, clock, and classification badge.
  - **Window Frame:** Standardized `22px` title bar with explicit `1px` structural boundary gutters.
- **Window Management Layout:** Overlapping, draggable window viewports arranged dynamically or tiled across a 12-column sub-grid within active workspaces.

### Form Factor Reflow
- **Desktop (Primary Workstation Target):** Multi-window free-float canvas with active workspace pagination and fixed desktop icons along the left vertical rail.
- **Tablet / Constrained Terminals:** Windows auto-snap into a 2-column split-pane (50/50 or 70/30) with workspace pager pinned directly to the persistent top taskbar.
- **Mobile Handheld Diagnostic Devices:** Single active window pinned full-screen under a condensed 24px system status strip. All title bars drop window control buttons in favor of an institutional breadcrumb back-track.

## Elevation & Depth

Visual depth does not rely on soft modern drop shadows. Depth is achieved entirely through **directional 3D bevels, sunken troughs, and layered structural borders** reflecting early X11/Motif GUI architecture.

### Light Direction & Beveling
- **Simulated Light Source:** Top-left 45-degree angle.
- **Raised Interactive Chrome (Window Bars, Inactive Buttons):**
  - Top and left borders: Light steel (`#526e94`).
  - Bottom and right borders: Deep shadow (`#0d131a`).
  - Core face: Naval base (`#1b2636`).
- **Sunken Elements (Input Fields, Data Grids, Redacted Cavities):**
  - Top and left borders: Deep shadow (`#0d131a`).
  - Bottom and right borders: Muted highlight (`#3a4f6d`).
  - Interior: Recessed canvas (`#151d27`).
- **Active/Pressed State:** Instant inversion of bevel highlights and shadows, shifting the element 1px down and right to indicate physical mechanical depression.

### CRT Overlay & Screen Glare
- A hardware scanline effect is rendered across the entire viewport using a CSS repeating linear gradient: `repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.18) 0px, rgba(0, 0, 0, 0.18) 1px, transparent 1px, transparent 2px)`.
- Critical alert modals feature a 1px solid hazard outline (`#d97736` or `#8a2b2b`) accompanied by an immediate `0 0 6px rgba(217, 119, 54, 0.35)` phosphor discharge.

## Shapes

The shape system enforces pure rectangular geometry (`roundedness: 0`). 

### Rules
- Every UI node—windows, buttons, tabs, input fields, badges, and notification panes—has a border-radius of `0px`.
- Dialog boxes, scrollbars, and window action triggers are hard-edged blocks.
- Cutouts or chamfers: Status badges and security clearance stamps may employ a 45-degree corner clip (`clip-path: polygon(...)`) with a 4px diagonal offset for tactical document tags.

## Components

### Window Manager (Aegis Frame)
- **Title Bar:** `22px` height. Active window uses a horizontal gradient (`#24334a` to `#1b2636`) with bright steel-blue text (`#a4c2e6`). Inactive windows drop to a flat `#151d27` background with muted grey-blue text (`#526e94`).
- **Title Bar Actions:** Three square buttons (`14px × 14px`) aligned right: Minimize (`_`), Maximize (`□`), and Close (`✕`). Each button uses a raised 1px bevel.
- **Frame Body:** Outer boundary enclosed by a 2px multi-tone border (top/left `#526e94`, bottom/right `#0d131a`). Client area uses `#151d27`.

### Tactical Panel (Taskbar & Pager)
- **Position & Dimensions:** Pinned to top or bottom screen edge, height `28px`, background `#1b2636`, solid bottom border `1px solid #3a4f6d`.
- **Distro Badge:** Leftmost module with distro glyph and label `CIRCA-OS v4.12`.
- **Virtual Desktop Pager:** Four sequential blocks `[ 1 ]`, `[ 2 ]`, `[ 3 ]`, `[ 4 ]`. Active workspace is sunken (`#0d131a` fill, `#82a1c7` text). Inactive blocks are raised bevels.
- **System Tray:** Monospaced clock (24-hour UTC format), network interface readout (`ETH0 [UP]`), and clearance tag (`LEVEL 4`).

### Buttons
- **Default State:** Beveled rectangle, `#1b2636` background, `1px solid` top/left `#526e94`, bottom/right `#0d131a`. Text uppercase `label-md` in `#82a1c7`.
- **Hover:** Highlight border shifts to `#82a1c7`.
- **Active / Pressed:** Inverted borders (top/left `#0d131a`, bottom/right `#526e94`), background `#151d27`, text shifts `#ffffff`.
- **Hazard Action:** Background `#5c1d1d`, highlight border `#8a2b2b`, active fill `#3a1010`.

### Form Inputs & Checkboxes
- **Input Fields:** Sunken trough, `1px solid` top/left `#0d131a`, bottom/right `#3a4f6d`, inner canvas `#0d131a`. Text color `#a4c2e6`. Caret is a non-antialiased solid vertical block (`#82a1c7`) with a 500ms step blink.
- **Checkboxes:** Rigid `12px × 12px` square, sunken well. Marked state displays an uppercase `X` in `#82a1c7`.
- **Radio Buttons:** Square indicator enclosing a smaller centered `4px × 4px` solid square when selected (no circular forms).

### Security Classification Stamps & Chips
- **Watermark Stamps:** Rotated (`-6deg`) border boxes (`2px solid`) containing uppercase institutional tracking: `TOP SECRET // C.I.R.C.A. EYES ONLY // LEVEL 4`.
- **Classification Chips:** High-contrast tags with solid backgrounds (`#8a2b2b` for Level 5/Classified, `#b85d19` for Containment Alert, `#24334a` for General Archive). Text uppercase `label-sm`.

### Data Grids & Logs
- **Header:** Sticky `18px` header row, background `#24334a`, borders `1px solid #3a4f6d`, text `label-sm` in `#82a1c7`.
- **Rows:** Alternating rows (`#151d27` and `#111821`). Active selection is highlighted in `#3a4f6d` with a dotted focus rect (`1px dotted #82a1c7`).
- **Redacted Cells:** Filled with solid `#000000` or `#1b2636` bars concealing classified values until clearance authorization is triggered.
