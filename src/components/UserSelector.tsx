"use client"

import React, { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { userApi, type User } from "@/services/userApi"
import { useToast } from "@/components/ui/use-toast"

interface UserSelectorProps {
  value: string | string[] // Single string for single select, array for multi-select
  onChange: (users: string | string[]) => void
  error?: string
  label?: string
  placeholder?: string
  required?: boolean
  multiple?: boolean // Whether to allow multiple selections
  roleFilter?: string[] // Filter users by specific roles
}

export function UserSelector({
  value,
  onChange,
  error,
  label = "Users",
  placeholder = "Select users",
  required = false,
  multiple = false,
  roleFilter
}: UserSelectorProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [selectedValue, setSelectedValue] = useState<string>("")

  // Normalize value to always work with arrays internally for consistency
  const normalizedValue = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (Array.isArray(value) ? value : (value ? [value] : []))

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const response = await userApi.getAllRestricted()
        let filteredUsers = response.data
        
        // Apply role filter if specified
        if (roleFilter && roleFilter.length > 0) {
          filteredUsers = response.data.filter(user => 
            roleFilter.includes(user.role)
          )
        }
        
        setUsers(filteredUsers)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [toast, roleFilter])

  const handleAddUser = (userEmail: string) => {
    if (!userEmail) return

    if (multiple) {
      // Multi-select mode
      if (!normalizedValue.includes(userEmail)) {
        const newValue = [...normalizedValue, userEmail]
        onChange(newValue)
        setSelectedValue("") // Reset the select
      }
    } else {
      // Single-select mode
      onChange(userEmail)
      setSelectedValue("")
    }
  }

  const handleRemoveUser = (userEmail: string) => {
    if (multiple) {
      const newValue = normalizedValue.filter(email => email !== userEmail)
      onChange(newValue)
    } else {
      onChange("")
    }
  }

  const getDisplayName = (email: string) => {
    const user = users.find(u => u.email === email)
    return user ? `${user.email} (${user.role})` : email
  }

  const availableUsers = users.filter(user => !normalizedValue.includes(user.email))

  const displayValue = multiple ? normalizedValue : (normalizedValue[0] || "")

  return (
    <div className="space-y-2">
      <Label htmlFor="user-selector">
        {label} {required && "*"}
      </Label>
      
      {/* Display selected users for multi-select or single select with value */}
      {((multiple && normalizedValue.length > 0) || (!multiple && displayValue)) && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[2.5rem] bg-gray-50">
          {normalizedValue.map((email) => (
            <Badge key={email} variant="secondary" className="flex items-center gap-1">
              {getDisplayName(email)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveUser(email)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new user selector */}
      {(multiple || !displayValue) && (
        <Select
          value={selectedValue}
          onValueChange={handleAddUser}
        >
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingUsers ? (
              <SelectItem value="loading" disabled>Loading users...</SelectItem>
            ) : availableUsers.length === 0 ? (
              <SelectItem value="none" disabled>
                {users.length === 0 ? "No users found" : (multiple ? "All users selected" : "No available users")}
              </SelectItem>
            ) : (
              availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.email}>
                  {user.email} ({user.role})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {error && (
        <span className="text-red-500 text-xs">{error}</span>
      )}
      
      {multiple && normalizedValue.length > 0 && (
        <div className="text-sm text-gray-600">
          {normalizedValue.length} user{normalizedValue.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
} 