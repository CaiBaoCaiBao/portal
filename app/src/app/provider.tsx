"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getClientQuery } from "@/lib/utils/get-client-query";
import { cn } from "@/lib/utils/cn";

interface Props {
    children: React.ReactNode;
    className?: string;
}

export default function AppProvider({
    children,
    className
}: Props) {
    const queryClient = getClientQuery();

    return (
        <QueryClientProvider client={queryClient}>
            <div className={cn("min-h-screen", className)}>
                {children}
            </div>
        </QueryClientProvider>
    );
}
