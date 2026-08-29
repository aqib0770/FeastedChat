'use client';

import React from 'react';
import { ConversationSummary } from '@/lib/conversation-utils';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/logo';
import { RiSideBarLine } from '@remixicon/react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  className?: string;
}

function SidebarLogoButton() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        title="Open Sidebar"
        className="relative h-7 w-7 p-1 rounded-md hover:bg-accent flex items-center justify-center shrink-0 transition-colors cursor-pointer group"
      >
        <LogoIcon className="h-5 w-5 text-emerald-500 transition-opacity duration-200 group-hover:opacity-0" />
        <RiSideBarLine className="absolute h-4 w-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <span className="sr-only">Open Sidebar</span>
      </Button>
    );
  }

  return (
    <span className="font-semibold text-[14px] tracking-tight px-1 select-none">FeastedChat</span>
  );
}

function groupConversations(conversations: ConversationSummary[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const groups: { label: string; items: ConversationSummary[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 Days', items: [] },
    { label: 'Older', items: [] },
  ];

  for (const conv of conversations) {
    const date = new Date(conv.updatedAt);
    if (date >= today) groups[0].items.push(conv);
    else if (date >= yesterday) groups[1].items.push(conv);
    else if (date >= weekAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function AppSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  className,
}: AppSidebarProps) {
  const grouped = groupConversations(conversations);

  return (
    <Sidebar collapsible="icon" className={cn('border-r bg-sidebar', className)}>
      <SidebarHeader className="p-2 border-b border-border/60 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center gap-2">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center h-7">
          <SidebarLogoButton />
          <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden [&_svg]:size-4" />
        </div>
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2 h-8 text-[13px] font-medium rounded-lg shadow-none group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg"
          variant="ghost"
          title="New Conversation"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">New chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-2 group-data-[collapsible=icon]:hidden">
        {grouped.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/60 px-2 py-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  return (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onSelectConversation(conv.id)}
                        className={`gap-2 rounded-lg px-2 py-1.5 text-[13px] ${
                          isActive ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        <span className="font-normal text-[13px] truncate">
                          {conv.title || 'Untitled Conversation'}
                        </span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="text-muted-foreground hover:text-destructive h-7 w-7 rounded-md [&_svg]:size-3.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {grouped.length === 0 && (
          <div className="p-4 text-center text-[13px] font-normal text-muted-foreground">
            No conversations yet
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
