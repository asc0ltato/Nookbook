"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface HoverCardContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const HoverCardContext = React.createContext<HoverCardContextType | null>(null);

interface HoverCardProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const HoverCard = ({ children, open: controlledOpen, onOpenChange }: HoverCardProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const triggerRef = React.useRef<HTMLElement>(null);

  return (
    <HoverCardContext.Provider value={{ open, onOpenChange: setOpen, triggerRef }}>
      {children}
    </HoverCardContext.Provider>
  );
};

interface HoverCardTriggerProps extends React.HTMLAttributes<HTMLElement> {}

const HoverCardTrigger = React.forwardRef<HTMLElement, HoverCardTriggerProps>(
  ({ children, ...props }, ref) => {
    const context = React.useContext(HoverCardContext);
    if (!context) throw new Error("HoverCardTrigger must be used within HoverCard");

    React.useEffect(() => {
      if (ref && "current" in ref && ref.current) {
        (context.triggerRef as React.MutableRefObject<HTMLElement>).current = ref.current as HTMLElement;
      }
    }, [ref, context.triggerRef]);

    const handleMouseEnter = () => context.onOpenChange(true);
    const handleMouseLeave = () => context.onOpenChange(false);

    return (
      <div
        ref={ref as any}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    );
  }
);
HoverCardTrigger.displayName = "HoverCardTrigger";

interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(HoverCardContext);
    if (!context || !context.open) return null;

    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
      if (!context.triggerRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const contentWidth = 256;
        const contentHeight = 200;

        let top = rect.bottom + sideOffset;
        let left = rect.left;

        if (align === "center") {
          left = rect.left + rect.width / 2 - contentWidth / 2;
        } else if (align === "end") {
          left = rect.right - contentWidth;
        }

        if (top + contentHeight > window.innerHeight) {
          top = rect.top - contentHeight - sideOffset;
        }

        setPosition({ top, left });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [context.open, context.triggerRef, align, sideOffset]);

    const content = (
      <div
        ref={ref}
        className={cn(
          "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: align === "center" ? "translateX(-50%)" : align === "end" ? "translateX(-100%)" : "none",
        }}
        onMouseEnter={() => context.onOpenChange(true)}
        onMouseLeave={() => context.onOpenChange(false)}
        {...props}
      >
        {children}
      </div>
    );

    return typeof window !== "undefined" ? createPortal(content, document.body) : content;
  }
);
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };
