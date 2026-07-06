import * as React from "react";

import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  value?: number | number[];
  defaultValue?: number | number[];
  onValueChange?: (value: number | number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const activeThumbRef = React.useRef<0 | 1>(0);
    const initialValue = value ?? defaultValue ?? min;
    const [internalValue, setInternalValue] = React.useState<number | number[]>(initialValue);
    const currentValue = value !== undefined ? value : internalValue;
    const isRange = Array.isArray(currentValue);
    const range = Math.max(max - min, step);

    const snapValue = React.useCallback(
      (rawValue: number) => {
        const stepped = Math.round((rawValue - min) / step) * step + min;
        const decimals = step.toString().split(".")[1]?.length ?? 0;
        return clamp(Number(stepped.toFixed(decimals)), min, max);
      },
      [max, min, step],
    );

    const getPercentage = React.useCallback(
      (sliderValue: number) => ((clamp(sliderValue, min, max) - min) / range) * 100,
      [max, min, range],
    );

    const emitChange = React.useCallback(
      (nextValue: number | number[]) => {
        setInternalValue(nextValue);
        onValueChange?.(nextValue);
      },
      [onValueChange],
    );

    const updateFromPointer = React.useCallback(
      (clientX: number) => {
        const track = trackRef.current;
        if (!track || disabled) return;

        const rect = track.getBoundingClientRect();
        const percentage = clamp((clientX - rect.left) / rect.width, 0, 1);
        const nextNumber = snapValue(min + percentage * range);

        if (!isRange) {
          emitChange(nextNumber);
          return;
        }

        const [leftValue, rightValue] = currentValue as number[];
        const activeThumb = activeThumbRef.current;

        if (activeThumb === 0) {
          emitChange([clamp(nextNumber, min, rightValue), rightValue]);
          return;
        }

        emitChange([leftValue, clamp(nextNumber, leftValue, max)]);
      },
      [currentValue, disabled, emitChange, isRange, max, min, range, snapValue],
    );

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;

      if (isRange) {
        const [leftValue, rightValue] = currentValue as number[];
        const track = trackRef.current;
        const rect = track?.getBoundingClientRect();
        const pointerPercentage = rect ? clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100 : 0;
        const leftDistance = Math.abs(pointerPercentage - getPercentage(leftValue));
        const rightDistance = Math.abs(pointerPercentage - getPercentage(rightValue));

        activeThumbRef.current = leftDistance <= rightDistance ? 0 : 1;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      updateFromPointer(event.clientX);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
      updateFromPointer(event.clientX);
    };

    const minValue = isRange ? (currentValue as number[])[0] : (currentValue as number);
    const maxValue = isRange ? (currentValue as number[])[1] : minValue;
    const leftPercent = isRange ? getPercentage(minValue) : 0;
    const rightPercent = getPercentage(maxValue);

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-6 w-full touch-none select-none items-center",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={isRange ? undefined : minValue}
        aria-disabled={disabled}
        {...props}
      >
        <div ref={trackRef} className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary"
            style={{
              left: `${leftPercent}%`,
              width: `${rightPercent - leftPercent}%`,
            }}
          />
        </div>

        <div
          className="absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-events-none z-20"
          style={{ left: `${getPercentage(minValue)}%` }}
        />
        {isRange && (
          <div
            className="absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pointer-events-none z-20"
            style={{ left: `${getPercentage(maxValue)}%` }}
          />
        )}
      </div>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
