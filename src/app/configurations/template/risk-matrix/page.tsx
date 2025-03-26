"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SeverityLevel {
  title: string
  subtitle: string
  value: number
}

interface ProbabilityLevel {
  title: string
  description: string
  value: number
}

export default function RiskMatrix() {
  const [activeCategory, setActiveCategory] = useState<string>("Personel")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ prob: number; sev: number } | null>(null)
  const [cellColors, setCellColors] = useState<Record<string, string>>({})

  const categories: string[] = [
    "Personel",
    "Maintenance",
    "Revenue",
    "Process",
    "Environmental"
  ]

  const severityLevels: SeverityLevel[] = [
    { title: "Minor Injury", subtitle: "No Lost time", value: 1 },
    { title: "Significant", subtitle: "Lost time", value: 2 },
    { title: "Serious Injury", subtitle: "Short Term Disability", value: 3 },
    { title: "Major Injury", subtitle: "Long Term Disability", value: 4 },
    { title: "Catastrophic", subtitle: "Fatality", value: 5 }
  ]

  const probabilityLevels: ProbabilityLevel[] = [
    { title: "Very Unlikely", description: "Once in Lifetime > 75 Years", value: 1 },
    { title: "Slight Chance", description: "Once in 10 to 75 Years", value: 2 },
    { title: "Feasible", description: "Once in 10 Years", value: 3 },
    { title: "Likely", description: "Once in 2 to 10 Years", value: 4 },
    { title: "Very Likely", description: "Multiple times in 2 Years", value: 5 }
  ]

  const getRiskLevel = (score: number): string => {
    if (score <= 2) return "bg-green-500"
    if (score <= 6) return "bg-yellow-400"
    if (score <= 12) return "bg-orange-500"
    return "bg-red-500"
  }

  const handleCellClick = (prob: number, sev: number) => {
    setSelectedCell({ prob, sev })
    setShowColorPicker(true)
  }

  const handleColorSelect = (color: string) => {
    if (selectedCell) {
      const cellKey = `${selectedCell.prob}-${selectedCell.sev}`
      setCellColors(prev => ({
        ...prev,
        [cellKey]: color
      }))
      setShowColorPicker(false)
      setSelectedCell(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Risk Matrix Configuration</h1>
          <Button 
            className="bg-[#00A6ED] hover:bg-[#0094d4] px-8"
          >
            Save Changes
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Risk Categories</h2>
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`py-2 px-6 rounded-full transition-all ${
                    activeCategory === category 
                      ? "bg-[#00A6ED] text-white shadow-sm" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Matrix Header */}
            <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-4">
              <div className="flex items-end justify-center p-2">
                <span className="text-sm font-medium text-gray-500">Probability / Severity</span>
              </div>
              {severityLevels.map((severity) => (
                <div
                  key={severity.value}
                  className="space-y-2"
                >
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="font-medium text-gray-900">{severity.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{severity.subtitle}</div>
                    <div className="text-sm font-medium text-gray-900 mt-2">{severity.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Probability Rows */}
            {probabilityLevels.map((probability) => (
              <div
                key={probability.value}
                className="grid grid-cols-[200px_repeat(5,1fr)] gap-4"
              >
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{probability.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{probability.description}</div>
                  <div className="text-sm font-medium text-gray-900 mt-2 text-center">{probability.value}</div>
                </div>

                {severityLevels.map((severity) => {
                  const score = probability.value * severity.value;
                  const cellKey = `${probability.value}-${severity.value}`;
                  const customColor = cellColors[cellKey];
                  return (
                    <div
                      key={`${probability.value}-${severity.value}`}
                      className="bg-white rounded-lg border-2 border-gray-100 p-4 flex items-center justify-center cursor-pointer hover:border-[#00A6ED] transition-colors"
                      onClick={() => handleCellClick(probability.value, severity.value)}
                    >
                      <div
                        className={`${customColor || getRiskLevel(score)} w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm`}
                      >
                        {score}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Select Risk Level Color</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-6">
            <button className="h-24 bg-green-500 rounded-xl hover:opacity-90 shadow-sm transition-all" 
              onClick={() => handleColorSelect('bg-green-500')} />
            <button className="h-24 bg-yellow-400 rounded-xl hover:opacity-90 shadow-sm transition-all" 
              onClick={() => handleColorSelect('bg-yellow-400')} />
            <button className="h-24 bg-orange-500 rounded-xl hover:opacity-90 shadow-sm transition-all" 
              onClick={() => handleColorSelect('bg-orange-500')} />
            <button className="h-24 bg-red-500 rounded-xl hover:opacity-90 shadow-sm transition-all" 
              onClick={() => handleColorSelect('bg-red-500')} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}