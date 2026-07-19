'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-[0.98]',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:scale-[0.98]',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:scale-[0.98]',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline',
        // Liquid glass — tinted glass material WITHOUT backdrop-filter (perf).
        // backdrop-filter on every button was causing scroll lag (13 GPU layers).
        // The .glass class provides the tint gradient + inset shadow; we skip
        // the frosted blur on buttons since they're small and over dark bg.
        glass:
          'glass rounded-full text-foreground shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97]',
        'glass-strong':
          'glass glass-strong rounded-full text-foreground shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.97]',
        // Glass primary — mint accent text + ring, glass material provides the fill.
        'glass-primary':
          'glass rounded-full text-primary shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.97] [box-shadow:inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_40%,transparent),0_16px_40px_-12px_rgba(0,0,0,0.45)]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        // Pill sizes — for the glass variants + nav
        'lg-pill': 'h-11 rounded-full px-6 has-[>svg]:px-4 text-sm',
        'md-pill': 'h-9 rounded-full px-5 has-[>svg]:px-4',
        'sm-pill': 'h-8 rounded-full px-4 has-[>svg]:px-3 gap-1.5 text-xs',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
