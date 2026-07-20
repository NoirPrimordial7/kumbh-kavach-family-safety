import * as React from 'react';
import { cn } from '@/lib/utils';
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('rounded-[1.35rem] border border-ink/20 bg-white/75 shadow-paper', className)} {...props} />; }
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('p-5 pb-2', className)} {...props} />; }
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('p-5 pt-3', className)} {...props} />; }
