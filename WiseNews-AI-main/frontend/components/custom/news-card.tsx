'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap } from 'lucide-react';
import { ReactNode } from 'react';

interface NewsCardProps {
  title: string;
  description: string;
  source: string;
  timestamp: string;
  isLive?: boolean;
  category?: string;
  children?: ReactNode;
}

export function NewsCard({
  title,
  description,
  source,
  timestamp,
  isLive = false,
  category,
  children,
}: NewsCardProps) {
  return (
    <Card className="group overflow-hidden border-border bg-card p-4 transition-all hover:shadow-md hover:shadow-primary/5 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-base font-semibold text-card-foreground sm:text-lg">
            {title}
          </h3>
          {isLive && (
            <Badge
              className="shrink-0 animate-pulse-soft gap-1 bg-red-500 text-white hover:bg-red-600"
            >
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Live</span>
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground sm:text-base">
          {description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
          <span className="font-medium">{source}</span>
          {category && <Badge variant="outline">{category}</Badge>}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{timestamp}</span>
          </div>
        </div>

        {children}
      </div>
    </Card>
  );
}
