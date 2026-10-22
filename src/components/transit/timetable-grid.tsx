import { useTranslation } from "react-i18next"
import type { components } from "@/api/schema.gen"

type Pattern = components["schemas"]["TimetableDto"]["patterns"][number]

/** Departures grouped by hour: the classic stop-pole timetable, one row per hour. */
export function groupByHour(departures: Pattern["departures"]): [number, string[]][] {
  const hours = new Map<number, string[]>()
  for (const d of departures) {
    const [h = "0", m = "00"] = d.start.split(":")
    const hour = Number(h)
    let list = hours.get(hour)
    if (!list) hours.set(hour, (list = []))
    list.push(m)
  }
  return [...hours.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([h, mins]) => [h, mins.sort()])
}

export function TimetableGrid({ pattern }: { pattern: Pattern }) {
  const { t } = useTranslation("ops")
  const rows = groupByHour(pattern.departures)
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">{t("catalog.route.noDepartures")}</p>
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{t("catalog.route.timetableCaption", { headsign: pattern.headsign })}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("catalog.route.hour")}</th>
          <th scope="col">{t("catalog.route.minutes")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([h, mins]) => (
          <tr key={h} className="border-b last:border-0">
            <th scope="row" className="tabular w-12 py-1.5 pr-3 text-left font-bold">
              {String(h).padStart(2, "0")}
            </th>
            <td className="tabular py-1.5">
              <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                {mins.map((m, i) => (
                  <span key={`${m}-${String(i)}`}>{m}</span>
                ))}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
