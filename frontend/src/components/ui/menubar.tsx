"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenubarContextType {
  openMenus: Set<string>;
  setMenuOpen: (menuId: string, open: boolean) => void;
  triggerRefs: Map<string, React.RefObject<HTMLElement>>;
}

const MenubarContext = React.createContext<MenubarContextType | null>(null);

interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
  ({ className, ...props }, ref) => {
    const [openMenus, setOpenMenus] = React.useState<Set<string>>(new Set());
    const triggerRefs = React.useRef<Map<string, React.RefObject<HTMLElement>>>(new Map());

    const setMenuOpen = React.useCallback((menuId: string, open: boolean) => {
      setOpenMenus((prev) => {
        const next = new Set(prev);
        if (open) {
          next.add(menuId);
        } else {
          next.delete(menuId);
        }
        return next;
      });
    }, []);

    React.useEffect(() => {
      if (openMenus.size === 0) return;

      const handleClickOutside = (event: MouseEvent) => {
        let clickedInside = false;
        triggerRefs.current.forEach((ref) => {
          if (ref.current?.contains(event.target as Node)) {
            clickedInside = true;
          }
        });
        if (!clickedInside && !(event.target as Element).closest("[data-menubar-content]")) {
          setOpenMenus(new Set());
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openMenus]);

    return (
      <MenubarContext.Provider value={{ openMenus, setMenuOpen, triggerRefs: triggerRefs.current }}>
        <div ref={ref} className={cn("flex h-10 items-center space-x-1 rounded-md border bg-background p-1", className)} {...props} />
      </MenubarContext.Provider>
    );
  }
);
Menubar.displayName = "Menubar";

interface MenubarMenuProps {
  children: React.ReactNode;
}

const MenubarMenu = ({ children }: MenubarMenuProps) => {
  return <>{children}</>;
};

interface MenubarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  menuId?: string;
}

const MenubarTrigger = React.forwardRef<HTMLButtonElement, MenubarTriggerProps>(
  ({ className, menuId = "default", children, onClick, ...props }, ref) => {
    const context = React.useContext(MenubarContext);
    if (!context) throw new Error("MenubarTrigger must be used within Menubar");

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(ref, () => triggerRef.current!);

    React.useEffect(() => {
      if (!context.triggerRefs.has(menuId)) {
        context.triggerRefs.set(menuId, triggerRef as any);
      }
    }, [menuId, context.triggerRefs]);

    const isOpen = context.openMenus.has(menuId);

    return (
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={cn(
          "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground",
          isOpen && "bg-accent text-accent-foreground",
          className
        )}
        onClick={(e) => {
          context.setMenuOpen(menuId, !isOpen);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
MenubarTrigger.displayName = "MenubarTrigger";

interface MenubarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  menuId?: string;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  sideOffset?: number;
}

const MenubarContent = React.forwardRef<HTMLDivElement, MenubarContentProps>(
  ({ className, menuId = "default", align = "start", alignOffset = -4, sideOffset = 8, children, ...props }, ref) => {
    const context = React.useContext(MenubarContext);
    if (!context || !context.openMenus.has(menuId)) return null;

    const triggerRef = context.triggerRefs.get(menuId);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    React.useEffect(() => {
      if (!triggerRef?.current) return;

      const updatePosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const contentWidth = 192;
        
        let top = rect.bottom + sideOffset;
        let left = rect.left + alignOffset;

        if (align === "center") {
          left = rect.left + rect.width / 2 - contentWidth / 2;
        } else if (align === "end") {
          left = rect.right - contentWidth - alignOffset;
        }

        if (top + 300 > window.innerHeight) {
          top = rect.top - 300 - sideOffset;
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
    }, [context.openMenus, triggerRef, align, alignOffset, sideOffset]);

    const content = (
      <div
        ref={ref}
        data-menubar-content
        role="menu"
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
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
MenubarContent.displayName = "MenubarContent";

interface MenubarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

const MenubarItem = React.forwardRef<HTMLButtonElement, MenubarItemProps>(
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
MenubarItem.displayName = "MenubarItem";

interface MenubarCheckboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

const MenubarCheckboxItem = React.forwardRef<HTMLButtonElement, MenubarCheckboxItemProps>(
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
MenubarCheckboxItem.displayName = "MenubarCheckboxItem";

interface MenubarRadioItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
}

const MenubarRadioItem = React.forwardRef<HTMLButtonElement, MenubarRadioItemProps>(
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
MenubarRadioItem.displayName = "MenubarRadioItem";

interface MenubarLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const MenubarLabel = React.forwardRef<HTMLDivElement, MenubarLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
  )
);
MenubarLabel.displayName = "MenubarLabel";

const MenubarSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
);
MenubarSeparator.displayName = "MenubarSeparator";

const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
MenubarShortcut.displayName = "MenubarShortcut";

const MenubarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />
);
MenubarGroup.displayName = "MenubarGroup";

const MenubarPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const MenubarSub = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface MenubarSubTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

const MenubarSubTrigger = React.forwardRef<HTMLButtonElement, MenubarSubTriggerProps>(
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
MenubarSubTrigger.displayName = "MenubarSubTrigger";

const MenubarSubContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    />
  )
);
MenubarSubContent.displayName = "MenubarSubContent";

interface MenubarRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const MenubarRadioGroup = ({ value, onValueChange, children }: MenubarRadioGroupProps) => {
  return <div role="radiogroup">{children}</div>;
};

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};
