/**
 * Tiny mutable bus — SpineNodesOverlay writes which node index (if any) is
 * hovered/focused; SpineLayer reads it directly inside its own per-frame
 * loop to brighten that node ahead of scroll. Same bare-object idiom as
 * lib/warp-fx.ts — a single reader polling every frame needs no pub/sub.
 */
export const spineHover = { index: null as number | null };
