import { BackButton } from '@/components/ui/back-button';

export default function ACRA() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <h1 className="text-2xl font-bold mb-4">ACRA Management</h1>
      <p>Access and manage ACRA documentation.</p>
    </div>
  )
} 