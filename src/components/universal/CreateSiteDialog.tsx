"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CommonButton } from "@/components/ui/common-button"
import { Building2 } from "lucide-react"
import { UniversalUserApi } from "@/services/universalUserApi"
import { useToast } from "@/components/ui/use-toast"

type CompanyOption = { id: number; name: string }

interface CreateSiteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyOption[]
  defaultCompanyId?: number
  onCreated?: () => void
}

export function CreateSiteDialog({ isOpen, onOpenChange, companies, defaultCompanyId, onCreated }: CreateSiteDialogProps) {
  const [siteName, setSiteName] = useState("")
  const [companyId, setCompanyId] = useState<number | undefined>(defaultCompanyId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setCompanyId(defaultCompanyId)
  }, [defaultCompanyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) {
      toast({ title: "Error", description: "Please select a company for the site", variant: "destructive" })
      return
    }
    if (!siteName || siteName.trim() === "") {
      toast({ title: "Error", description: "Please enter a name for the site", variant: "destructive" })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await UniversalUserApi.createSite({ name: siteName.trim(), company_id: companyId })
      if (response.status) {
        toast({ title: "Success", description: "Site created successfully" })
        setSiteName("")
        if (defaultCompanyId) setCompanyId(defaultCompanyId)
        onOpenChange(false)
        onCreated?.()
      } else {
        toast({ title: "Error", description: response.message || "Failed to create site", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error creating site:", error)
      toast({ title: "Error", description: "Failed to create site", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <CommonButton variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
          <Building2 className="w-4 h-4 mr-2" />
          Create Site
        </CommonButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name *</label>
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <Select value={companyId ? String(companyId) : ""} onValueChange={(v) => setCompanyId(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <CommonButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </CommonButton>
            <CommonButton type="submit" disabled={isSubmitting} className="bg-[#34495E] hover:bg-[#34495E]/90">
              {isSubmitting ? "Creating..." : "Create Site"}
            </CommonButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


