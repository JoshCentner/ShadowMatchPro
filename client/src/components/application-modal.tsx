import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: number;
}

export default function ApplicationModal({ 
  isOpen, 
  onClose,
  opportunityId
}: ApplicationModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to apply for opportunities',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest('POST', '/api/applications', {
        userId: user.id,
        opportunityId,
        message
      });
      
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted successfully',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/opportunities/${opportunityId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/applications`] });
      
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for Shadowing</DialogTitle>
          <DialogDescription>
            Tell us what you hope to get out of this shadowing opportunity. This will be visible to the opportunity creator.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="I'm interested in learning more about..."
            className="w-full"
          />
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
