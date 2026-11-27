import { AppHeader } from "@/components/app-header";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/** 管理端布局级顶栏 */
export function AdminHeader() {
    return (
        <AppHeader>
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4 !self-center" />
        </AppHeader>
    );
}
