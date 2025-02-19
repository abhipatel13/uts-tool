"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { AuthCheck } from "@/components/auth-check"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface AssetFormData {
  maintenancePlant: string
  primaryKey: string
  cmmsInternalId: string
  functionalLocation: string
  parent: string
  cmmsSystem: string
  siteReferenceName: string
  functionalLocationDesc: string
  functionalLocationLongDesc: string
  objectType: string
  systemStatus: string
  geoPoint: string
  assetType: string
  manufacturer: string
  model: string
  serialNumber: string
}

function AddAssetDialog() {
  const [formData, setFormData] = useState<AssetFormData>({
    maintenancePlant: "",
    primaryKey: "",
    cmmsInternalId: "",
    functionalLocation: "",
    parent: "",
    cmmsSystem: "",
    siteReferenceName: "",
    functionalLocationDesc: "",
    functionalLocationLongDesc: "",
    objectType: "",
    systemStatus: "",
    geoPoint: "",
    assetType: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-[rgb(44,62,80)] hover:bg-[rgb(44,62,80)]/90">
          <Plus className="h-4 w-4" />
          Add New Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-[rgb(44,62,80)]/20">
        <DialogHeader>
          <DialogTitle className="text-[rgb(44,62,80)] text-xl font-bold">Add New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Asset Type</label>
            <Select 
              onValueChange={(value) => setFormData({...formData, assetType: value})}
              value={formData.assetType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="navi">Navi</SelectItem>
                <SelectItem value="maintainable">Maintainable Asset</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Maintenance Plant</label>
            <Input
              value={formData.maintenancePlant}
              onChange={(e) => setFormData({...formData, maintenancePlant: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Primary Key</label>
            <Input
              value={formData.primaryKey}
              onChange={(e) => setFormData({...formData, primaryKey: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">CMMS Internal ID</label>
            <Input
              value={formData.cmmsInternalId}
              onChange={(e) => setFormData({...formData, cmmsInternalId: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Functional Location</label>
            <Input
              value={formData.functionalLocation}
              onChange={(e) => setFormData({...formData, functionalLocation: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Parent</label>
            <Input
              value={formData.parent}
              onChange={(e) => setFormData({...formData, parent: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">CMMS System</label>
            <Input
              value={formData.cmmsSystem}
              onChange={(e) => setFormData({...formData, cmmsSystem: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Site Reference Name</label>
            <Input
              value={formData.siteReferenceName}
              onChange={(e) => setFormData({...formData, siteReferenceName: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.functionalLocationDesc}
              onChange={(e) => setFormData({...formData, functionalLocationDesc: e.target.value})}
              placeholder=""
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Long Description</label>
            <Input
              value={formData.functionalLocationLongDesc}
              onChange={(e) => setFormData({...formData, functionalLocationLongDesc: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Object Type</label>
            <Input
              value={formData.objectType}
              onChange={(e) => setFormData({...formData, objectType: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">System Status</label>
            <Input
              value={formData.systemStatus}
              onChange={(e) => setFormData({...formData, systemStatus: e.target.value})}
              placeholder=""
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Geo Point</label>
            <Input
              value={formData.geoPoint}
              onChange={(e) => setFormData({...formData, geoPoint: e.target.value})}
              placeholder=""
            />
          </div>
          <div>
            <label className="text-sm font-medium">Manufacturer</label>
            <Input
              value={formData.manufacturer}
              onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              placeholder="Enter manufacturer"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Model</label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              placeholder="Enter model"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Serial Number</label>
            <Input
              value={formData.serialNumber}
              onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
              placeholder="Enter serial number"
            />
          </div>

          <Button 
            type="submit" 
            className="col-span-2 bg-[rgb(44,62,80)] hover:bg-[rgb(44,62,80)]/90 text-white font-medium mt-4"
          >
            Add New Asset
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set(["V"]))


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

  const renderAssetRows = (assets: Asset[]): React.ReactElement[] => {
    return assets.reduce((rows: React.ReactElement[], asset) => {
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
          <AddAssetDialog />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4">Asset</th>
                  <th className="text-left p-4">Asset Description</th>
                  <th className="text-center p-4">FMEA</th>
                  <th className="text-center p-4">ACTIONS</th>
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