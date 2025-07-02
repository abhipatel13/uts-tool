import { BackButton } from '@/components/ui/back-button';

export default function Criticality() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Criticality Analysis</h1>
      <p>Evaluate and manage asset criticality.</p>
    </div>
  )
} 