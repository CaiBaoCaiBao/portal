"use client";
import { AppHeaderSlot } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export function MediaHeader() {
    return (
        <AppHeaderSlot>
            <Button
                render={<Link href="/admin/media/new-asset" />}
                nativeButton={false}
                size="sm"
            >
                <PlusIcon />New Asset
            </Button>
        </AppHeaderSlot>
    )
}