'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface LoadingButtonProps {
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function LoadingButton({
  isLoading = false,
  children,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  variant = 'default',
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`relative ${className}`}
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
