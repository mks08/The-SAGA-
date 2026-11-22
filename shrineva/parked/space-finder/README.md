# Parked: "See your space on the floor" (space finder)

The owner asked to take this section off the site while he researches it and decides later. The work is kept here, unchanged,
so it can come back in a few minutes. Nothing in this folder is compiled or shipped.

## What it was

A planning aid on the home page and on /leasing: pick a use and a size, and it drew the occupier on the architect's floor plate
(3D or plan), with a second-occupier test. The maths and the geometry came from the architect's sheet SH-02.

| File | Role |
|---|---|
| `space-finder.component.ts` / `.html` | The component and its template |
| `floor-scene.ts` | The SVG scene (3D / plan drawing) |
| `floor-model.ts` | Floor geometry and area maths, in feet, from the architect's sheet |
| `enquiry-prefill.service.ts` | Handed the finder's answers to the old long enquiry form |
| `space-finder.styles.scss` | The global styles it used (range slider, `chip-btn`, finder drawing animations), taken out of `src/styles.scss` |

Still in the main source, so nothing else is needed: the size chips (`FINDER_SIZES`) in `src/app/config/content.config.ts` and the
lead categories in `src/app/config/landing.config.ts`.

## To bring it back

1. Move the files back:
   ```
   git mv parked/space-finder/space-finder.component.ts parked/space-finder/space-finder.component.html parked/space-finder/floor-scene.ts src/app/components/space-finder/
   git mv parked/space-finder/floor-model.ts src/app/config/floor-model.ts
   git mv parked/space-finder/enquiry-prefill.service.ts src/app/core/services/enquiry-prefill.service.ts
   ```
2. Declare `SpaceFinderComponent` in `src/app/app.module.ts`, and paste `space-finder.styles.scss` into the `@layer components` block of `src/styles.scss`.
3. Add `<app-space-finder></app-space-finder>` to `main-layout.component.html` and/or `leasing-page.component.html`.
4. The old long enquiry form (`commercial-lead-form`) was retired when the three-path form (visit, brochure, question) replaced
   it. The finder used to pre-fill that form. To reconnect it, call `openLeadPath({ path: 'query', message: <layout note> })`
   (from `src/app/core/ui-events.ts`) instead of `EnquiryPrefillService.set(...)`.
5. The finder said nothing about which floors are free, because all floors are currently available. Keep it that way.
