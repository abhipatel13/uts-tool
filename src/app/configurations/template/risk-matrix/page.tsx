"use client"

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"

const RiskMatrix = () => {
  const [selectedType, setSelectedType] = useState('personnel')

  const riskTypes = [
    { id: 'personnel', label: 'Personnel' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'process', label: 'Process' },
    { id: 'environmental', label: 'Environmental' }
  ]

  const matrixData = {
    personnel: {
      consequences: [
        { label: "Minor Injury", subLabel: "No Lost Time", value: 1 },
        { label: "Significant", subLabel: "Lost Time", value: 2 },
        { label: "Serious Injury", subLabel: "Short Term Disability", value: 3 },
        { label: "Major Injury", subLabel: "Long Term Disability", value: 4 },
        { label: "Catastrophic", subLabel: "Fatality", value: 5 }
      ],
      likelihood: [
        { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
        { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
        { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
        { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
        { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
      ]
    },
    maintenance: {
      consequences: [
        { label: "Minor", subLabel: "<5% Impact to Maintenance Budget", value: 1 },
        { label: "Significant", subLabel: "5-10% Impact to Maintenance Budget", value: 2 },
        { label: "Serious", subLabel: "20-30% Impact to Maintenance Budget", value: 3 },
        { label: "Major", subLabel: "30-40% Impact to Maintenance Budget", value: 4 },
        { label: "Catastrophic", subLabel: ">41% Impact to Maintenance Budget", value: 5 }
      ],
      likelihood: [
        { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
        { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
        { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
        { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
        { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
      ]
    },
    revenue: {
      consequences: [
        { label: "Minor", subLabel: "<2% Impact to Revenue", value: 1 },
        { label: "Significant", subLabel: "2-6% Impact to Revenue", value: 2 },
        { label: "Serious", subLabel: "6-12% Impact to Revenue", value: 3 },
        { label: "Major", subLabel: "12-24% Impact to Revenue", value: 4 },
        { label: "Catastrophic", subLabel: ">25% Impact to Revenue", value: 5 }
      ],
      likelihood: [
        { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
        { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
        { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
        { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
        { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
      ]
    },
    process: {
      consequences: [
        { label: "Minor", subLabel: "Production Loss <10 Days", value: 1 },
        { label: "Significant", subLabel: "Production Loss 10-20 Days", value: 2 },
        { label: "Serious", subLabel: "Production Loss 20-40 Days", value: 3 },
        { label: "Major", subLabel: "Production Loss 40-80 Days", value: 4 },
        { label: "Catastrophic", subLabel: "Production Loss >81 Days", value: 5 }
      ],
      likelihood: [
        { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
        { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
        { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
        { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
        { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
      ]
    },
    environmental: {
      consequences: [
        { label: "Minor", subLabel: "Near Source - Non Reportable - Cleanup <1 Shift", value: 1 },
        { label: "Significant", subLabel: "Near Source - Reportable - Cleanup <1 Shift", value: 2 },
        { label: "Serious", subLabel: "Near Source - Reportable - Cleanup <4 WKS", value: 3 },
        { label: "Major", subLabel: "Near Source - Reportable - Cleanup <52 WKS", value: 4 },
        { label: "Catastrophic", subLabel: "Near Source - Reportable - Cleanup <1WK", value: 5 }
      ],
      likelihood: [
        { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
        { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
        { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
        { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
        { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
      ]
    }
  }

  const getCellColor = (value: number): string => {
    // Green cells
    if ((value === 1) || (value === 2)) return "bg-[#90EE90]";
    // Yellow cells
    if ([3, 4, 5, 6, 8, 9].includes(value)) return "bg-[#FFFF00]";
    // Orange cells
    if ([10, 12, 15].includes(value)) return "bg-[#FFA500]";
    // Red cells
    if ([16, 20, 25].includes(value)) return "bg-[#FF0000]";
    return "bg-white"; // Default color
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <BackButton text="Back" />
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Risk Matrix Configuration</h1>
      </div>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-4">Risk Categories</h2>
            <div className="flex gap-2">
              {riskTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"}
                  className={`px-6 ${
                    selectedType === type.id 
                      ? "bg-[#00A3FF] hover:bg-[#00A3FF]/90 text-white" 
                      : "border-[#00A3FF] text-[#00A3FF] hover:bg-[#00A3FF] hover:text-white"
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left min-w-[200px]">
                    <div className="text-base font-medium text-[#2C3E50]">Probability / Severity</div>
                  </th>
                  {matrixData[selectedType as keyof typeof matrixData]?.consequences.map((cons) => (
                    <th key={cons.label} className="p-4 text-center border-l min-w-[200px]">
                      <div className="font-medium text-[#2C3E50]">{cons.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{cons.subLabel}</div>
                      <div className="font-medium mt-2">{cons.value}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData[selectedType as keyof typeof matrixData]?.likelihood.map((like) => (
                  <tr key={like.label} className="border-b">
                    <td className="p-4 border-r min-w-[200px]">
                      <div className="font-medium text-[#2C3E50]">{like.label}</div>
                      <div className="text-sm text-red-500">{like.value}</div>
                      <div className="font-medium mt-2">{like.multiplier}</div>
                    </td>
                    {matrixData[selectedType as keyof typeof matrixData]?.consequences.map((cons) => {
                      const value = like.multiplier * cons.value;
                      return (
                        <td 
                          key={`${like.label}-${cons.label}`} 
                          className={`${getCellColor(value)} text-center border min-w-[200px] h-[200px] align-middle text-xl font-medium`}
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

export default RiskMatrix