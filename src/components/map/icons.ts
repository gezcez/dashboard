import type { Map as MapLibreMap } from "maplibre-gl"

/**
 * Map sprites drawn at runtime as SDF images, so one image serves every route colour through
 * `icon-color`. Generated on `styleimagemissing`, which also covers theme switches (a new style
 * drops the images it did not define).
 */
export const ICONS = {
  /** Vehicle with a bearing: an arrow pointing north, rotated by `icon-rotate`. */
  arrow: "gz-arrow",
  /** Stale vehicle: the same arrow, hollow. */
  arrowHollow: "gz-arrow-hollow",
  /** Vehicle without a bearing. */
  dot: "gz-dot",
  dotHollow: "gz-dot-hollow",
} as const

const SIZE = 48
const PIXEL_RATIO = 2

function draw(id: string): ImageData | null {
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.fillStyle = "#000"
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 5
  ctx.lineJoin = "round"
  const hollow = id === ICONS.arrowHollow || id === ICONS.dotHollow
  ctx.beginPath()
  if (id === ICONS.arrow || id === ICONS.arrowHollow) {
    // A rounded chevron arrow: tip at the top, notch at the bottom.
    ctx.moveTo(SIZE / 2, 5)
    ctx.lineTo(SIZE - 9, SIZE - 7)
    ctx.lineTo(SIZE / 2, SIZE - 16)
    ctx.lineTo(9, SIZE - 7)
    ctx.closePath()
  } else {
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 8, 0, Math.PI * 2)
  }
  if (hollow) ctx.stroke()
  else ctx.fill()
  return ctx.getImageData(0, 0, SIZE, SIZE)
}

export function addMissingImage(map: MapLibreMap, id: string): void {
  if (!(Object.values(ICONS) as string[]).includes(id) || map.hasImage(id)) return
  const image = draw(id)
  if (image) map.addImage(id, image, { sdf: true, pixelRatio: PIXEL_RATIO })
}
