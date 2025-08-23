"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BarChart3, Shield, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();

  const analyticsModules = [
    {
      title: "Task Hazard Analytics",
      description: "View and analyze task hazard data across all companies with comprehensive filtering and statistics.",
      icon: Shield,
      href: "/universal-portal/analytics/task-hazard",
      color: "bg-blue-500",
      stats: "Comprehensive task hazard insights"
    },
    {
      title: "Risk Assessment Analytics",
      description: "Analyze risk assessment data from all companies with risk level analysis and approval tracking.",
      icon: TrendingUp,
      href: "/universal-portal/analytics/risk-assessment",
      color: "bg-green-500",
      stats: "Risk analysis and monitoring"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive analytics across all companies</p>
        </div>
        <div className="text-sm text-gray-500">
          Universal Portal - All Companies
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics Modules</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsModules.length}</div>
            <p className="text-xs text-muted-foreground">
              Available analytics tools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cross-Company Data</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">All Companies</div>
            <p className="text-xs text-muted-foreground">
              Unified data access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Up-to-date information
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analyticsModules.map((module) => (
          <Card key={module.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <p className="text-sm text-gray-600">{module.stats}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{module.description}</p>
              <Button 
                onClick={() => router.push(module.href)}
                className="w-full"
              >
                Open Analytics
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/universal-portal/analytics/task-hazard")}
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>Task Hazard Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/universal-portal/analytics/risk-assessment")}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Risk Assessment Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
