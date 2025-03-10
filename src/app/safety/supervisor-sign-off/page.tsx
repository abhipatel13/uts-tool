"use client"

import React, { useState, Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

function SupervisorSignOffContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const riskId = searchParams?.get('riskId') || 'unknown'
  
  const [supervisorName, setSupervisorName] = useState("")
  const [signatureData, setSignatureData] = useState("")
  
  // In a real app, you would fetch the risk details based on the riskId
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    router.back()
  }
  
  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Task Hazard
      </Button>
      
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supervisor Sign-off</h1>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <h2 className="text-amber-800 font-medium">High Risk Activity</h2>
          <p className="text-amber-700 text-sm mt-1">
            Risk ID: {riskId}
          </p>
          <p className="text-amber-700 text-sm mt-1">
            This activity has been identified as high risk (score &gt; 9) and requires supervisor approval.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="supervisorName">Supervisor Name</Label>
            <Input 
              id="supervisorName" 
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="Enter supervisor name" 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supervisorSignature">Signature</Label>
            <div className="border rounded-md h-48 flex items-center justify-center text-gray-400 bg-gray-50">
              {/* In a real app, you would integrate a signature pad component here */}
              <div className="text-center">
                <p>Signature Pad</p>
                <p className="text-xs mt-2">Click or touch to sign</p>
                <Input 
                  type="hidden" 
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Submit Signature</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SupervisorSignOff() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading...</div>}>
      <SupervisorSignOffContent />
    </Suspense>
  )
} 