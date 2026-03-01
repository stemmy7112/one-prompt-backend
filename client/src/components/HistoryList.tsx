import { formatDistanceToNow } from "date-fns";
import { History, Trash2, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeneratedApp } from "@shared/schema";

interface HistoryListProps {
  apps: GeneratedApp[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export function HistoryList({ apps, selectedId, onSelect, onDelete }: HistoryListProps) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <History className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No generated apps yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Enter a prompt to generate your first app
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <div
          key={app.id}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover-elevate",
            selectedId === app.id && "border-primary bg-primary/5"
          )}
          onClick={() => onSelect(app.id)}
          data-testid={`history-item-${app.id}`}
        >
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{app.appName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(app.id);
              }}
              data-testid={`button-delete-app-${app.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
