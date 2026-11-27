"use client";
import { AppHeaderSlot } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function NewAssetHeader() {
    return (
        <AppHeaderSlot>
            <Button
                render={<Link href="/admin/media" />}
                nativeButton={false}
                variant="outline"
                size="sm"
            >
                <ArrowLeftIcon />
                Back
            </Button>
        </AppHeaderSlot>
    )
}