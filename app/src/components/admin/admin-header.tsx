import { SidebarTrigger } from "@/components/ui/sidebar";
export function AdminHeader() {
    return (
        <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
            <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
                <SidebarTrigger />
                AdminHeader
            </div>
        </header>
    )
}