import React from 'react';
import { cn } from '../lib/utils';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary' }>( 
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === 'default',
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === 'destructive',
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === 'outline',
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === 'secondary',
            "hover:bg-accent hover:text-accent-foreground": variant === 'ghost',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-2xl border border-input bg-transparent px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-[2rem] border bg-card text-card-foreground shadow-sm", className)} {...props} />
)
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
)
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)

export const Badge = ({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }) => {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      {
        "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === 'default',
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === 'secondary',
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80": variant === 'destructive',
        "border-transparent bg-green-500 text-white hover:bg-green-600": variant === 'success',
        "border-transparent bg-amber-500 text-white hover:bg-amber-600": variant === 'warning',
        "text-foreground": variant === 'outline',
      },
      className
    )} {...props} />
  )
}
