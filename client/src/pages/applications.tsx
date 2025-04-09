import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import NavigationTabs from '@/components/navigation-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { ApplicationWithDetails } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import { getOrganisationColor } from '@/lib/organisations';

export default function Applications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const { data: applications, isLoading, error } = useQuery<ApplicationWithDetails[]>({
    queryKey: [`/api/users/${user?.id}/applications`],
    enabled: !!user,
  });

  return (
    <>
      <NavigationTabs />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Applications</h1>
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="py-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b last:border-0">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  Error loading applications. Please try again later.
                </div>
              </CardContent>
            </Card>
          ) : applications && applications.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                  {applications.map((application) => (
                    <li key={application.id}>
                      <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getOrganisationColor(application.opportunity.organisation.shortCode)} flex items-center justify-center`}>
                            <span className="text-xs font-medium">{application.opportunity.organisation.shortCode}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{application.opportunity.title}</div>
                            <div className="text-sm text-gray-500">
                              Applied on {application.createdAt ? format(new Date(application.createdAt), 'MMMM d, yyyy') : 'Unknown date'}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${application.opportunity.status.toLowerCase()}`}>
                            {application.opportunity.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">No applications yet</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-6">
                <p className="text-gray-500 mb-6">
                  You haven't applied to any shadowing opportunities yet.
                </p>
                <Link href="/">
                  <a className="text-primary hover:text-primary/80">
                    Browse Opportunities
                  </a>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
