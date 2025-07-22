'use client';

import React from 'react';
import { Button } from './button';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BackButtonProps {
  text?: string;
  href?: string;
  onClick?: () => void;
  icon?: 'chevron' | 'arrow' | 'none' | React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  useBrowserBack?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BackButton({ 
  text = "Back",
  href,
  onClick,
  icon = 'chevron',
  iconPosition = 'left',
  className,
  useBrowserBack = true,
  variant = "outline",
  size = "default",
  ...props 
}: BackButtonProps) {
  const router = useRouter();

  // Handle click navigation
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else if (useBrowserBack) {
      router.back();
    }
  };

  // Render the appropriate icon
  const renderIcon = () => {
    if (icon === 'none') return null;
    if (typeof icon === 'object') return icon;
    
    const IconComponent = icon === 'arrow' ? ArrowLeft : ChevronLeft;
    return <IconComponent className="h-4 w-4" />;
  };

  // Button content with icon and text
  const buttonContent = (
    <>
      {iconPosition === 'left' && renderIcon() && (
        <span className={text ? 'mr-2' : ''}>{renderIcon()}</span>
      )}
      {text}
      {iconPosition === 'right' && renderIcon() && (
        <span className={text ? 'ml-2' : ''}>{renderIcon()}</span>
      )}
    </>
  );

  // If href is provided and no custom onClick, use Link
  if (href && !onClick) {
    return (
      <Link href={href}>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "border-[#34495E] text-[#34495E] hover:bg-[#34495E] hover:text-white",
            className
          )}
          {...props}
        >
          {buttonContent}
        </Button>
      </Link>
    );
  }

  // Default button with click handler
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "border-[#34495E] text-[#34495E] hover:bg-[#34495E] hover:text-white",
        className
      )}
      {...props}
    >
      {buttonContent}
    </Button>
  );
}

// Export variants for easy use
export const BackButtonVariants = {
  Default: (props: Omit<BackButtonProps, 'variant'>) => (
    <BackButton variant="outline" {...props} />
  ),
  Ghost: (props: Omit<BackButtonProps, 'variant'>) => (
    <BackButton variant="ghost" {...props} />
  ),
  Link: (props: Omit<BackButtonProps, 'variant'>) => (
    <BackButton variant="link" {...props} />
  ),
  IconOnly: (props: Omit<BackButtonProps, 'text'>) => (
    <BackButton text="" size="icon" {...props} />
  ),
  Home: (props: Omit<BackButtonProps, 'href' | 'text'>) => (
    <BackButton href="/" text="Home" icon="arrow" {...props} />
  ),
  Dashboard: (props: Omit<BackButtonProps, 'href' | 'text'>) => (
    <BackButton href="/" text="Dashboard" icon="arrow" {...props} />
  ),
}; 