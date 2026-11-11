// Shared dials for the light ribbons behind every page. Pages set targets,
// the canvas eases toward them, so a route change feels like one scene moving.
export const scene = { power: 1, shift: 0, kick: 0, scroll: 0 }

export function setScene(next) {
  Object.assign(scene, next)
}
