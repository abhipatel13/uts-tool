"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CommonButton } from "@/components/ui/common-button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { UniversalUserApi } from "@/services/universalUserApi"

type Company = { id: number; name: string }
type Site = { id: number; name: string; company_id: number }

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  onCreated?: () => void
}

interface NewUser {
  email: string
  password: string
  role: string
  company_id?: number
  site_id?: number
  name?: string
  department?: string
  business_unit?: string
  plant?: string
}

export function CreateUserDialog({ isOpen, onOpenChange, companies, onCreated }: Props) {
  const [newUser, setNewUser] = useState<NewUser>({
    email: "",
    password: "",
    role: "user",
    company_id: undefined,
    site_id: undefined,
    name: "",
    department: "",
    business_unit: "",
    plant: "",
  })
  const [sites, setSites] = useState<Site[]>([])
  const [loadingSites, setLoadingSites] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Clear state when dialog closes
    if (!isOpen) {
      setNewUser({
        email: "",
        password: "",
        role: "user",
        company_id: undefined,
        site_id: undefined,
        name: "",
        department: "",
        business_unit: "",
        plant: "",
      })
      setSites([])
    }
  }, [isOpen])

  const handleCompanyChange = async (value: string) => {
    const companyId = value ? parseInt(value) : undefined
    setNewUser({ ...newUser, company_id: companyId, site_id: undefined })
    setSites([])
    if (companyId) {
      try {
        setLoadingSites(true)
        const res = await UniversalUserApi.getSites(companyId)
        if (res.status) setSites(res.data as Site[])
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingSites(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enforce company and site selection for non-universal roles
    if (newUser.role !== "universal_user") {
      if (!newUser.company_id) {
        toast({ title: "Company required", description: "Select a company.", variant: "destructive" })
        return
      }
      if (!newUser.site_id) {
        toast({ title: "Site required", description: "Select a site for the chosen company.", variant: "destructive" })
        return
      }
    }

    try {
      setSubmitting(true)
      const res = await UniversalUserApi.createUser(newUser)
      if (res.status) {
        toast({ title: "Success", description: "User created successfully" })
        onOpenChange(false)
        onCreated?.()
      } else {
        toast({ title: "Error", description: res.message || "Failed to create user", variant: "destructive" })
      }
    } catch (err) {
      console.error("Error creating user:", err)
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <CommonButton className="bg-[#34495E] hover:bg-[#34495E]/90">
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </CommonButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role *</label>
              <Select value={newUser.role} onValueChange={(value) => {
                setNewUser({
                  ...newUser,
                  role: value,
                  company_id: value === 'universal_user' ? undefined : newUser.company_id,
                  site_id: value === 'universal_user' ? undefined : newUser.site_id,
                })
                if (value === 'universal_user') setSites([])
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="universal_user">Universal User</SelectItem>
                  <SelectItem value="superuser">Superuser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <Select value={newUser.company_id?.toString() || ''} onValueChange={handleCompanyChange} disabled={newUser.role === 'universal_user'}>
                <SelectTrigger>
                  <SelectValue placeholder={newUser.role === 'universal_user' ? 'N/A (Universal)' : 'Select company'} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Primary Site</label>
            <Select value={newUser.role === 'universal_user' ? '' : newUser.site_id?.toString() || ''} onValueChange={(v) => setNewUser({ ...newUser, site_id: parseInt(v) })} disabled={newUser.role === 'universal_user' || !newUser.company_id || loadingSites}>
              <SelectTrigger>
                <SelectValue placeholder={newUser.role === 'universal_user' ? 'N/A (Universal)' : (!newUser.company_id ? 'Select company first' : 'Select primary site (optional)')} />
              </SelectTrigger>
              <SelectContent>
                {sites
                  .filter((s) => !newUser.company_id || s.company_id === newUser.company_id)
                  .map((site) => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500 mt-1">Set after user creation from Profile if needed.</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input value={newUser.name || ''} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <Input value={newUser.department || ''} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Unit</label>
              <Input value={newUser.business_unit || ''} onChange={(e) => setNewUser({ ...newUser, business_unit: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plant</label>
              <Input value={newUser.plant || ''} onChange={(e) => setNewUser({ ...newUser, plant: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <CommonButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </CommonButton>
            <CommonButton type="submit" disabled={submitting} className="bg-[#34495E] hover:bg-[#34495E]/90">
              {submitting ? 'Creating...' : 'Create User'}
            </CommonButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


