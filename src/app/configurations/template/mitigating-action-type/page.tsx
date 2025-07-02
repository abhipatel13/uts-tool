"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { BackButton } from "@/components/ui/back-button"

export default function MitigatingActionType() {
  const [types, setTypes] = useState<string[]>([])
  const [newType, setNewType] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const handleAddType = () => {
    if (newType.trim()) {
      setTypes([...types, newType.trim()])
      setNewType("")
    }
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <h1 className="text-2xl font-bold mb-6">Mitigating Action Type</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {types.map((type, index) => (
            <div key={index} className="flex items-center gap-2">
              <Checkbox
                id={`type-${index}`}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <label htmlFor={`type-${index}`} className="text-sm">
                {type}
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-2 items-center mb-4">
          <Input
            placeholder="Type your own"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="max-w-md"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddType()
              }
            }}
          />
          <Button 
            onClick={handleAddType}
            size="icon"
            className="bg-[#00A6ED] hover:bg-[#0094d4] rounded-full h-8 w-8"
          >
            +
          </Button>
        </div>

        <div className="flex justify-end mt-4">
          <Button 
            className="bg-[#00A6ED] hover:bg-[#0094d4]"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
