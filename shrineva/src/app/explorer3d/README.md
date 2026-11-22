# explorer3d: the lift-off 3D floor view

Used by `components/building-explorer`. When a floor is chosen, the picture of the building becomes a 3D model of that floor: the
floors above lift away (faint outlines, thinning out as the camera rises), the chosen floor is cut open low so the whole plan can be
read, and the model can be turned from any side. Top, Angle and Front buttons set the view in one tap.

The front-elevation render stays the standard look. It is what the explorer shows until a floor is chosen, and the "Building"
button brings it back. This module draws only what the architect's plan shows: slab, walls and windows, columns, lift, stair,
services block, east recess, fire exit and the glass front. No furniture, no day or night, no fit-outs.

## Files

| File | What it does |
| --- | --- |
| `plan-dims.ts` | Dimensions read from the architect's sheets SH-01 and SH-02 (feet), converted to metres. The only place numbers live. |
| `model.ts` | Builds the levels (ground, three floors, roof) from those dimensions, and the name labels and dimension lines. |
| `batch.ts`, `materials.ts`, `textures.ts` | One merged mesh per material, the material sets (each level fades on its own), and small canvas textures (no image downloads). |
| `explorer3d.ts` | The engine: camera, presets, turning and zooming, lifting, labels, compass, render loop. |

## Loading

`explorer3d.ts` is imported with a dynamic `import()` from the component, so three.js is a separate download (about 115 KB gzipped).
It is fetched when the picture nears the screen on a good connection, or on first use. With data saver on, only the "3D plan" button
loads it. The home page's own JavaScript does not include it.

## Behaviour worth knowing

- The render loop runs only while something moves or the visitor is turning the model. It stops when the picture is off screen.
- Touch: a sideways drag turns, a pinch zooms, an up-and-down drag still scrolls the page. Tilt comes from the buttons.
- The camera distance is fitted to the plan at every heading, so the whole plan stays in view while it is turned.
- Top view is north-up, the same way as the 2D plan sheets. The compass follows the camera.
- If WebGL is missing or the graphics context is lost, the explorer falls back to the picture and hides the 3D buttons.
- Everything drawn is labelled "indicative" on the page. If the plan changes, change `plan-dims.ts`; nothing else needs touching.
