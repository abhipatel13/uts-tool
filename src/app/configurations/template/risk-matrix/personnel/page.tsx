"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"

const PersonnelRiskMatrix = () => {
  const likelihood = [
    { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
    { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
    { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
    { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
    { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
  ]

  const consequences = [
    { label: "Minor", subLabel: "No Lost Time", value: 1 },
    { label: "Significant", subLabel: "Lost Time", value: 2 },
    { label: "Serious", subLabel: "Short Term Disability", value: 3 },
    { label: "Major", subLabel: "Long Term Disability", value: 4 },
    { label: "Catastrophic", subLabel: "Fatality", value: 5 }
  ]

  const getCellColor = (value: number): string => {
    if (value <= 3) return "bg-[#90EE90]" // Light green
    if (value <= 6) return "bg-[#FFFF00]" // Yellow
    if (value <= 12) return "bg-[#FFA500]" // Orange
    return "bg-[#FF0000]" // Red
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Personnel Risk Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 w-32"></th>
                  <th className="border p-2 w-20">Multiplier</th>
                  {consequences.map((cons) => (
                    <th key={cons.label} className="border p-2 text-center w-28">
                      <div className="font-bold">{cons.label}</div>
                      <div className="text-red-500 text-sm font-normal">{cons.subLabel}</div>
                      <div className="font-bold">{cons.value}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {likelihood.map((like) => (
                  <tr key={like.label}>
                    <td className="border p-2">
                      <div className="font-bold">{like.label}</div>
                      <div className="text-red-500 text-sm">{like.value}</div>
                    </td>
                    <td className="border p-2 text-center font-bold h-20 w-40">
                      {like.multiplier}
                    </td>
                    {consequences.map((cons) => {
                      const value = like.multiplier * cons.value
                      return (
                        <td 
                          key={`${like.label}-${cons.label}`}
                          className={`border p-2 text-center font-bold h-20 w-40 ${getCellColor(value)}`}
                        >
                          {value}
                        </td>
                      )
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

export default PersonnelRiskMatrix