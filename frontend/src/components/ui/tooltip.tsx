import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentId: string;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const TooltipProvider = ({ children, delayDuration }: TooltipProviderProps) => {
  return <>{children}</>;
};

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Tooltip = ({ children, open: controlledOpen, onOpenChange }: TooltipProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentId = React.useId();

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef, contentId }}>
      {children}
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const context = React.useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

  React.useEffect(() => {
    if (context.triggerRef.current === null && ref && "current" in ref && ref.current) {
      (context.triggerRef as React.MutableRefObject<HTMLElement>).current = ref.current as HTMLElement;
    }
  }, [ref, context.triggerRef]);

  const handleMouseEnter = () => context.setOpen(true);
  const handleMouseLeave = () => context.setOpen(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref: context.triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    } as any);
  }

  return (
    <div
      ref={context.triggerRef as React.RefObject<HTMLDivElement>}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(props as any)}
    >
      {children}
    </div>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  sideOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, side = "top", align = "center", children, ...props }, ref) => {
    const context = React.useContext(TooltipContext);
    if (!context) throw new Error("TooltipContent must be used within Tooltip");
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
      if (!context.open || !context.triggerRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const tooltipHeight = 40;
        const tooltipWidth = 150;
        
        let top = 0;
        let left = 0;
        
        if (side === "top") {
          top = rect.top - tooltipHeight - sideOffset;
          left = rect.left + (align === "center" ? rect.width / 2 : align === "end" ? rect.width : 0);
        } else if (side === "bottom") {
          top = rect.bottom + sideOffset;
          left = rect.left + (align === "center" ? rect.width / 2 : align === "end" ? rect.width : 0);
        } else if (side === "left") {
          top = rect.top + (align === "center" ? rect.height / 2 : align === "end" ? rect.height : 0);
          left = rect.left - tooltipWidth - sideOffset;
        } else { // right
          top = rect.top + (align === "center" ? rect.height / 2 : align === "end" ? rect.height : 0);
          left = rect.right + sideOffset;
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
    }, [context.open, context.triggerRef, sideOffset]);

    if (!context.open) return null;

    const content = (
      <div
        id={context.contentId}
        ref={ref}
        role="tooltip"
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className,
        )}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: side === "top" || side === "bottom" 
            ? (align === "center" ? "translateX(-50%)" : align === "end" ? "translateX(-100%)" : "none")
            : (align === "center" ? "translateY(-50%)" : align === "end" ? "translateY(-100%)" : "none"),
        }}
        {...props}
      >
        {children}
      </div>
    );

    return typeof window !== "undefined" ? createPortal(content, document.body) : content;
  },
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
