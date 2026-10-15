import { TooltipProvider } from "@/components/ui/tooltip"
export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <TooltipProvider>
            {children}
        </TooltipProvider>
    )
}