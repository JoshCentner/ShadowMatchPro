import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import NavigationTabs from '@/components/navigation-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { useOrganisations } from '@/lib/organisations';
import { User } from '@shared/schema';
import { uploadProfileImage } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, Loader2 } from 'lucide-react';

// Profile form validation schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organisationId: z.number().positive('Please select an organisation').optional(),
  currentRole: z.string().optional(),
  lookingFor: z.string().optional(),
});

export default function Profile() {
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { data: organisations, isLoading: orgsLoading } = useOrganisations();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set up form with react-hook-form
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      organisationId: 0,
      currentRole: '',
      lookingFor: '',
    },
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Update form when user data changes
  useEffect(() => {
    console.log('Profile - Current user data:', user);
    if (user) {
      const formData = {
        name: user.name,
        organisationId: user.organisation_id || 0,
        currentRole: user.role_title || '',
        lookingFor: user.looking_for || '',
      };
      console.log('Profile - Setting form data:', formData);
      form.reset(formData);
    }
  }, [user, form]);

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    console.log('Profile form submission - Form values:', data);
    console.log('Profile form submission - Current user:', user);
    
    try {
      const result = await updateProfile(data as Partial<User>);
      console.log('Profile update response:', result);
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Validate file type and size
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file (JPEG, PNG, GIF, or WebP).",
        variant: "destructive",
      });
      return;
    }
    
    // 5MB limit
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB in size.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Show initial toast
      toast({
        title: "Uploading profile picture",
        description: "Your profile picture is being uploaded...",
      });
      
      // Upload image to Supabase
      const publicUrl = await uploadProfileImage(file, user.id);
      
      // If we get here, the upload was successful
      // Update user profile with new image URL
      await updateProfile({ pictureUrl: publicUrl });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      
      // Handle specific error messages
      let errorMessage = "Could not upload your profile picture. Please try again.";
      
      if (error.message) {
        if (error.message.includes('not initialized')) {
          errorMessage = "The storage system is initializing. Please try again in a moment.";
        } else if (error.message.includes('not set up') || error.message.includes('does not exist')) {
          errorMessage = "The profile image storage is not properly set up. Please contact an administrator.";
        } else if (error.message.includes('policy')) {
          errorMessage = "You don't have permission to upload files. Please contact an administrator.";
        } else if (error.message.includes('5MB')) {
          errorMessage = "The file size exceeds the maximum allowed size (5MB).";
        } else {
          // Use the actual error message when available
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NavigationTabs />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <div className="relative group">
                  <Avatar className="h-16 w-16 relative">
                    {user.pictureUrl ? (
                      <AvatarImage src={user.pictureUrl} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-gray-200 text-gray-500 text-xl">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <button 
                    type="button"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-white" />
                    )}
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleProfileImageUpload}
                    disabled={isUploading}
                  />
                </div>
                
                <div className="ml-4">
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="organisationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organisation</FormLabel>
                        <Select
                          disabled={orgsLoading}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organisation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organisations?.map((org) => (
                              <SelectItem key={org.id} value={org.id.toString()}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Product Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lookingFor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What you're looking for</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you're interested in learning through shadowing..."
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save Profile</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
