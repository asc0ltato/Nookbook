"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
);

interface NavigationMenuContextType {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
}

const NavigationMenuContext = React.createContext<NavigationMenuContextType | null>(null);

interface NavigationMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

const NavigationMenu = React.forwardRef<HTMLDivElement, NavigationMenuProps>(
  ({ className, children, ...props }, ref) => {
    const [activeItem, setActiveItem] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (!activeItem) return;

      const handleClickOutside = () => setActiveItem(null);
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [activeItem]);

    return (
      <NavigationMenuContext.Provider value={{ activeItem, setActiveItem }}>
        <div ref={ref} className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)} {...props}>
          {children}
        </div>
      </NavigationMenuContext.Provider>
    );
  }
);
NavigationMenu.displayName = "NavigationMenu";

interface NavigationMenuListProps extends React.HTMLAttributes<HTMLUListElement> {}

const NavigationMenuList = React.forwardRef<HTMLUListElement, NavigationMenuListProps>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)} {...props} />
  )
);
NavigationMenuList.displayName = "NavigationMenuList";

interface NavigationMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {}

const NavigationMenuItem = React.forwardRef<HTMLLIElement, NavigationMenuItemProps>(
  ({ className, ...props }, ref) => <li ref={ref} className={className} {...props} />
);
NavigationMenuItem.displayName = "NavigationMenuItem";

interface NavigationMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  itemId?: string;
}

const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, NavigationMenuTriggerProps>(
  ({ className, children, itemId, ...props }, ref) => {
    const context = React.useContext(NavigationMenuContext);
    const isOpen = context?.activeItem === itemId;

    return (
      <button
        ref={ref}
        className={cn(navigationMenuTriggerStyle(), "group", isOpen && "bg-accent/50", className)}
        onClick={() => context?.setActiveItem(isOpen ? null : itemId || null)}
        {...props}
      >
        {children}{" "}
        <ChevronDown
          className={cn("relative top-[1px] ml-1 h-3 w-3 transition duration-200", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
    );
  }
);
NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

interface NavigationMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  itemId?: string;
}

const NavigationMenuContent = React.forwardRef<HTMLDivElement, NavigationMenuContentProps>(
  ({ className, itemId, children, ...props }, ref) => {
    const context = React.useContext(NavigationMenuContext);
    if (!context || context.activeItem !== itemId) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "left-0 top-0 w-full animate-in fade-in md:absolute md:w-auto",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NavigationMenuContent.displayName = "NavigationMenuContent";

interface NavigationMenuLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavigationMenuLinkProps>(
  ({ className, ...props }, ref) => (
    <a ref={ref} className={cn(className)} {...props} />
  )
);
NavigationMenuLink.displayName = "NavigationMenuLink";

interface NavigationMenuViewportProps extends React.HTMLAttributes<HTMLDivElement> {}

const NavigationMenuViewport = React.forwardRef<HTMLDivElement, NavigationMenuViewportProps>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(NavigationMenuContext);
    
    if (!context?.activeItem) return null;

    return (
      <div className={cn("absolute left-0 top-full flex justify-center")}>
        <div
          ref={ref}
          className={cn(
            "origin-top-center relative mt-1.5 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in zoom-in-90 md:w-auto",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
NavigationMenuViewport.displayName = "NavigationMenuViewport";

interface NavigationMenuIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, NavigationMenuIndicatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </div>
  )
);
NavigationMenuIndicator.displayName = "NavigationMenuIndicator";

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};
