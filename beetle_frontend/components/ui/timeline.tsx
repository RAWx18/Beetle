import React from 'react';

interface TimelineProps {
  color?: string;
  children: React.ReactNode[];
}

export const Timeline: React.FC<TimelineProps> = ({ color = 'text-blue-600', children }) => (
  <div className="relative pl-8">
    {/* Vertical line */}
    <div className="absolute left-2 top-0 bottom-0 w-1 bg-muted-foreground/20 rounded-full" style={{ zIndex: 0 }} />
    {React.Children.map(children, (child, idx) =>
      React.cloneElement(child as React.ReactElement<any>, {
        index: idx,
        isFirst: idx === 0,
        isLast: idx === React.Children.count(children) - 1,
        color,
        total: React.Children.count(children)
      })
    )}
  </div>
);

interface TimelineItemProps {
  label: string;
  description?: string;
  index?: number;
  isFirst?: boolean;
  isLast?: boolean;
  color?: string;
  total?: number;
  date?: string;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ label, description, index = 0, isFirst = false, isLast = false, color = 'text-blue-600', date }) => (
  <div className="relative flex items-start mb-10 last:mb-0" style={{ zIndex: 1 }}>
    {/* Step indicator */}
    <div className="flex flex-col items-center mr-4 relative z-10">
      <div className={`w-6 h-6 flex items-center justify-center rounded-full border-2 ${isLast ? 'bg-primary text-white border-primary' : 'bg-background border-muted-foreground'} font-bold text-sm transition-all duration-200`} style={{ boxShadow: isLast ? '0 0 0 2px var(--tw-shadow-color)' : undefined }}>
        {isFirst ? <span title="Start">1</span> : isLast ? <span title="Latest"></span> : <span>{index + 1}</span>}
      </div>
      {/* Connecting line for all but last */}
      {!isLast && <div className="w-1 h-full bg-muted-foreground/20 mt-0.5" style={{ minHeight: 32 }} />}
    </div>
    <div>
      <div className={`font-semibold ${isLast ? 'text-primary' : 'text-foreground'} mb-1 flex items-center gap-2`}>
        {label}
        {isFirst && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">Start</span>}
        {isLast && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Now</span>}
        {date && <span className="ml-2 text-xs text-muted-foreground">{date}</span>}
      </div>
      {description && <div className="text-muted-foreground text-sm">{description}</div>}
    </div>
  </div>
); 