"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CommonButton } from "@/components/ui/common-button"
import { useToast } from "@/components/ui/use-toast"
import { UniversalUserApi } from "@/services/universalUserApi"
import { Label } from "@radix-ui/react-label"
import { User } from "@/types/user"

type Company = { id: number; name: string }

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  companies: Company[]
  user?: User
  onSaved?: () => void
}

interface FormUser {
  email: string
  password: string
  role: string
  company_id?: number
  name: string
  department?: string
  phone?: string
}

export function UserDialog({ isOpen, onOpenChange, companies, user, onSaved }: Props) {
  const isEditMode = Boolean(user)

  const [formUser, setFormUser] = useState<FormUser>({
    email: "",
    password: "",
    role: "user",
    company_id: undefined,
    name: "",
    department: "",
    phone: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && user) {
        console.log(user)
        setFormUser({
          email: user.email || "",
          role: user.role || "user",
          company_id: user.company_id ?? user.company?.id,
          name: user.name || "",
          phone: user.phone || "",
          department: user.department || "",
          password: "",
        })

      } else {
        setFormUser({
          email: "",
          password: "",
          role: "user",
          company_id: undefined,
          name: "",
          phone: "",
          department: "",
        })
      }
    } else {
      // Reset when closing
      setFormUser({
        email: "",
        password: "",
        role: "user",
        company_id: undefined,
        name: "",
        phone: "",
        department: "",
      })
    }
  }, [isOpen, isEditMode, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formUser.company_id) {
      toast({ title: "Company required", description: "Select a company.", variant: "destructive" })
      return
    }

    try {
      setSubmitting(true)
      if (isEditMode && user) {
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...updateBody } = formUser
        const res = await UniversalUserApi.updateUser(user.id, updateBody)
        if (res.status) {
          toast({ title: "Success", description: "User updated successfully" })
          onOpenChange(false)
          onSaved?.()
        } else {
          toast({ title: "Error", description: res.message || "Failed to update user", variant: "destructive" })
        }
      } else {
        const res = await UniversalUserApi.createUser(formUser)
        if (res.status) {
          toast({ title: "Success", description: "User created successfully" })
          onOpenChange(false)
          onSaved?.()
        } else {
          toast({ title: "Error", description: res.message || "Failed to create user", variant: "destructive" })
        }
      }
    } catch (err) {
      console.error("Error saving user:", err)
      toast({ title: "Error", description: "Failed to save user", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formUser.name}
              onChange={(e) => setFormUser({ ...formUser, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formUser.email}
              onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
              required
            />
          </div>
          {!isEditMode && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formUser.password || ""}
                onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formUser.role} onValueChange={(value) => setFormUser({ ...formUser, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superuser">Superuser</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Select
              value={formUser.company_id?.toString() || ''}
              onValueChange={(value) => setFormUser({ ...formUser, company_id: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
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
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formUser.phone}
              onChange={(e) => setFormUser({ ...formUser, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formUser.department}
              onChange={(e) => setFormUser({ ...formUser, department: e.target.value })}
            />
          </div>
          <CommonButton type="submit" disabled={submitting}>{isEditMode ? "Update User" : "Create User"}</CommonButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}


