import type { LngLat } from "@/lib/geo"

/**
 * Synthetic but real-looking transit networks for mock mode: Kocaeli (İzmit and the Gulf coast)
 * and a smaller Sakarya. Waypoints follow the main corridors (D-100, the coast road, the Akçaray
 * tram); stops are spaced evenly along each line. Nothing here is real operator data.
 */

export interface RouteDef {
  /** Upstream route code (Kentkart `routeCode`); the public id is `${bindingId}.${code}`. */
  code: string
  short: string
  long: string
  agency: string
  type: 0 | 3
  colour: string
  /** Direction 0 waypoints as [lon, lat]; direction 1 runs them backwards. */
  path: LngLat[]
  /** Headsign per direction. */
  headsigns: [string, string]
  /** Vehicles per direction at peak. */
  fleet: number
  /** Average running speed, m/s. */
  speed: number
  /** Staff-only route that must be filtered out of public data (issue fixture). */
  staff?: boolean
}

export interface NetworkDef {
  networkId: number
  slug: string
  bindingId: number
  externalRef: string
  plateArea: string
  centre: LngLat
  routes: RouteDef[]
  stopNames: string[]
  timetable: boolean
}

const IZMIT: LngLat = [29.9408, 40.7654]
const OTOGAR: LngLat = [29.9625, 40.7745]
const UMUTTEPE: LngLat = [29.9199, 40.8239]

export const KOCAELI: NetworkDef = {
  networkId: 4,
  slug: "kocaeli",
  bindingId: 4,
  externalRef: "004",
  plateArea: "41",
  centre: IZMIT,
  timetable: true,
  stopNames: [
    "Yahya Kaptan",
    "Kozluk",
    "Bekirdere",
    "Alikahya",
    "Cedit",
    "Tepecik",
    "Serdar",
    "Yenişehir",
    "Karabaş",
    "Kemalpaşa",
    "Ömerağa",
    "Hacı Hasan",
    "Topçular",
    "Turgut",
    "Körfez Mahallesi",
    "Sanayi",
    "Kuruçeşme",
    "Gültepe",
    "Yenidoğan",
    "Fatih",
    "Erenler",
    "Orhan",
    "Hürriyet",
    "Cumhuriyet",
    "Tavşantepe",
    "Doğu Kışla",
    "Saraybahçe",
    "Mehmet Ali Paşa",
    "Kadıköy",
    "Zabıtan",
  ],
  routes: [
    {
      code: "42041",
      short: "41C",
      long: "UMUTTEPE - İZMİT - MAŞUKİYE",
      agency: "UlaşımPark",
      type: 3,
      colour: "0B4F8A",
      path: [
        UMUTTEPE,
        [29.93, 40.8],
        IZMIT,
        [29.99, 40.75],
        [30.03, 40.737],
        [30.09, 40.715],
        [30.1406, 40.7006],
      ],
      headsigns: ["MAŞUKİYE", "UMUTTEPE"],
      fleet: 9,
      speed: 7.5,
    },
    {
      code: "41041",
      short: "41K",
      long: "KURUÇEŞME - İZMİT",
      agency: "UlaşımPark",
      type: 3,
      colour: "1F8A70",
      path: [[29.905, 40.79], [29.92, 40.778], IZMIT],
      headsigns: ["İZMİT", "KURUÇEŞME"],
      fleet: 4,
      speed: 6.5,
    },
    {
      code: "40001",
      short: "T1",
      long: "AKÇARAY TRAMVAY",
      agency: "Akçaray",
      type: 0,
      colour: "C8102E",
      path: [
        [29.964, 40.776],
        [29.952, 40.77],
        [29.942, 40.766],
        [29.933, 40.764],
        [29.923, 40.7625],
      ],
      headsigns: ["SEKAPARK", "OTOGAR"],
      fleet: 5,
      speed: 5.5,
    },
    {
      code: "42200",
      short: "200",
      long: "GEBZE - İZMİT (D-100)",
      agency: "UlaşımPark",
      type: 3,
      colour: "7A3E9D",
      path: [
        [29.43, 40.802],
        [29.53, 40.785],
        [29.62, 40.79],
        [29.73, 40.765],
        [29.82, 40.757],
        IZMIT,
      ],
      headsigns: ["İZMİT", "GEBZE"],
      fleet: 14,
      speed: 11,
    },
    {
      code: "42150",
      short: "150",
      long: "GÖLCÜK - BAŞİSKELE - İZMİT",
      agency: "UlaşımPark",
      type: 3,
      colour: "D97706",
      path: [[29.82, 40.717], [29.88, 40.715], [29.9278, 40.7155], [29.945, 40.74], IZMIT],
      headsigns: ["İZMİT", "GÖLCÜK"],
      fleet: 8,
      speed: 8,
    },
    {
      code: "42012",
      short: "12",
      long: "DERİNCE - İZMİT",
      agency: "UlaşımPark",
      type: 3,
      colour: "0E7490",
      path: [[29.831, 40.756], [29.88, 40.76], IZMIT],
      headsigns: ["İZMİT", "DERİNCE"],
      fleet: 5,
      speed: 7,
    },
    {
      code: "42030",
      short: "30",
      long: "KARTEPE - İZMİT",
      agency: "UlaşımPark",
      type: 3,
      colour: "4D7C0F",
      path: [[30.03, 40.737], [29.99, 40.75], [29.96, 40.76], IZMIT],
      headsigns: ["İZMİT", "KARTEPE"],
      fleet: 6,
      speed: 7.5,
    },
    {
      code: "42500",
      short: "500",
      long: "KANDIRA - İZMİT",
      agency: "Kandıra Koop.",
      type: 3,
      colour: "9F1239",
      path: [[30.153, 41.071], [30.09, 40.98], [30.01, 40.88], [29.97, 40.83], OTOGAR],
      headsigns: ["İZMİT OTOGAR", "KANDIRA"],
      fleet: 7,
      speed: 12,
    },
    {
      code: "42007",
      short: "7",
      long: "ALİKAHYA - SEKAPARK",
      agency: "UlaşımPark",
      type: 3,
      colour: "B45309",
      path: [[30.0, 40.779], OTOGAR, IZMIT, [29.923, 40.762]],
      headsigns: ["SEKAPARK", "ALİKAHYA"],
      fleet: 6,
      speed: 6,
    },
    {
      code: "42045",
      short: "45",
      long: "KÖRFEZ - DERİNCE - İZMİT",
      agency: "UlaşımPark",
      type: 3,
      colour: "1D4ED8",
      path: [[29.74, 40.768], [29.82, 40.757], IZMIT],
      headsigns: ["İZMİT", "KÖRFEZ"],
      fleet: 7,
      speed: 8.5,
    },
    {
      code: "42005",
      short: "5",
      long: "BAŞİSKELE - UMUTTEPE",
      agency: "UlaşımPark",
      type: 3,
      colour: "6D28D9",
      path: [[29.9278, 40.7155], IZMIT, UMUTTEPE],
      headsigns: ["UMUTTEPE", "BAŞİSKELE"],
      fleet: 6,
      speed: 7,
    },
    {
      code: "41900",
      short: "419",
      long: "PERSONEL SERVİSİ",
      agency: "UlaşımPark",
      type: 3,
      colour: "64748B",
      path: [[29.97, 40.772], OTOGAR],
      headsigns: ["GARAJ", "OTOGAR"],
      fleet: 1,
      speed: 6,
      staff: true,
    },
  ],
}

const ADAPAZARI: LngLat = [30.4036, 40.7806]

export const SAKARYA: NetworkDef = {
  networkId: 54,
  slug: "sakarya",
  bindingId: 54,
  externalRef: "054",
  plateArea: "54",
  centre: ADAPAZARI,
  timetable: false,
  stopNames: [
    "Çark",
    "Tığcılar",
    "Semerciler",
    "Yenigün",
    "Erenler",
    "Serdivan",
    "Kampüs",
    "Sapanca Yolu",
    "Arifiye",
    "Hendek Yolu",
    "Karaman",
    "Camili",
  ],
  routes: [
    {
      code: "54001",
      short: "1",
      long: "KAMPÜS - ÇARK",
      agency: "SAKUS",
      type: 3,
      colour: "0B4F8A",
      path: [[30.3315, 40.7425], [30.37, 40.765], ADAPAZARI],
      headsigns: ["ÇARK", "KAMPÜS"],
      fleet: 6,
      speed: 7,
    },
    {
      code: "54010",
      short: "10",
      long: "ERENLER - ADAPAZARI",
      agency: "SAKUS",
      type: 3,
      colour: "D97706",
      path: [[30.416, 40.751], [30.41, 40.766], ADAPAZARI],
      headsigns: ["ADAPAZARI", "ERENLER"],
      fleet: 4,
      speed: 7,
    },
    {
      code: "54020",
      short: "20",
      long: "ARİFİYE - ADAPAZARI",
      agency: "SAKUS",
      type: 3,
      colour: "1F8A70",
      path: [[30.365, 40.712], [30.385, 40.745], ADAPAZARI],
      headsigns: ["ADAPAZARI", "ARİFİYE"],
      fleet: 5,
      speed: 8,
    },
  ],
}

export const SIM_NETWORKS: NetworkDef[] = [KOCAELI, SAKARYA]

export function simNetwork(idOrSlug: string | number): NetworkDef | undefined {
  return SIM_NETWORKS.find((n) => n.slug === idOrSlug || String(n.networkId) === String(idOrSlug))
}
