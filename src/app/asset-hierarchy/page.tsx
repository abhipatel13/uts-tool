"use client"

import { useState } from "react"
import { Plus, Minus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"

interface Asset {
  id: string
  name: string
  description: string
  activeHazardTasks: number
  riskAssessments: number
  criticalityAssessment: number
  inspectionPoints: number
  children?: Asset[]
  level: number
}

const initialAssets: Asset[] = [
  {
    id: "V",
    name: "VTA Maintenance",
    description: "VTA Maintenance Division",
    activeHazardTasks: 0,
    riskAssessments: 0,
    criticalityAssessment: 0,
    inspectionPoints: 0,
    level: 0,
    children: [
      {
        id: "V1",
        name: "VTA Overhaul and Repair Division",
        description: "O&R Division",
        activeHazardTasks: 0,
        riskAssessments: 0,
        criticalityAssessment: 0,
        inspectionPoints: 0,
        level: 1,
        children: [
          {
            id: "V1F",
            name: "O&R Facilities",
            description: "Facilities Management",
            activeHazardTasks: 0,
            riskAssessments: 0,
            criticalityAssessment: 0,
            inspectionPoints: 0,
            level: 2,
            children: [
              {
                id: "V1F-01",
                name: "Facilities - Main Building (G)",
                description: "Main Building",
                activeHazardTasks: 0,
                riskAssessments: 0,
                criticalityAssessment: 0,
                inspectionPoints: 0,
                level: 3,
                children: [
                  {
                    id: "V1F-01-01",
                    name: "Facilities - Plumbing",
                    description: "Plumbing Systems",
                    activeHazardTasks: 0,
                    riskAssessments: 0,
                    criticalityAssessment: 0,
                    inspectionPoints: 0,
                    level: 4,
                  },
                  {
                    id: "V1F-01-02",
                    name: "Facilities - HVAC System",
                    description: "HVAC Systems",
                    activeHazardTasks: 0,
                    riskAssessments: 0,
                    criticalityAssessment: 0,
                    inspectionPoints: 0,
                    level: 4,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

const AssetRow = ({ asset, expanded, onToggle }: { 
  asset: Asset
  expanded: boolean
  onToggle: () => void 
}) => {
  const hasChildren = asset.children && asset.children.length > 0
  
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <div className="flex items-center" style={{ paddingLeft: `${asset.level * 20}px` }}>
          {hasChildren ? (
            <button 
              onClick={onToggle}
              className="mr-2 hover:bg-gray-200 rounded p-1"
            >
              {expanded ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          ) : (
            <span className="w-[28px]" /> // Placeholder for alignment
          )}
          {asset.id}
        </div>
      </td>
      <td className="p-4">{asset.description}</td>
      <td className="p-4 text-center">{asset.activeHazardTasks}</td>
      <td className="p-4 text-center">{asset.riskAssessments}</td>
      <td className="p-4 text-center">{asset.criticalityAssessment}</td>
      <td className="p-4 text-center">{asset.inspectionPoints}</td>
    </tr>
  )
}

const AssetHierarchy = () => {
  const router = useRouter()
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set(["V"]))

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/auth/login")
  }

  const toggleAsset = (assetId: string) => {
    setExpandedAssets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }

  const renderAssetRows = (assets: Asset[]): JSX.Element[] => {
    return assets.reduce((rows: JSX.Element[], asset) => {
      const isExpanded = expandedAssets.has(asset.id)
      
      rows.push(
        <AssetRow
          key={asset.id}
          asset={asset}
          expanded={isExpanded}
          onToggle={() => toggleAsset(asset.id)}
        />
      )

      if (isExpanded && asset.children) {
        rows.push(...renderAssetRows(asset.children))
      }

      return rows
    }, [])
  }

  return (
    <AuthCheck>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(44,62,80)]">Asset Hierarchy</h1>
            <p className="text-gray-600">Manage your asset hierarchy structure here.</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4">Asset</th>
                  <th className="text-left p-4">Asset Description</th>
                  <th className="text-center p-4">Active Hazard Tasks</th>
                  <th className="text-center p-4">Risk Assessments</th>
                  <th className="text-center p-4">Criticality Assessment</th>
                  <th className="text-center p-4">Inspection Points</th>
                </tr>
              </thead>
              <tbody>
                {renderAssetRows(initialAssets)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthCheck>
  )
}

export default AssetHierarchy 