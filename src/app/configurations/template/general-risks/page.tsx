"use client"

import { useState } from "react"
import { CommonButton } from "@/components/ui/common-button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

export default function GeneralRisk() {
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
      <h1 className="text-2xl font-bold mb-6">General Risks</h1>
      
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
          <CommonButton 
            onClick={handleAddType}
            size="icon"
          >
            +
          </CommonButton>
        </div>

        <div className="flex justify-end mt-4">
          <CommonButton>
            Save
          </CommonButton>
        </div>
      </div>
    </div>
  )
}
