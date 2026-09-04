import { cva, type VariantProps } from 'class-variance-authority';
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TdHTMLAttributes,
  type TextareaHTMLAttributes,
  type ThHTMLAttributes,
} from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Button ─────────────────────────────────────────────── */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand text-brand-fg hover:brightness-95',
        accent: 'bg-accent text-accent-foreground hover:brightness-110',
        outline: 'border border-input bg-transparent hover:bg-muted',
        ghost: 'hover:bg-muted',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: { default: 'h-10 px-4', sm: 'h-8 px-3 text-xs', lg: 'h-12 px-6 text-base', icon: 'h-10 w-10' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
export { buttonVariants };

/* ── Card ───────────────────────────────────────────────── */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />;
}
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-5', className)} {...props} />;
}
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />;
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

/* ── Inputs ─────────────────────────────────────────────── */
const fieldCls =
  'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn(fieldCls, className)} {...props} />,
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(fieldCls, className)} {...props} />,
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldCls, 'h-auto min-h-20', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

/* ── Table ──────────────────────────────────────────────── */
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}
export const THead = (p: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="border-b bg-muted/50 [&_th]:h-10" {...p} />
);
export const TBody = (p: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="[&_tr:last-child]:border-0" {...p} />
);
export const TR = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b transition-colors hover:bg-muted/40', className)} {...p} />
);
export const TH = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('px-3 text-left align-middle font-medium text-muted-foreground', className)} {...p} />
);
export const TD = ({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-3 py-2.5 align-middle', className)} {...p} />
);

/* ── Misc ───────────────────────────────────────────────── */
export const Spinner = () => (
  <div className="grid place-items-center py-16 text-muted-foreground">
    <Loader2 className="size-6 animate-spin" />
  </div>
);

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium', className)}>{children}</span>;
}
