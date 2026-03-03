
# Spin & Trigger — 3D (GitHub Pages Ready)

A lightweight **Three.js** implementation of a revolver with **real-time 3D animation**:
- Cylinder spins (exact **60° per step**)
- Hammer cocks & trigger pulls
- Recoil + muzzle flash sprite
- Toy/safer reskin toggle

No external assets are required; everything is **procedural** so it works on GitHub Pages instantly.

## Run Locally
Open `index.html` in a local web server (due to ES module imports). Quickest:

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

## Deploy on GitHub Pages
1. Push the folder contents to a new repo.
2. Settings → Pages → Source: `main` → root.
3. Visit `https://<username>.github.io/<repo>/`.

## Files
- `index.html` – page shell & UI
- `styles/style.css` – styles
- `src/main.js` – scene setup & loop
- `src/gun.js` – builds the gun and controls animation

## Notes
- If you later obtain a proper rigged GLB from Blender, you can swap the procedural gun with the GLTF loader approach.
