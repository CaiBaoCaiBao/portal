"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getClientQuery } from "@/lib";
import { QueryClientProvider } from "@tanstack/react-query";

export default function Provider({ children }: { children: React.ReactNode }) {
    const queryClient = getClientQuery();

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                {children}
            </TooltipProvider>
        </QueryClientProvider>

    )
}