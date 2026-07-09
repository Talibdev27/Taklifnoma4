# Kına Gecesi (turkish) template — decorative assets

Save the PNG cutouts you sent into **this folder** (`client/public/turkish/`)
with these exact filenames. They are served at `/turkish/<name>.png` and the
`turkish-template.tsx` component references them via CSS background layers, so a
missing file simply shows nothing (the SVG base design stays intact) — no broken
image icons.

Use **transparent-background PNGs** (the cutouts, not the ones on a black square).

| Filename            | Which image you sent                                              |
|---------------------|------------------------------------------------------------------|
| `scene.jpg`         | The full "AHISKA TÜRKLERİ" bride illustration (default background — already added) |
| `arch.png`          | The tall burgundy velvet arch / niche shape                      |
| `doves.png`         | The three flying cream doves                                     |
| `flower-red.png`    | The single burgundy glitter magnolia flower                     |
| `flower-cream.png`  | The cream / gold glitter flower                                 |
| `flowers-side.png`  | The vertical strip of cascading red flowers                     |
| `heart.png`         | The gold glitter heart outline                                  |
| `frame.png`         | (optional) the cream embossed ornate rectangular frame          |
| `sunflower.png`     | (optional) the yellow sunflower                                 |

After dropping the files in, hard-refresh the site (or restart `npm run dev`).
