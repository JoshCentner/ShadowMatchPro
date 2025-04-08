import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string, organisationId: number) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const storedUserId = localStorage.getItem('shadowUserId');
      
      if (storedUserId) {
        try {
          const response = await fetch(`/api/auth/me?userId=${storedUserId}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('shadowUserId');
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          localStorage.removeItem('shadowUserId');
        }
      }
      
      setIsLoading(false);
    };
    
    checkUser();
  }, []);

  const login = async (email: string, name: string, organisationId: number) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/register', {
        email,
        name,
        organisationId,
        isAuthenticated: true,
      });
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('shadowUserId', userData.id.toString());
      
      toast({
        title: "Successfully signed in",
        description: `Welcome, ${userData.name}!`,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Authentication failed",
        description: "Could not complete the sign-in process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shadowUserId');
    navigate('/auth');
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await apiRequest('PUT', `/api/users/${user.id}`, userData);
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};