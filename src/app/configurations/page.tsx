'use client';
import { BackButtonVariants } from '@/components/ui/back-button';

export default function Configurations() {
    return (
      <div className="p-8">
        <div className="mb-6">
          <BackButtonVariants.Dashboard />
        </div>
        <h1 className="text-2xl font-bold mb-4">Configurations</h1>
        <p>Manage configurations and settings.</p>
      </div>
    )
  } 