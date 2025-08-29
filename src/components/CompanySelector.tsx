"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Search, X } from "lucide-react"
import { UniversalUserApi } from "@/services/universalUserApi"

interface Company {
  id: number;
  name: string;
  description?: string;
}

interface CompanySelectorProps {
  value: number | number[] | null
  onChange: (value: number | number[] | null) => void
  error?: string
  label?: string
  placeholder?: string
  required?: boolean
  multiple?: boolean
}

export function CompanySelector({
  value,
  onChange,
  error,
  label = "Company",
  placeholder = "Select company",
  required = false,
  multiple = false,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const normalizedValue: number[] = useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) return value
      if (typeof value === "number") return [value]
      return []
    } else {
      if (Array.isArray(value)) return value
      if (typeof value === "number") return [value]
      return []
    }
  }, [value, multiple])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true)
        const res = await UniversalUserApi.getAllCompanies()
        if (res.status) {
          setCompanies(res.data)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return companies.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.description ? c.description.toLowerCase().includes(term) : false)
    )
  }, [companies, searchTerm])

  const availableCompanies = useMemo(() => {
    return filteredCompanies.filter(c => !normalizedValue.includes(c.id))
  }, [filteredCompanies, normalizedValue])

  const handleAdd = (companyId: number) => {
    if (multiple) {
      if (!normalizedValue.includes(companyId)) {
        onChange([...normalizedValue, companyId])
      }
    } else {
      onChange(companyId)
      setIsOpen(false)
    }
    setSearchTerm("")
  }

  const handleRemove = (companyId: number) => {
    if (multiple) {
      onChange(normalizedValue.filter(id => id !== companyId))
    } else {
      onChange(null)
    }
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const getDisplayName = (companyId: number) => {
    const c = companies.find(c => c.id === companyId)
    return c ? c.name : String(companyId)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="company-selector">
        {label} {required && "*"}
      </Label>

      {(multiple ? normalizedValue.length > 0 : normalizedValue[0] !== undefined) && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[2.5rem] bg-gray-50">
          {normalizedValue.map((id) => (
            <Badge key={id} variant="secondary" className="flex items-center gap-1">
              {getDisplayName(id)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between ${error ? "border-red-500" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-left">
            {isLoading ? "Loading companies..." : placeholder}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search companies by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 text-center text-gray-500">Loading companies...</div>
              ) : availableCompanies.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  {companies.length === 0 ? "No companies found" : (multiple ? "All companies selected" : "No available companies")}
                </div>
              ) : (
                availableCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleAdd(company.id)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{company.name}</span>
                      </div>
                      {company.description && (
                        <span className="text-xs text-gray-500">{company.description}</span>
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
          {normalizedValue.length} compan{normalizedValue.length === 1 ? "y" : "ies"} selected
        </div>
      )}
    </div>
  )
}


