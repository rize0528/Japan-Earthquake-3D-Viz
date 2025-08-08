Refactor plan for Issue #10
=================================

This document lists the concrete changes proposed to address Issue #10 (Refactor: Remove duplicated renderer implementations and consolidate frontend logic).

Goals
-----
- Consolidate renderer/front-end logic into a single source of truth.
- Remove or archive duplicated/legacy renderer HTML and inline scripts.
- Centralize shared helpers and IPC listener registration.

Proposed modifications (high level)
----------------------------------
1) Canonicalization
   - Decide to keep modular JS in src/renderer/js as canonical implementation (main.js, i18n.js, progress.js).
   - Ensure src/renderer/main.html loads these modular scripts and does not contain duplicate inline implementations.

2) Archive duplicate HTML pages
   - Move or archive the following files (they contain duplicated renderer logic):
     - src/renderer/visualization.html
     - src/renderer/table.html
     - src/renderer/filter.html
     - src/renderer/calendar.html
   - After archiving, main.html remains the single entrypoint for the renderer.

3) Consolidate duplicated functions into utilities
   - Extract shared helpers into src/renderer/js/utils/*:
     - date/time formatting (formatDateTime, formatDate)
     - magnitude helper (getMagnitudeClass)
     - 3D helpers (createGroundPlane, camera helpers, updateCameraPosition)
     - terrain helpers (interpolateElevation wrapper)

4) Centralize IPC registration
   - Have a single module (e.g., src/renderer/js/ipc-handlers.js) that registers window.api.receive callbacks.
   - Remove duplicate registrations scattered in inline scripts.

5) Testing checklist
   - Table sorting and selection
   - Filters (region, magnitude, time range) reflect in table and 3D
   - 3D scene initialization and focusing on selected earthquake
   - Terrain retrieval: request -> progress -> terrain mesh appears
   - i18n: switching language updates labels and epicenter names

Files to change (detailed)
-------------------------
- src/renderer/main.html
  - Remove inline scripts that duplicate logic present in src/renderer/js/*.js
  - Ensure script tags for modular JS are loaded in correct order

- src/renderer/js/main.js
  - Extract shared helper functions into src/renderer/js/utils/*.js
  - Rework IPC registration to import from ipc-handlers module

- src/renderer/js/i18n.js
  - Keep as canonical; ensure other copies in HTML are removed

- src/renderer/js/progress.js
  - Keep as canonical; ensure other copies are removed

- src/renderer/visualization.html, table.html, filter.html, calendar.html
  - Move to archive/ or remove once canonicalization is verified

Implementation approach (safe, incremental)
-----------------------------------------
1. Create branch fix_issue10_refactor (done).
2. Add a plan/manifest file describing exact changes (this file).
3. Create a small helper script to archive duplicate HTML files (provided in this branch). Do not run it automatically.
4. Replace inline implementations in main.html by wiring modular JS (small patches). Verify app loads and basic behavior works.
5. Move duplicates to archive/ after manual verification.
6. Extract utilities and centralize IPC listeners.

Notes
-----
- This initial branch includes the plan and a small utility script to perform file archiving. Further automated refactor patches will follow in subsequent commits/PRs if you confirm the plan.
