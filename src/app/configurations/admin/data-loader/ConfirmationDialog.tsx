"use client"

import { ReactNode } from 'react'
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'warning' | 'info' | 'danger'
  onConfirm: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const iconColors = {
    warning: 'text-yellow-500',
    info: 'text-blue-500',
    danger: 'text-red-500',
  }

  const buttonColors = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
  }

  const Icon = variant === 'info' ? Info : AlertTriangle

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${iconColors[variant]}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-gray-600">
              {description}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <Button 
            onClick={handleConfirm}
            className={buttonColors[variant]}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

