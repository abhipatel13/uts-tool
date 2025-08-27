"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

import { AlertTriangle, Shield, Settings, Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface MitigatingActionTrigger {
  id: string
  riskType: string
  triggerScore: number
  requiresApproval: boolean
  autoTrigger: boolean
  notificationEnabled: boolean
  description: string
}

export default function MitigatingActionTriggerPage() {
  const [triggers, setTriggers] = useState<MitigatingActionTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Default triggers for different risk types
  const defaultTriggers: MitigatingActionTrigger[] = [
    {
      id: "1",
      riskType: "Personnel",
      triggerScore: 12,
      requiresApproval: true,
      autoTrigger: false,
      notificationEnabled: true,
      description: "Triggers when personnel risk score reaches 12 or higher"
    },
    {
      id: "2",
      riskType: "Environmental",
      triggerScore: 15,
      requiresApproval: true,
      autoTrigger: false,
      notificationEnabled: true,
      description: "Triggers when environmental risk score reaches 15 or higher"
    },
    {
      id: "3",
      riskType: "Process",
      triggerScore: 10,
      requiresApproval: false,
      autoTrigger: true,
      notificationEnabled: true,
      description: "Triggers when process risk score reaches 10 or higher"
    },
    {
      id: "4",
      riskType: "Revenue",
      triggerScore: 8,
      requiresApproval: false,
      autoTrigger: true,
      notificationEnabled: true,
      description: "Triggers when revenue risk score reaches 8 or higher"
    },
    {
      id: "5",
      riskType: "Maintenance",
      triggerScore: 16,
      requiresApproval: true,
      autoTrigger: false,
      notificationEnabled: true,
      description: "Triggers when maintenance risk score reaches 16 or higher"
    }
  ]

  useEffect(() => {
    // Load triggers from localStorage or use defaults
    const savedTriggers = localStorage.getItem('mitigatingActionTriggers')
    if (savedTriggers) {
      setTriggers(JSON.parse(savedTriggers))
    } else {
      setTriggers(defaultTriggers)
    }
    setLoading(false)
  }, [defaultTriggers])

  const updateTrigger = (id: string, updates: Partial<MitigatingActionTrigger>) => {
    setTriggers(prev => prev.map(trigger => 
      trigger.id === id ? { ...trigger, ...updates } : trigger
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('mitigatingActionTriggers', JSON.stringify(triggers))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success",
        description: "Mitigating action triggers have been saved successfully.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to save mitigating action triggers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setTriggers(defaultTriggers)
    toast({
      title: "Reset",
      description: "Triggers have been reset to default values.",
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mitigating Action Trigger Preferences</h1>
        <p className="text-gray-600">
          Configure when mitigating actions should be automatically triggered based on risk assessment scores.
        </p>
      </div>

      <div className="grid gap-6">
        {triggers.map((trigger) => (
          <Card key={trigger.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{trigger.riskType} Risk</CardTitle>
                    <CardDescription>{trigger.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Trigger Score: {trigger.triggerScore}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`score-${trigger.id}`} className="text-sm font-medium">
                    Trigger Score
                  </Label>
                  <Input
                    id={`score-${trigger.id}`}
                    type="number"
                    min="1"
                    max="25"
                    value={trigger.triggerScore}
                    onChange={(e) => updateTrigger(trigger.id, { triggerScore: parseInt(e.target.value) || 1 })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Risk score at which to trigger action
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Requires Approval</Label>
                  <div className="flex items-center space-x-2 mt-1">
                                         <Switch
                       checked={trigger.requiresApproval}
                       onCheckedChange={(checked: boolean) => updateTrigger(trigger.id, { requiresApproval: checked })}
                     />
                    <span className="text-sm text-gray-600">
                      {trigger.requiresApproval ? "Yes" : "No"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supervisor approval required
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Auto Trigger</Label>
                  <div className="flex items-center space-x-2 mt-1">
                                         <Switch
                       checked={trigger.autoTrigger}
                       onCheckedChange={(checked: boolean) => updateTrigger(trigger.id, { autoTrigger: checked })}
                     />
                    <span className="text-sm text-gray-600">
                      {trigger.autoTrigger ? "Yes" : "No"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically create action
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Notifications</Label>
                  <div className="flex items-center space-x-2 mt-1">
                                         <Switch
                       checked={trigger.notificationEnabled}
                       onCheckedChange={(checked: boolean) => updateTrigger(trigger.id, { notificationEnabled: checked })}
                     />
                    <span className="text-sm text-gray-600">
                      {trigger.notificationEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Send notifications when triggered
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={resetToDefaults}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">How it works</h3>
            <p className="text-sm text-blue-700">
              When a risk assessment score meets or exceeds the trigger score for its risk type, 
              the system will automatically create a mitigating action task. If approval is required, 
              the task will be sent to a supervisor for review before implementation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 