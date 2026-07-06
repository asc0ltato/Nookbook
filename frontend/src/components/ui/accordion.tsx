"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);
const AccordionItemValueContext = createContext<string | null>(null);

interface AccordionProps {
  children: ReactNode;
  className?: string;
  type?: "single" | "multiple";
  defaultValue?: string;
}

function Accordion({ children, className, type = "single", defaultValue }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(defaultValue ? [defaultValue] : []);

  const toggleItem = (value: string) => {
    if (type === "single") {
      setOpenItems(openItems.includes(value) ? [] : [value]);
    } else {
      setOpenItems(
        openItems.includes(value)
          ? openItems.filter((item) => item !== value)
          : [...openItems, value]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("w-full", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <AccordionItemValueContext.Provider value={value}>
      <div className={cn("border-b", className)}>{children}</div>
    </AccordionItemValueContext.Provider>
  );
}

interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  const itemValue = useContext(AccordionItemValueContext);
  
  if (!context) throw new Error("AccordionTrigger must be used within Accordion");
  if (!itemValue) throw new Error("AccordionTrigger must be used within AccordionItem");

  const isOpen = context.openItems.includes(itemValue);

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemValue)}
      className={cn(
        "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
      />
    </button>
  );
}

interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const context = useContext(AccordionContext);
  const itemValue = useContext(AccordionItemValueContext);
  
  if (!context) throw new Error("AccordionContent must be used within Accordion");
  if (!itemValue) throw new Error("AccordionContent must be used within AccordionItem");

  const isOpen = context.openItems.includes(itemValue);

  if (!isOpen) return null;

  return (
    <div className={cn("overflow-hidden text-sm pb-4 pt-0", className)}>
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
