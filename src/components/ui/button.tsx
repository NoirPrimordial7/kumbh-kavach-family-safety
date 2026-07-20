import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink px-5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/50 disabled:pointer-events-none disabled:opacity-50', {
  variants: { variant: {
    default: 'bg-ink text-paper hover:bg-violet', secondary: 'bg-paper text-ink hover:bg-lime',
    violet: 'bg-violet text-white hover:bg-blue', danger: 'bg-orange text-ink hover:bg-sos hover:text-white',
    ghost: 'border-transparent bg-transparent text-ink hover:bg-black/5'
  }, size: { default: 'h-11', lg: 'min-h-14 px-7 text-base', icon: 'h-11 w-11 p-0' } },
  defaultVariants: { variant: 'default', size: 'default' }
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />);
Button.displayName = 'Button';
