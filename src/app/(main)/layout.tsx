import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "@/components/modules/ui/sidebar";
import { AppBreadcrumb } from "@/components/modules/ui/common/breadcrumb";
import { UserActions } from "@/components/modules/ui/common/user-actions";
import { ThemeToggle } from "@/components/modules/ui/common/theme-toggle";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="sticky top-0 h-14 border-b bg-background px-4 flex items-center gap-2 z-10">
          <div className="h-14 flex-1 flex items-center gap-2">
            <SidebarTrigger className="-ml-2" />
            <Separator orientation="vertical" className="mr-2 h-14" />
            <AppBreadcrumb />
          </div>
          <div className="h-14 flex items-center gap-2">
            <ThemeToggle />
            <UserActions />
          </div>
        </div>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
};

export default Layout;
