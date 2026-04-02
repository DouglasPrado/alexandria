'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error('usePopover must be used within Popover');
  return ctx;
}

function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Close on escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const popover = document.querySelector('[data-popover-content]');
      if (
        popover &&
        !popover.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, ...props }, ref) => {
  const { open, setOpen, triggerRef } = usePopover();

  const handleRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, triggerRef],
  );

  return (
    <button
      ref={handleRef}
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';

function PopoverContent({
  children,
  className,
  align = 'start',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}) {
  const { open, triggerRef } = usePopover();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    transform?: string;
  }>({});

  React.useEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const gap = 8;
    const newPos: typeof position = {};

    // Vertical: prefer below, flip above if no space
    const spaceBelow = viewport.height - trigger.bottom - gap;
    const spaceAbove = trigger.top - gap;

    if (spaceBelow >= content.height || spaceBelow >= spaceAbove) {
      newPos.top = '100%';
      newPos.bottom = undefined;
    } else {
      newPos.bottom = '100%';
      newPos.top = undefined;
    }

    // Horizontal: align based on prop, but clamp to viewport
    if (align === 'end') {
      newPos.right = '0';
      // Check if it overflows left
      const leftEdge = trigger.right - content.width;
      if (leftEdge < 0) {
        newPos.right = undefined;
        newPos.left = `${-trigger.left + gap}px`;
      }
    } else if (align === 'center') {
      newPos.left = '50%';
      newPos.transform = 'translateX(-50%)';
    } else {
      // start
      newPos.left = '0';
      // Check if it overflows right
      const rightEdge = trigger.left + content.width;
      if (rightEdge > viewport.width) {
        newPos.left = undefined;
        newPos.right = '0';
      }
    }

    setPosition(newPos);
  }, [open, align, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      data-popover-content
      className={cn(
        'absolute z-50 mt-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--popover)] p-4 text-[var(--popover-foreground)] shadow-md animate-in fade-in-0 zoom-in-95',
        className,
      )}
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        transform: position.transform,
        marginBottom: position.bottom ? '8px' : undefined,
      }}
    >
      {children}
    </div>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
