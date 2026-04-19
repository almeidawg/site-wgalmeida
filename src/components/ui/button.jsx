import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 rounded-full border border-transparent text-sm font-light tracking-[0.01em] ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default:
          'bg-wg-orange text-white shadow-[0_16px_34px_rgba(242,92,38,0.18)] hover:bg-[#de5423] hover:shadow-[0_20px_40px_rgba(242,92,38,0.24)]',
				destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
          'border-black/10 bg-white text-wg-black shadow-[0_10px_24px_rgba(20,20,20,0.06)] hover:border-black/15 hover:bg-wg-gray-light',
				secondary:
          'border-black/[0.05] bg-wg-gray-light text-wg-black hover:bg-[#e9e9e9]',
				ghost: 'text-wg-black hover:bg-black/[0.04]',
				link: 'border-none px-0 text-wg-orange underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-11 px-5 py-2.5',
				sm: 'h-9 px-4',
				lg: 'h-12 px-8',
				icon: 'h-10 w-10 rounded-full',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };
