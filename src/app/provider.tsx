import { TooltipProvider } from "@/components/ui/tooltip";

export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <TooltipProvider>
            {children}
        </TooltipProvider>
    )
}