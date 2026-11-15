# Bastian B. — 3D Perfume Bottle Portfolio

Personal site for **Bastian Børmarken**, a 3D perfume bottle and packaging designer.

Live: <https://bastiankode.github.io>

This folder is the GitHub Pages user site (`bastianKode.github.io`). `index.html` lives at the repository root.

## Local preview

```bash
python3 -m http.server 8000 --directory .
```

Then open <http://127.0.0.1:8000/>.

## Adding a new daily batch

Designs are produced by the generator into `batch-YYYY-MM-DD/` folders. Publish one with:

```bash
python3 ../portfolio-tools/add_batch.py /workspace/perfume-bottles/batch-YYYY-MM-DD
```

The script writes optimized JPG/WebP renders (watermarked, max 1600px), copies the GLB into `assets/models/`, updates `data/designs.json`, and regenerates `index.html`. OBJ, MTL and Blender source files are **not** included — they are paid deliverables.

Rebuild the page from the existing manifest (no new assets):

```bash
python3 ../portfolio-tools/add_batch.py --rebuild
```

## What’s in the repo

| Path | Purpose |
|---|---|
| `index.html` | Single-page portfolio (gallery, 3D viewer, services, about) |
| `css/styles.css`, `js/main.js` | Styles and gallery / lightbox behaviour |
| `data/designs.json` | Manifest of every published design |
| `assets/images/<slug>/` | Full-size and thumbnail JPG + WebP |
| `assets/models/<slug>.glb` | Interactive 3D models |
| `.nojekyll` | Lets GitHub Pages serve the site as plain static files |

The page is static HTML/CSS with a little vanilla JavaScript. There is no build step. The interactive viewer uses [Google’s `<model-viewer>`](https://modelviewer.dev/) loaded from a CDN.
