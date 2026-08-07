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

function SidebarLogoButton({ onNewConversation }: { onNewConversation: () => void }) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isHovered, setIsHovered] = React.useState(false);

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Open Sidebar"
        className="relative h-9 w-9 p-1 rounded-lg hover:bg-accent flex items-center justify-center shrink-0 transition-colors cursor-pointer"
      >
        {isHovered ? (
          <RiSideBarLine className="h-5 w-5 text-muted-foreground transition-opacity duration-200" />
        ) : (
          <LogoIcon className="h-6 w-6 text-emerald-500 transition-opacity duration-200" />
        )}
        <span className="sr-only">Open Sidebar</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onNewConversation}
      title="New Conversation"
      className="h-9 w-9 p-1 rounded-lg hover:bg-accent flex items-center justify-center shrink-0 transition-colors cursor-pointer"
    >
      <LogoIcon className="h-6 w-6 text-emerald-500" />
      <span className="sr-only">New Conversation</span>
    </Button>
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
      <SidebarHeader className="p-3 border-b border-border/60 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          <SidebarLogoButton onNewConversation={onNewConversation} />
          <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden" />
        </div>
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2.5 h-10 text-sm font-bold rounded-xl shadow-xs group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg"
          variant="default"
          title="New Conversation"
        >
          <Plus className="h-4.5 w-4.5 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">New Conversation</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-2 group-data-[collapsible=icon]:hidden">
        {grouped.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-2 py-2.5">
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
                        className={`gap-2.5 rounded-xl px-2.5 py-2 ${
                          isActive ? 'bg-accent text-accent-foreground border border-border/80' : ''
                        }`}
                      >
                        <span className="font-medium text-sm truncate">
                          {conv.title || 'Untitled Conversation'}
                        </span>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
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
          <div className="p-6 text-center text-base font-medium text-muted-foreground">
            No conversations yet
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
