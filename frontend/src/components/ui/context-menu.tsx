"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuContextType {
  open: boolean;
  position: { x: number; y: number };
  onOpenChange: (open: boolean) => void;
}

const ContextMenuContext = React.createContext<ContextMenuContextType | null>(null);

interface ContextMenuProps {
  children: React.ReactNode;
}

const ContextMenu = ({ children }: ContextMenuProps) => {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  return (
    <ContextMenuContext.Provider value={{ open, position, onOpenChange: setOpen }}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ContextMenuTrigger) {
          return React.cloneElement(child as any, { onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            setPosition({ x: e.clientX, y: e.clientY });
            setOpen(true);
          } });
        }
        return child;
      })}
    </ContextMenuContext.Provider>
  );
};

interface ContextMenuTriggerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const ContextMenuTrigger = ({ children, onContextMenu, ...props }: ContextMenuTriggerProps) => {
  const context = React.useContext(ContextMenuContext);
  
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        context?.onOpenChange(true);
        onContextMenu?.(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface ContextMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(ContextMenuContext);
    if (!context || !context.open) return null;

    React.useEffect(() => {
      const handleClickOutside = () => context.onOpenChange(false);
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [context]);

    const content = (
      <div
        ref={ref}
        role="menu"
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          position: "fixed",
          top: `${context.position.y}px`,
          left: `${context.position.x}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );

    return typeof window !== "undefined" ? createPortal(content, document.body) : content;
  }
);
ContextMenuContent.displayName = "ContextMenuContent";

interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

const ContextMenuItem = React.forwardRef<HTMLButtonElement, ContextMenuItemProps>(
  ({ className, inset, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none disabled:pointer-events-none disabled:opacity-50 focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
);
ContextMenuItem.displayName = "ContextMenuItem";

interface ContextMenuCheckboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

const ContextMenuCheckboxItem = React.forwardRef<HTMLButtonElement, ContextMenuCheckboxItemProps>(
  ({ className, children, checked, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none disabled:pointer-events-none disabled:opacity-50 focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </button>
  )
);
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

interface ContextMenuRadioItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

const ContextMenuRadioItem = React.forwardRef<HTMLButtonElement, ContextMenuRadioItemProps>(
  ({ className, children, checked, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none disabled:pointer-events-none disabled:opacity-50 focus:bg-accent focus:text-accent-foreground",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Circle className="h-2 w-2 fill-current" />}
      </span>
      {children}
    </button>
  )
);
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

interface ContextMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const ContextMenuLabel = React.forwardRef<HTMLDivElement, ContextMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)} {...props} />
  )
);
ContextMenuLabel.displayName = "ContextMenuLabel";

const ContextMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
  )
);
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

const ContextMenuGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
);
ContextMenuGroup.displayName = "ContextMenuGroup";

const ContextMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const ContextMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface ContextMenuSubTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

const ContextMenuSubTrigger = React.forwardRef<HTMLButtonElement, ContextMenuSubTriggerProps>(
  ({ className, inset, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </button>
  )
);
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

const ContextMenuSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  )
);
ContextMenuSubContent.displayName = "ContextMenuSubContent";

interface ContextMenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const ContextMenuRadioGroup = ({ value, onValueChange, children }: ContextMenuRadioGroupProps) => {
  return <div role="radiogroup">{children}</div>;
};

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
