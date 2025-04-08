import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Auth() {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Example login with preset organization for demo purposes
  const handleDemoLogin = async (organisationId: number) => {
    if (isLoading || isManualLoading) return;
    
    try {
      setIsManualLoading(true);
      
      // For the demo, we use example email with the organization name
      let orgName = "";
      switch (organisationId) {
        case 1:
          orgName = "SEEK";
          break;
        case 2:
          orgName = "REA";
          break;
        case 3:
          orgName = "CarSales";
          break;
        case 4:
          orgName = "Xero";
          break;
        case 5:
          orgName = "CultureAmp";
          break;
        case 6:
          orgName = "MYOB";
          break;
        case 7:
          orgName = "AusPost";
          break;
        default:
          orgName = "Company";
      }
      
      const demoEmail = `user@${orgName.toLowerCase()}.example.com`;
      const demoName = `${orgName} User`;
      
      await login(demoEmail, demoName, organisationId);
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Login Failed",
        description: "Could not complete demo login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManualLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (isLoading || isManualLoading) return;
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Sign in to the Cross-Organisation Shadowing Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 h-12 border-2"
            onClick={handleGoogleLogin}
            disabled={isLoading || isManualLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <FcGoogle className="h-5 w-5" />
                <span>Sign in with Google</span>
              </>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or select a demo organization</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(1)}
              disabled={isLoading || isManualLoading}
            >
              SEEK
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(2)}
              disabled={isLoading || isManualLoading}
            >
              REA
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(3)}
              disabled={isLoading || isManualLoading}
            >
              CarSales
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(4)}
              disabled={isLoading || isManualLoading}
            >
              Xero
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(5)}
              disabled={isLoading || isManualLoading}
            >
              Culture Amp
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(6)}
              disabled={isLoading || isManualLoading}
            >
              MYOB
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleDemoLogin(7)}
              disabled={isLoading || isManualLoading}
            >
              Australia Post
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2">
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to the terms and conditions of the Cross-Organisation Shadowing Platform.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}