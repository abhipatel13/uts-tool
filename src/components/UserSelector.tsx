"use client"

import { useState, useEffect, useRef } from 'react'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Search, ChevronDown } from "lucide-react"
import { UserApi } from "@/services"
import type { User } from "@/types"
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
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Normalize value to always work with arrays internally for consistency
  const normalizedValue = multiple 
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (Array.isArray(value) ? value : (value ? [value] : []))

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const response = await UserApi.getAllRestricted()
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

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      user.role.toLowerCase().includes(searchLower) ||
      (user.department && user.department.toLowerCase().includes(searchLower))
    )
  })

  const handleAddUser = (userEmail: string) => {
    if (!userEmail) return

    if (multiple) {
      // Multi-select mode
      if (!normalizedValue.includes(userEmail)) {
        const newValue = [...normalizedValue, userEmail]
        onChange(newValue)
      }
    } else {
      // Single-select mode
      onChange(userEmail)
      setIsOpen(false)
    }
    setSearchTerm("") // Clear search after selection
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
    return user ? `${user.name || 'No Name'} (${user.email})` : email
  }

  const availableUsers = filteredUsers.filter(user => !normalizedValue.includes(user.email))

  const displayValue = multiple ? normalizedValue : (normalizedValue[0] || "")

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

      {/* Custom dropdown for user selection */}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between ${error ? "border-red-500" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-left">
            {isLoadingUsers ? "Loading users..." : placeholder}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, role, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* User list */}
            <div className="max-h-60 overflow-y-auto">
              {isLoadingUsers ? (
                <div className="p-3 text-center text-gray-500">Loading users...</div>
              ) : availableUsers.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  {users.length === 0 ? "No users found" : (multiple ? "All users selected" : "No available users")}
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleAddUser(user.email)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {user.name || 'No Name'}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {user.email}
                      </span>
                      {user.department && (
                        <span className="text-xs text-gray-500">
                          {user.department}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

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