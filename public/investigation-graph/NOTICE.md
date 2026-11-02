# Reference graph assets

`vendor/graph.js`, `vendor/style.css` and `vendor/d3.v7.min.js` were copied from the live clone at `D:\ai INVESTIGATER`, repository https://github.com/haryana-police/AI-Investigation, commit `2972df8` (2026-10-19).

The reference graph renderer and its role-aware fixed 2D layout, D3 network mode, legends, path finder, details and SVG export are reused. The reference package declares MIT; D3's bundled copyright/license notice is retained in its file.

CMS integration lives in `workspace.js`, `workspace.css` and the React adapter. It uses only authorized processed FIR data supplied by its parent, without importing the reference application's login, demo cases, database or AI keys. The sandbox isolates vendor code/styles from the CMS application.

CMS changes to `vendor/graph.js`: avoid invented confidence scores, expose simulation cleanup, and show source document/page/quote links and temporal context on the entity card. The additional 3D canvas implements perspective projection, orbit/pan/zoom, node dragging, depth sorting and the same source/relationship inspection using the same graph data. The live reference itself has fixed 2D and force-directed Network modes.
