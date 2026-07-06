import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentId: string;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Select = ({ children, value: controlledValue, defaultValue, onValueChange, open: controlledOpen, onOpenChange }: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setValue = onValueChange || setUncontrolledValue;
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
    <SelectContext.Provider value={{ open, setOpen, value, onValueChange: setValue, triggerRef, contentId }}>
      {children}
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectValue = ({ placeholder, children }: SelectValueProps) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");
  
  // Если есть children, используем их
  if (children) {
    return <>{children}</>;
  }
  
  // Иначе ищем label в дочерних элементах SelectItem
  const displayValue = context.value;
  
  return (
    <span className={!displayValue ? "text-muted-foreground" : "text-foreground"}>
      {displayValue || placeholder}
    </span>
  );
};

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    React.useEffect(() => {
      if (context.triggerRef.current === null && ref && "current" in ref && ref.current) {
        (context.triggerRef as React.MutableRefObject<HTMLElement>).current = ref.current as HTMLElement;
      }
    }, [ref, context.triggerRef]);

    return (
      <button
        ref={(node) => {
          if (ref) {
            if (typeof ref === "function") ref(node);
            else (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          }
          if (node) {
            (context.triggerRef as React.MutableRefObject<HTMLElement>).current = node;
          }
        }}
        type="button"
        role="combobox"
        aria-expanded={context.open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate",
          className,
        )}
        onClick={() => context.setOpen(!context.open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = "popper", ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within Select");
    const [pos, setPos] = React.useState({ top: 0, left: 0, width: 0 });

    React.useEffect(() => {
      if (!context.open || !context.triggerRef.current) return;

      const updatePosition = () => {
        const trigger = context.triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        setPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }, [context.open, context.triggerRef]);

    if (!context.open) return null;

    const content = (
      <div
        id={context.contentId}
        ref={ref}
        role="listbox"
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md",
          className,
        )}
        style={{
          position: "fixed",
          top: `${pos.top}px`,
          left: `${pos.left}px`,
          width: position === "popper" ? `${pos.width}px` : undefined,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div className="p-1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    );

    return typeof window !== "undefined" ? createPortal(content, document.body) : content;
  },
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");

    const isSelected = context.value === value;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className,
        )}
        onClick={(e) => {
          e.stopPropagation();
          context.onValueChange(value);
          context.setOpen(false);
        }}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  },
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
