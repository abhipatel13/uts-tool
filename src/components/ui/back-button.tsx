'use client';

import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /**
   * Custom text to display. Defaults to "Back"
   */
  text?: string;
  
  /**
   * Custom href to navigate to instead of using router.back()
   */
  href?: string;
  
  /**
   * Custom onClick handler. If provided, will override default navigation
   */
  onClick?: () => void;
  
  /**
   * Icon variant to use
   */
  icon?: 'chevron' | 'arrow' | 'none' | React.ReactNode;
  
  /**
   * Whether to show icon on the left or right of text
   */
  iconPosition?: 'left' | 'right';
  
  /**
   * Custom className for styling
   */
  className?: string;
  
  /**
   * Whether to use browser back functionality (default: true)
   */
  useBrowserBack?: boolean;
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
            "border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)] hover:text-white",
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
        "border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)] hover:text-white",
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