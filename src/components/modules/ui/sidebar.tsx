"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Show } from "@clerk/nextjs";
import { HomeIcon, VideoIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "My Videos", href: "/my-videos", icon: VideoIcon, requireAuth: true },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state, isOverlay } = useSidebar();
  const isCollapsed = state === "collapsed" && !isOverlay;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 border-b p-0">
        <Link href="/" className="flex items-center gap-2 px-4 h-full">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={28}
            height={28}
            className="size-7 shrink-0"
          />
          {!isCollapsed && (
            <span className="text-lg font-semibold tracking-tight">Studio</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const button = (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link href={item.href}>
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
              return item.requireAuth ? (
                <Show key={item.href} when="signed-in">
                  {button}
                </Show>
              ) : (
                button
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
