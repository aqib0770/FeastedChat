'use client';

import React from 'react';
import { ConversationSummary } from '@/lib/conversation-utils';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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
}: AppSidebarProps) {
  const grouped = groupConversations(conversations);

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="p-3">
        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="default"
        >
          <Plus className="h-4 w-4" />
          <span>New Conversation</span>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {grouped.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  return (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => onSelectConversation(conv.id)}
                        className="h-auto py-2.5 px-3 flex flex-col items-start gap-1"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="font-medium text-sm truncate">
                              {conv.title || 'Untitled Conversation'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground pl-6">
                          <span>{getRelativeTime(conv.updatedAt)}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {conv.activeModelIds.length} model
                            {conv.activeModelIds.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </SidebarMenuButton>
                      <SidebarMenuAction
                        showOnHover
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
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
          <div className="p-4 text-center text-sm text-muted-foreground">No conversations yet</div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
