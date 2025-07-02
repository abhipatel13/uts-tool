import { BackButton } from '@/components/ui/back-button';

export default function AIA() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <h1 className="text-2xl font-bold mb-4">AIA Overview</h1>
      <p>Review and manage AIA documentation.</p>
    </div>
  )
} 