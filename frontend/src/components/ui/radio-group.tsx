import * as React from "react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadioGroupContextType {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null);

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value: controlledValue, defaultValue, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = React.useCallback(
      (newValue: string) => {
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [controlledValue, onValueChange]
    );

    return (
      <RadioGroupContext.Provider value={{ value, onValueChange: handleChange }}>
        <div ref={ref} role="radiogroup" className={cn("grid gap-2", className)} {...props} />
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) throw new Error("RadioGroupItem must be used within RadioGroup");

    const isChecked = context.value === value;

    return (
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          value={value}
          checked={isChecked}
          onChange={() => context.onValueChange?.(value)}
          className="sr-only"
          {...props}
        />
        <div
          role="radio"
          aria-checked={isChecked}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center cursor-pointer",
            isChecked && "bg-primary/10",
            className
          )}
          onClick={() => context.onValueChange?.(value)}
        >
          {isChecked && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
        </div>
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
