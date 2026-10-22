import { createFileRoute, notFound } from "@tanstack/react-router"
import { BellIcon, MoonIcon, SunIcon, TruckIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eyebrow } from "@/components/ui/eyebrow"
import { Input } from "@/components/ui/input"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/logo"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusDot } from "@/components/ui/status-dot"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { isProduction } from "@/env"
import { usePrefs } from "@/lib/prefs-store"
import { useResolvedTheme } from "@/lib/theme"

/** Dev-only gallery of the brand UI kit (plan: "/__ui"). Not reachable in production builds. */
export const Route = createFileRoute("/ui-kit")({
  beforeLoad: () => {
    if (isProduction) throw notFound()
  },
  component: UiKit,
})

function UiKit() {
  const theme = useResolvedTheme()
  const setTheme = usePrefs((s) => s.setTheme)
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-6">
      <header className="flex items-center justify-between">
        <Logo suffix="UI kit" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />} {theme === "dark" ? "Light" : "Dark"}
        </Button>
      </header>

      <section className="flex flex-col gap-3">
        <Eyebrow>Buttons</Eyebrow>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="icon" variant="outline" aria-label="Notifications">
            <BellIcon />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Badges and status</Eyebrow>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="solid">Solid</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="ok">Running</Badge>
          <Badge variant="warn">Degraded</Badge>
          <Badge variant="error">Failed</Badge>
          <StatusDot status="ok" label="Connected" showLabel />
          <StatusDot status="warn" label="Reconnecting" showLabel />
          <StatusDot status="error" label="Down" showLabel />
          <StatusDot status="off" label="Off" showLabel />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Active vehicles"
          value="412"
          hint="+8% vs last week"
          icon={<TruckIcon className="size-4" />}
        />
        <KpiTile label="Networks live" value="3 / 4" />
        <KpiTile label="Median feed lag" value="14 s" />
        <KpiTile label="Data quality" value="92" hint="Worst: Sakarya" />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>rounded-2xl, hairline border, flat.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kit-input">Input</Label>
              <Input id="kit-input" placeholder="kocaeli" />
            </div>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>PN</AvatarFallback>
              </Avatar>
              <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 brand-gradient p-5 text-navy">
          <p className="text-xs font-bold tracking-widest uppercase">Now</p>
          <p className="mt-2 text-lg font-semibold">Gradient card, as on www's roadmap.</p>
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Overlays</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pause kentkart/004 for Kocaeli?</DialogTitle>
                <DialogDescription>Live vehicles stop updating for all riders.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive">Pause provider</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>Requires tracker.control</TooltipContent>
          </Tooltip>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Eyebrow>Tabs and table</Eyebrow>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Status</TabsTrigger>
            <TabsTrigger value="b">Poll log</TabsTrigger>
          </TabsList>
          <TabsContent value="a">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Binding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Vehicles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">kentkart/004</TableCell>
                    <TableCell>
                      <Badge variant="ok">Running</Badge>
                    </TableCell>
                    <TableCell className="text-right">412</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono">kentkart/054</TableCell>
                    <TableCell>
                      <Badge variant="warn">Fallback</Badge>
                    </TableCell>
                    <TableCell className="text-right">97</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="b">Poll log</TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
