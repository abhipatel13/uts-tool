"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PersonnelRiskMatrix = () => {
  const likelihood = [
    { label: "Very Unlikely", value: "Once in Lifetime >75 Years", multiplier: 1 },
    { label: "Slight Chance", value: "Once in 10 to 75 Years", multiplier: 2 },
    { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
    { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
    { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
  ]

  const consequences = [
    { label: "Minor Injury", subLabel: "No Lost Time", value: 1 },
    { label: "Significant", subLabel: "Lost Time", value: 2 },
    { label: "Serious Injury", subLabel: "Short Term Disability", value: 3 },
    { label: "Major Injury", subLabel: "Long Term Disability", value: 4 },
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
                      <div className="text-sm">{cons.subLabel}</div>
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
                    <td className="border p-2 text-center font-bold">
                      {like.multiplier}
                    </td>
                    {consequences.map((cons) => {
                      const value = like.multiplier * cons.value
                      return (
                        <td 
                          key={`${like.label}-${cons.label}`}
                          className={`border p-2 text-center font-bold ${getCellColor(value)}`}
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

          {/* Example Risk Matrix */}
          <div className="mt-8">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 w-24">Multiplier</th>
                  <th className="border p-2">
                    <div>Minor Injury</div>
                    <div className="text-sm">No Lost Time</div>
                    <div>1</div>
                  </th>
                  <th className="border p-2">
                    <div>Significant</div>
                    <div className="text-sm">Lost Time</div>
                    <div>2</div>
                  </th>
                  <th className="border p-2">
                    <div>Serious Injury</div>
                    <div className="text-sm">Short Term Disability</div>
                    <div>3</div>
                  </th>
                  <th className="border p-2">
                    <div>Major Injury</div>
                    <div className="text-sm">Long Term Disability</div>
                    <div>4</div>
                  </th>
                  <th className="border p-2">
                    <div>Catastrophic</div>
                    <div className="text-sm">Fatality</div>
                    <div>5</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Feasible", value: "Once in 10 Years", multiplier: 3 },
                  { label: "Likely", value: "Once in 2 to 10 Years", multiplier: 4 },
                  { label: "Very Likely", value: "Multiple times in 2 Years", multiplier: 5 }
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="border p-2 text-center">{row.multiplier}</td>
                    {[1, 2, 3, 4, 5].map((col) => {
                      const value = row.multiplier * col
                      return (
                        <td 
                          key={`${row.label}-${col}`}
                          className={`border p-2 text-center font-bold ${getCellColor(value)}`}
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