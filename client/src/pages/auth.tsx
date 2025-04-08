import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useOrganisations } from '@/lib/organisations';

export default function Auth() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { data: organisations, isLoading: orgsLoading } = useOrganisations();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organisationId, setOrganisationId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !organisationId) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await login(email, name, organisationId);
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Shadow App</CardTitle>
          <CardDescription>
            Sign in to access cross-organisational shadowing opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organisation">Organisation</Label>
              <Select 
                onValueChange={(value) => setOrganisationId(parseInt(value))}
                disabled={orgsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organisations?.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !email || !name || !organisationId}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in with Google'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-center text-gray-500">
          <p className="w-full">
            For the MVP, we're simulating Google Sign-In. In production, this would use real Google OAuth.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
