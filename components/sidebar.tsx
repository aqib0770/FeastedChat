'use client';

import React from 'react';
import { ConversationSummary } from '@/lib/conversation-utils';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  className?: string;
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
                        className={`h-auto py-3 px-3.5 flex flex-col items-start gap-1.5 rounded-xl transition-all ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-semibold border border-border/80 shadow-xs'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                            <MessageSquare className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
                            <span className="font-semibold text-base truncate">
                              {conv.title || 'Untitled Conversation'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground pl-7 font-medium">
                          <span>{getRelativeTime(conv.updatedAt)}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4.5 font-medium"
                          >
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
