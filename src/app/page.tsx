import { AuthCheck } from "@/components/auth-check"

export default function Home() {
  return (
    <AuthCheck>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Welcome to Dashboard</h1>
        <p>Select a menu item from the sidebar to get started.</p>
      </div>
    </AuthCheck>
  );
}
