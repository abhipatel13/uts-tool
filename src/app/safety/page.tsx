import { BackButtonVariants } from '@/components/ui/back-button';

export default function Safety() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButtonVariants.Dashboard />
      </div>
      <h1 className="text-2xl font-bold mb-4">Safety Overview</h1>
      <p>View and manage safety-related information.</p>
    </div>
  )
} 