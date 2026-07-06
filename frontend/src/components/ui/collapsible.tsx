"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextType | null>(null);

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Collapsible = ({ children, open: controlledOpen, defaultOpen, onOpenChange }: CollapsibleProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(value);
      }
      onOpenChange?.(value);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </CollapsibleContext.Provider>
  );
};

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) throw new Error("CollapsibleTrigger must be used within Collapsible");

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={context.open}
        className={className}
        onClick={(e) => {
          context.onOpenChange(!context.open);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean;
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, forceMount, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) throw new Error("CollapsibleContent must be used within Collapsible");

    if (!context.open && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all",
          context.open ? "animate-in slide-in-from-top-1" : "animate-out slide-out-to-top-1",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
