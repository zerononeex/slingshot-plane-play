// v1.8 THE HANGAR — the plane showroom's controller (no DOM, no three.js: main.js draws it, hangarview.js
// turns the model). Tapping a card only PREVIEWS: the turntable swaps to that plane and nothing is written.
// FLY THIS PLANE equips it (exactly today's equip write) — never a locked one. BACK leaves everything as it was.
import { hangarLineup, planeStatus, confirmPlane, planeFor } from './planes.js';

// turntable: { show(planeId) } · write(save): persists a save (only ever called by confirm)
export function createHangar({ save, worldId, turntable, write }) {
  const ids = hangarLineup(save, worldId);
  let previewId = planeFor(save, worldId);
  if (!ids.includes(previewId)) previewId = worldId;
  turntable.show(previewId);
  return {
    ids,
    get previewId() { return previewId; },
    status: (id = previewId) => planeStatus(save, worldId, id),
    cards: () => ids.map((id) => planeStatus(save, worldId, id)),
    preview(id) {
      if (!ids.includes(id) || id === previewId) return;
      previewId = id;
      turntable.show(id);
    },
    // The new save (written), or null when the previewed plane is locked (nothing happens).
    confirm() {
      const next = confirmPlane(save, worldId, previewId);
      if (!next) return null;
      write(next);
      return next;
    },
  };
}
