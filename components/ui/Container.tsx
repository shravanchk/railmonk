import React from 'react';
import { cn } from './cn';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
};

// Full-bleed: content spans the full viewport with comfortable edge padding.
export default function Container({ children, className, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag className={cn('w-full px-4 sm:px-6 lg:px-10 xl:px-16', className)}>
      {children}
    </Tag>
  );
}
