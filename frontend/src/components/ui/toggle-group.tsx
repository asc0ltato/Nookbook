import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

interface ToggleGroupContextType extends VariantProps<typeof toggleVariants> {
  value?: string | string[];
  onValueChange?: (value: string) => void;
  isPressed?: (value: string) => boolean;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextType>({
  size: "default",
  variant: "default",
});

interface ToggleGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof toggleVariants> {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, variant, size, type = "single", value: controlledValue, defaultValue, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(defaultValue ?? (type === "multiple" ? [] : ""));

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = React.useCallback(
      (itemValue: string) => {
        if (type === "single") {
          const newValue = value === itemValue ? "" : itemValue;
          if (controlledValue === undefined) {
            setInternalValue(newValue);
          }
          onValueChange?.(newValue);
        } else {
          const currentValues = Array.isArray(value) ? value : [];
          const newValues = currentValues.includes(itemValue)
            ? currentValues.filter((v) => v !== itemValue)
            : [...currentValues, itemValue];
          if (controlledValue === undefined) {
            setInternalValue(newValues);
          }
          onValueChange?.(newValues);
        }
      },
      [type, value, controlledValue, onValueChange]
    );

    const isItemPressed = React.useCallback(
      (itemValue: string) => {
        if (type === "single") {
          return value === itemValue;
        }
        return Array.isArray(value) && value.includes(itemValue);
      },
      [type, value]
    );

    return (
      <ToggleGroupContext.Provider value={{ variant, size, value, onValueChange: handleValueChange, isPressed: isItemPressed }}>
        <div ref={ref} role="group" className={cn("flex items-center justify-center gap-1", className)} {...props}>
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);
ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleVariants> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, children, variant, size, value, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext) as any;

    const pressed = context?.isPressed?.(value) ?? false;

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        className={cn(
          toggleVariants({
            variant: context?.variant || variant,
            size: context?.size || size,
          }),
          pressed && "bg-accent text-accent-foreground",
          className
        )}
        onClick={() => context?.onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
