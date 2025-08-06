// components/AccordionComponent.tsx
import React, { type ComponentType, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AccordionItemProps {
  trigger: ReactNode | ComponentType<Record<string, never>>;
  content: ReactNode | ComponentType<Record<string, never>>;
}

interface AccordionComponentProps {
  items: AccordionItemProps[];
}

export default function AccordionComponent({ items }: AccordionComponentProps) {
  return (
    <Accordion type="single" collapsible className="w-full text-lg mb-8">
      {items.map((item, i) => (
        <AccordionItem key={`${i}-${item.trigger}`} value={`item-${i + 1}`}>
          <AccordionTrigger className="text-lg accordion-trigger">
            {typeof item.trigger === "function" ? (
              <item.trigger />
            ) : (
              item.trigger
            )}
          </AccordionTrigger>
          <AccordionContent className="text-lg">
            {typeof item.content === "function" ? (
              <item.content />
            ) : (
              item.content
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
