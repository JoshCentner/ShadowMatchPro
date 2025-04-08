import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string, organisationId: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
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
      try {
        // First check for stored userId in localStorage
        const storedUserId = localStorage.getItem('shadowUserId');
        
        if (storedUserId) {
          try {
            const response = await fetch(`/api/auth/me?userId=${storedUserId}`, {
              credentials: 'include',
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              setIsLoading(false);
              return;
            } else {
              // User ID not valid, remove it
              localStorage.removeItem('shadowUserId');
              // Continue to check Supabase session
            }
          } catch (error) {
            console.error('Error checking local authentication:', error);
            localStorage.removeItem('shadowUserId');
            // Continue to check Supabase session
          }
        }
        
        // Check for active Supabase session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking Supabase session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (sessionData.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError || !userData.user) {
            console.error('Error getting Supabase user:', userError);
            setIsLoading(false);
            return;
          }
          
          // We have a Supabase user, fetch or create the user in our system
          const email = userData.user.email;
          const name = userData.user.user_metadata?.name || 
                      userData.user.user_metadata?.full_name || 
                      (email ? email.split('@')[0] : 'User');
          
          if (email) {
            try {
              // Check if we already have this user in our system
              const existingUserResponse = await apiRequest('POST', '/api/auth/google-signin', {
                email,
                name,
                pictureUrl: userData.user.user_metadata?.avatar_url
              });
              
              if (existingUserResponse.ok) {
                const ourUser = await existingUserResponse.json();
                setUser(ourUser);
                localStorage.setItem('shadowUserId', ourUser.id.toString());
              }
            } catch (error) {
              console.error('Error syncing Supabase user with our system:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error in auth check:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const login = async (email: string, name: string, organisationId: number) => {
    try {
      setIsLoading(true);
      
      // Check if we're coming from Google auth
      const session = await supabase.auth.getSession();
      const isGoogleAuth = !!session.data.session;
      
      // Use the appropriate endpoint based on auth type
      const endpoint = isGoogleAuth ? '/api/auth/google-signin' : '/api/auth/register';
      
      // For Google auth, we might have a picture
      let pictureUrl: string | undefined;
      
      if (isGoogleAuth) {
        const userData = await supabase.auth.getUser();
        pictureUrl = userData.data.user?.user_metadata?.avatar_url;
      }
      
      const payload = {
        email,
        name,
        organisationId,
        isAuthenticated: true,
        ...(pictureUrl && { pictureUrl })
      };
      
      const response = await apiRequest('POST', endpoint, payload);
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('shadowUserId', userData.id.toString());
      
      toast({
        title: "Successfully signed in",
        description: `Welcome, ${userData.name}!`,
      });
      
      // If user has no org selected, redirect to profile
      if (!userData.organisationId) {
        navigate('/profile');
      } else {
        navigate('/');
      }
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

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      localStorage.removeItem('shadowUserId');
      navigate('/auth');
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if Supabase logout fails, clear local state
      setUser(null);
      localStorage.removeItem('shadowUserId');
      navigate('/auth');
      
      toast({
        title: "Signed out",
        description: "You have been signed out, but there was an issue with the authentication provider.",
      });
    }
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
  
  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      // Redirect to Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            returnTo: window.location.href
          }
        },
      });
      
      if (error) {
        throw error;
      }
      
      // Nothing more to do here as user will be redirected to Google
      // The callback will handle the rest of the authentication flow
      
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Google Authentication failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};