import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentId: string;
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined);

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover = ({ children, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentId = React.useId();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !document.getElementById(contentId)?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, setOpen, contentId]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentId }}>
      {children}
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, asChild, className, ...props }, ref) => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error("PopoverTrigger must be used within Popover");

  const handleClick = () => {
    context.setOpen(!context.open);
  };

  React.useImperativeHandle(ref, () => context.triggerRef.current as HTMLElement);
  React.useEffect(() => {
    if (context.triggerRef.current === null && ref && "current" in ref && ref.current) {
      (context.triggerRef as React.MutableRefObject<HTMLElement>).current = ref.current as HTMLElement;
    }
  }, [ref, context.triggerRef]);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref: context.triggerRef,
      onClick: handleClick,
      "aria-expanded": context.open,
      "aria-haspopup": true,
    } as any);
  }

  return (
    <button
      ref={context.triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={handleClick}
      aria-expanded={context.open}
      aria-haspopup={true}
      className={className}
      {...(props as any)}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    const context = React.useContext(PopoverContext);
    if (!context) throw new Error("PopoverContent must be used within Popover");
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
      if (!context.open || !context.triggerRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const contentHeight = 200;
        const contentWidth = 288;

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

        if (left < 0) left = 8;
        if (left + contentWidth > window.innerWidth) {
          left = window.innerWidth - contentWidth - 8;
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

    if (!context.open) return null;

    const content = (
      <div
        id={context.contentId}
        ref={ref}
        role="dialog"
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          className,
        )}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );

    return typeof window !== "undefined" ? createPortal(content, document.body) : content;
  },
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
