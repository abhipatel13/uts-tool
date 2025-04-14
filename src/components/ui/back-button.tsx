'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className={`border-[rgb(52_73_94_/_1)] text-[rgb(52_73_94_/_1)] hover:bg-[rgb(52_73_94_/_1)] hover:text-white ${className}`}
      onClick={() => router.back()}
    >
      <ChevronLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  );
} 