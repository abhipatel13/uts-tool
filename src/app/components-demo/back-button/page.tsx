"use client"

import { useState } from 'react';
import { BackButton, BackButtonVariants } from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Settings, User } from 'lucide-react';

export default function BackButtonDemo() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomNavigation = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Custom navigation completed!');
    }, 2000);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">BackButton Component Demo</h1>
        <p className="text-gray-600">Showcasing all variants and usage examples of the BackButton component</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Basic Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Usage</CardTitle>
            <CardDescription>Default back button behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton />
            <BackButton text="Go Back" />
            <BackButton text="Return" />
          </CardContent>
        </Card>

        {/* Navigation Options */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Options</CardTitle>
            <CardDescription>Different navigation methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton href="/" text="Home" />
            <BackButton href="/dashboard" text="Dashboard" />
            <BackButton 
              onClick={handleCustomNavigation}
              text={isLoading ? "Loading..." : "Custom Logic"}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        {/* Icon Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Variations</CardTitle>
            <CardDescription>Different icon options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton icon="chevron" text="Chevron" />
            <BackButton icon="arrow" text="Arrow" />
            <BackButton icon="none" text="No Icon" />
            <BackButton icon={<Home className="h-4 w-4" />} text="Custom Icon" />
            <BackButton iconPosition="right" text="Icon Right" />
          </CardContent>
        </Card>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton variant="outline" text="Outline" />
            <BackButton variant="default" text="Default" />
            <BackButton variant="ghost" text="Ghost" />
            <BackButton variant="link" text="Link" />
          </CardContent>
        </Card>

        {/* Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Sizes</CardTitle>
            <CardDescription>Different button sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton size="sm" text="Small" />
            <BackButton size="default" text="Default" />
            <BackButton size="lg" text="Large" />
            <div className="flex items-center gap-2">
              <BackButton size="icon" text="" />
              <span className="text-sm text-gray-600">Icon Only</span>
            </div>
          </CardContent>
        </Card>

        {/* Pre-built Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-built Variants</CardTitle>
            <CardDescription>Ready-to-use component variants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButtonVariants.Default text="Default Variant" />
            <BackButtonVariants.Ghost text="Ghost Variant" />
            <BackButtonVariants.Link text="Link Variant" />
            <div className="flex items-center gap-2">
              <BackButtonVariants.IconOnly />
              <span className="text-sm text-gray-600">Icon Only Variant</span>
            </div>
          </CardContent>
        </Card>

        {/* Custom Styling */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Styling</CardTitle>
            <CardDescription>Custom colors and styles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton 
              className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
              text="Blue Button"
            />
            <BackButton 
              className="bg-green-500 hover:bg-green-600 text-white border-green-500" 
              text="Green Button"
            />
            <BackButton 
              className="bg-purple-500 hover:bg-purple-600 text-white border-purple-500" 
              text="Purple Button"
            />
          </CardContent>
        </Card>

        {/* Complex Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Complex Examples</CardTitle>
            <CardDescription>Real-world usage scenarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton 
              href="/settings" 
              icon={<Settings className="h-4 w-4" />}
              text="Settings"
              variant="outline"
            />
            <BackButton 
              href="/profile" 
              icon={<User className="h-4 w-4" />}
              text="Profile"
              variant="ghost"
            />
            <BackButton 
              onClick={() => {
                if (confirm('Are you sure you want to go back?')) {
                  window.history.back();
                }
              }}
              text="Confirm Back"
              variant="outline"
            />
          </CardContent>
        </Card>

        {/* States */}
        <Card>
          <CardHeader>
            <CardTitle>Button States</CardTitle>
            <CardDescription>Different button states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BackButton text="Normal" />
            <BackButton text="Disabled" disabled />
            <BackButton 
              text={isLoading ? "Loading..." : "Loading Example"}
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 2000);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Usage Notes</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>The component is fully backward compatible with existing usage</li>
          <li>Default behavior uses browser back() function</li>
          <li>Use <code className="bg-gray-200 px-1 rounded">href</code> prop for specific route navigation</li>
          <li>Use <code className="bg-gray-200 px-1 rounded">onClick</code> prop for custom navigation logic</li>
          <li>All button props from shadcn/ui are supported</li>
          <li>Pre-built variants are available for common use cases</li>
        </ul>
      </div>
    </div>
  );
} 