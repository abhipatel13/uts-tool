"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/ui/back-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MaintenanceRiskMatrix = () => {
  const likelihood = [
    { label: "Very Unlikely", value: "Once in Lifetime\n>75 Years", multiplier: 1 },
    { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
    { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
    { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
    { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
  ]

  const consequences = [
    { label: "Minor", subLabel: "<5% Impact to\nMaintenance\nBudget", value: 1 },
    { label: "Significant", subLabel: "5-10% Impact to\nMaintenance\nBudget", value: 2 },
    { label: "Serious", subLabel: "20-30% Impact to\nMaintenance\nBudget", value: 3 },
    { label: "Major", subLabel: "30-40% Impact to\nMaintenance\nBudget", value: 4 },
    { label: "Catastrophic", subLabel: ">41% Impact to\nMaintenance\nBudget", value: 5 }
  ]

  const getCellColor = (value: number): string => {
    if (value <= 2) return "bg-[#90EE90]" // Light green
    if (value <= 4) return "bg-[#FFFF00]" // Yellow
    if (value <= 12) return "bg-[#FFA500]" // Orange
    return "bg-[#FF0000]" // Red
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-4">
            <Label className="text-sm font-medium">Risk Type:</Label>
            <Select defaultValue="maintenance">
              <SelectTrigger className="w-[180px]">
                <SelectValue>Maintenance</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 w-40">Probability / Severity</th>
                  {consequences.map((cons) => (
                    <th key={cons.label} className="border p-2 text-center w-40">
                      <div className="font-medium">{cons.label}</div>
                      <div className="text-xs whitespace-pre-line text-gray-600">{cons.subLabel}</div>
                      <div className="font-medium mt-1">{cons.value}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {likelihood.map((like) => (
                  <tr key={like.label}>
                    <td className="border p-2">
                      <div className="font-medium">{like.label}</div>
                      <div className="text-xs text-gray-600 whitespace-pre-line">{like.value}</div>
                      <div className="font-medium mt-1">{like.multiplier}</div>
                    </td>
                    {consequences.map((cons) => {
                      const value = like.multiplier * cons.value;
                      return (
                        <td 
                          key={`${like.label}-${cons.label}`}
                          className={`border p-2 text-center font-bold h-20 w-40 ${getCellColor(value)}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MaintenanceRiskMatrix 