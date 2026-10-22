/** Small geo helpers shared by the map pages and the mock simulator. */

export type LngLat = [lon: number, lat: number]

const R = 6_371_000

export function haversine(a: LngLat, b: LngLat): number {
  const toRad = Math.PI / 180
  const dLat = (b[1] - a[1]) * toRad
  const dLon = (b[0] - a[0]) * toRad
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Initial bearing from a to b in degrees, 0 = north, clockwise. */
export function bearing(a: LngLat, b: LngLat): number {
  const toRad = Math.PI / 180
  const y = Math.sin((b[0] - a[0]) * toRad) * Math.cos(b[1] * toRad)
  const x =
    Math.cos(a[1] * toRad) * Math.sin(b[1] * toRad) -
    Math.sin(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.cos((b[0] - a[0]) * toRad)
  return (Math.atan2(y, x) / toRad + 360) % 360
}

/**
 * Google encoded polyline (the backend's `RouteShapeDto`, precision 6). Coordinates come back as
 * [lon, lat] for MapLibre.
 */
export function decodePolyline(encoded: string, precision = 6): LngLat[] {
  const factor = 10 ** precision
  const out: LngLat[] = []
  let index = 0
  let lat = 0
  let lon = 0
  while (index < encoded.length) {
    for (const axis of [0, 1] as const) {
      let shift = 0
      let result = 0
      let byte: number
      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20 && index < encoded.length)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (axis === 0) lat += delta
      else lon += delta
    }
    out.push([lon / factor, lat / factor])
  }
  return out
}

export function encodePolyline(coords: LngLat[], precision = 6): string {
  const factor = 10 ** precision
  let out = ""
  let prevLat = 0
  let prevLon = 0
  const enc = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1
    let s = ""
    while (v >= 0x20) {
      s += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
      v >>= 5
    }
    return s + String.fromCharCode(v + 63)
  }
  for (const [lon, lat] of coords) {
    const ilat = Math.round(lat * factor)
    const ilon = Math.round(lon * factor)
    out += enc(ilat - prevLat) + enc(ilon - prevLon)
    prevLat = ilat
    prevLon = ilon
  }
  return out
}

/** [west, south, east, north] of a set of points, or null when empty. */
export function bounds(points: LngLat[]): [number, number, number, number] | null {
  if (!points.length) return null
  let w = Infinity
  let s = Infinity
  let e = -Infinity
  let n = -Infinity
  for (const [lon, lat] of points) {
    w = Math.min(w, lon)
    e = Math.max(e, lon)
    s = Math.min(s, lat)
    n = Math.max(n, lat)
  }
  return [w, s, e, n]
}
