import { Toaster as Sonner, type ToasterProps } from "sonner"

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border !border-border !bg-popover !text-popover-foreground !shadow-none",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}
