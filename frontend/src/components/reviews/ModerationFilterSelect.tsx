"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getModerationOptionLabel,
  type ModerationSelectOption,
} from "@/components/reviews/reviewsModerationOptions";

interface ModerationFilterSelectProps {
  value: string;
  options: ModerationSelectOption[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
}
  
export function ModerationFilterSelect({
  value,
  options,
  placeholder = "Выберите",
  onValueChange,
  className,
  triggerClassName,
}: ModerationFilterSelectProps) {
  const displayLabel = getModerationOptionLabel(options, value, placeholder);

  return (
    <div className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName ?? "w-[220px]"}>
          <SelectValue placeholder={placeholder}>{displayLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
