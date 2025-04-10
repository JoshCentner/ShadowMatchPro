import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import NavigationTabs from '@/components/navigation-tabs';
import OpportunityCard from '@/components/opportunity-card';
import OpportunityFilters from '@/components/opportunity-filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OpportunityWithDetails } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import { Plus } from 'lucide-react';

export default function Home() {
  const [filters, setFilters] = useState<{
    organisationId?: number;
    format?: string;
    status?: string;
  }>({});

  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Construct the query string for filtered opportunities
  const buildQueryString = () => {
    const params = new URLSearchParams();

    if (filters.organisationId) {
      params.append('organisationId', filters.organisationId.toString());
    }

    if (filters.format) {
      params.append('format', filters.format);
    }

    // Always filter for Open opportunities
    params.append('status', 'Open');

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  const { data: opportunities, isLoading, error } = useQuery<OpportunityWithDetails[]>({
    queryKey: [`/api/opportunities${buildQueryString()}`],
  });

  return (
    <>
      {user && (
        <div className="fixed bottom-[74px] right-6 z-10">
          <Button
            onClick={() => navigate('/create-opportunity')}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Create Opportunity</span>
          </Button>
        </div>
      )}

      <NavigationTabs />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="sticky top-0 bg-white z-10 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-900">See how work gets done.</h1>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      Filters
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="absolute right-0 mt-2 w-full md:w-96 bg-white p-4 rounded-lg shadow-lg border">
                    <OpportunityFilters onFilterChange={setFilters} />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-full mt-2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                    <div className="flex justify-between mt-4">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500">Error loading opportunities. Please try again later.</p>
              </div>
            ) : opportunities && opportunities.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or check back later for new opportunities.</p>
                {user && (
                  <Button onClick={() => navigate('/create-opportunity')}>
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Create New Opportunity
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}