'use client';

import React from 'react';
import { ConversationSummary } from '@/lib/conversation-utils';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  className?: string;
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
    <Sidebar collapsible="offcanvas" className={cn('border-r bg-sidebar', className)}>
      <SidebarHeader className="p-4 border-b border-border/60">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2.5 h-11 text-base font-bold rounded-xl shadow-xs"
          variant="default"
        >
          <Plus className="h-5 w-5" />
          <span>New Conversation</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {grouped.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 px-3 py-2.5">
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
                        className={`gap-2.5 rounded-xl px-3 py-2 ${
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
