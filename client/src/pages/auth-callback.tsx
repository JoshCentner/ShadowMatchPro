import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if we're coming back from Supabase auth
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        setError("Authentication failed. Please try again.");
        return;
      }
      
      if (!data.session) {
        setError("No session found. Please try signing in again.");
        return;
      }
      
      try {
        // Get user data from Supabase
        const { data: userData } = await supabase.auth.getUser();
        
        if (!userData.user) {
          setError("Could not fetch user information");
          return;
        }
        
        const { email, user_metadata } = userData.user;
        
        if (!email) {
          setError("Email not found in user data");
          return;
        }
        
        const name = user_metadata?.name || user_metadata?.full_name || email.split('@')[0];
        
        // Pass to our backend to create/get user
        await login(email, name, 0); // 0 for now, user will choose org in profile
        
        // Redirect to home page after successful login
        setLocation("/profile");
      } catch (err) {
        console.error("Error handling auth callback:", err);
        setError("Failed to complete authentication. Please try again.");
      }
    };

    handleAuthCallback();
  }, [login, setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          {error ? (
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Error</h2>
              <p className="text-gray-600">{error}</p>
              <button 
                onClick={() => setLocation("/auth")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <div className="text-center p-6">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Completing sign in...</h2>
              <p className="text-gray-600 mt-2">Please wait while we finish setting up your account.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}