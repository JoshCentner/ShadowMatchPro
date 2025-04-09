import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ChevronLeft, Edit } from 'lucide-react';
import NavigationTabs from '@/components/navigation-tabs';
import ApplicationModal from '@/components/application-modal';
import { OpportunityWithDetails } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import { getOrganisationColor } from '@/lib/organisations';

export default function OpportunityDetail() {
  const [, params] = useRoute('/opportunities/:id');
  const opportunityId = params?.id ? parseInt(params.id) : null;
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: opportunity, isLoading, error } = useQuery<OpportunityWithDetails>({
    queryKey: [`/api/opportunities/${opportunityId}`],
    enabled: !!opportunityId,
    onSuccess: (data) => {
      console.log('Opportunity Detail Data:', {
        raw: data,
        duration: data?.duration_limit,
        durationLimit: data?.durationLimit,
        host: data?.host_details,
        hostDetails: data?.hostDetails
      });
    }
  });

  // Determine if the current user is the creator
  const isCreator = user && opportunity && user.id === opportunity.createdByUserId;
  
  // Determine if the user has already applied
  const hasApplied = user && opportunity?.applications?.some(app => {
    return app.userId === user.id || app.user_id === user.id;
  });
  
  // Format the learning outcomes as an array
  const learningOutcomes = opportunity?.learningAreas.map(area => area.name) || [];

  return (
    <>
      <NavigationTabs />
      
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <a className="inline-flex items-center">
                  <ChevronLeft className="-ml-0.5 mr-2 h-4 w-4" />
                  Back to Opportunities
                </a>
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Skeleton className="h-7 w-64 mb-2" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-full md:col-span-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-full md:col-span-2" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Skeleton className="h-5 w-20" />
                    <div className="md:col-span-2">
                      <Skeleton className="h-12 w-full mb-2" />
                      <Skeleton className="h-12 w-full mb-2" />
                      <Skeleton className="h-12 w-full mb-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  Error loading opportunity details. Please try again later.
                </div>
              </CardContent>
            </Card>
          ) : opportunity ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{opportunity.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {opportunity.organisation.name}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium status-${opportunity.status.toLowerCase()}`}>
                  {opportunity.status}
                </span>
              </div>
              
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Format</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{opportunity.format}</dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{opportunity.duration_limit}</dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{opportunity.description}</dd>
                  </div>
                  
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Host Details</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{opportunity.host_details || 'No host details provided'}</dd>
                  </div>
                  
                  {learningOutcomes.length > 0 && (
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">You will learn</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {learningOutcomes.map((outcome, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-start text-sm">
                              <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                              <span className="ml-2 flex-1">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  
                  {opportunity.hostDetails && (
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">You will shadow</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getOrganisationColor(opportunity.organisation.shortCode)} flex items-center justify-center`}>
                            <span className="font-medium">{opportunity.organisation.shortCode.slice(0, 2)}</span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{opportunity.hostDetails}</p>
                          </div>
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              
              <div className="px-4 py-5 sm:px-6">
                {isCreator ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/edit-opportunity/${opportunity.id}`}>
                      <a className="inline-flex justify-center items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit this opportunity
                      </a>
                    </Link>
                  </Button>
                ) : opportunity.status === 'Open' ? (
                  <Button 
                    className="w-full" 
                    onClick={() => setIsApplicationModalOpen(true)}
                    disabled={hasApplied}
                  >
                    {hasApplied ? 'Application Submitted' : 'Apply for this opportunity'}
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    This opportunity is no longer accepting applications
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      
      {opportunity && (
        <ApplicationModal 
          isOpen={isApplicationModalOpen} 
          onClose={() => setIsApplicationModalOpen(false)}
          opportunityId={opportunity.id}
        />
      )}
    </>
  );
}
