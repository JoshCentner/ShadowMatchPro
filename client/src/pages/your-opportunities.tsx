import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import NavigationTabs from "@/components/navigation-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Plus, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  OpportunityWithDetails,
  ApplicationWithDetails,
  SuccessfulApplication,
} from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { getOrganisationColor } from "@/lib/organisations";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function YourOpportunities() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<OpportunityWithDetails | null>(null);
  const [isApplicationsModalOpen, setIsApplicationsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusChange = async (opportunityId: number, status: 'Filled' | 'Closed') => {
    try {
      await apiRequest('PUT', `/api/opportunities/${opportunityId}`, { status });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/opportunities`] });
      
      toast({
        title: 'Status updated',
        description: `Opportunity marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update opportunity status',
        variant: 'destructive',
      });
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const {
    data: opportunities,
    isLoading,
    error,
  } = useQuery<OpportunityWithDetails[]>({
    queryKey: [`/api/users/${user?.id}/opportunities`],
    enabled: !!user,
    select: (data) => data.map(opp => ({
      ...opp,
      applications: opp.applications || []
    }))
  });

  const handleViewApplications = (opportunity: OpportunityWithDetails) => {
    setSelectedOpportunity(opportunity);
    setIsApplicationsModalOpen(true);
  };

  const handleAcceptApplication = async (
    application: ApplicationWithDetails,
  ) => {
    if (!selectedOpportunity || !user) return;

    try {
      const acceptData: Omit<SuccessfulApplication, "acceptedAt"> = {
        opportunityId: selectedOpportunity.id,
        userId: application.userId,
      };

      await apiRequest("POST", "/api/applications/accept", acceptData);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user.id}/opportunities`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });

      toast({
        title: "Applicant accepted",
        description: `You've accepted ${application.user.name} for this shadowing opportunity.`,
      });

      setIsApplicationsModalOpen(false);
    } catch (error) {
      console.error("Error accepting application:", error);
      toast({
        title: "Action failed",
        description:
          "There was an error accepting this application. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <NavigationTabs />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              My Opportunities
            </h1>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-4 border-b last:border-0"
                  >
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-red-500">
                  Error loading opportunities. Please try again later.
                </div>
              </CardContent>
            </Card>
          ) : opportunities && opportunities.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                  {opportunities.map((opportunity) => (
                    <li key={opportunity.id}>
                      <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                        <div className="flex items-center">
                          <div
                            className={`flex-shrink-0 h-10 w-10 rounded-full ${getOrganisationColor(opportunity.organisation.shortCode)} flex items-center justify-center`}
                          >
                            <span className="text-xs font-medium">
                              {opportunity.organisation.shortCode}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {opportunity.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {opportunity.applicationCount || 0} application
                              {opportunity.applicationCount !== 1 ? "s" : ""}{" "}
                              received
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${opportunity.status.toLowerCase()}`}
                          >
                            {opportunity.status}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/edit-opportunity/${opportunity.id}`}
                                >
                                  <a className="w-full flex items-center">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </a>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewApplications(opportunity)
                                }
                              >
                                <Users className="mr-2 h-4 w-4" />
                                View Applications
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(opportunity.id, 'Filled')}
                                disabled={opportunity.status === 'Filled'}
                              >
                                Mark as Filled
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(opportunity.id, 'Closed')}
                                disabled={opportunity.status === 'Closed'}
                              >
                                Mark as Closed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <CardTitle className="text-center">
                  Nothing to see here
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-6">
                <p className="text-gray-500 mb-6">
                  You haven't created any shadowing opportunities yet, but you
                  could.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/create-opportunity">
                <a className="inline-flex items-center">
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Create New Opportunity
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Applications Modal */}
      {selectedOpportunity && (
        <Dialog
          open={isApplicationsModalOpen}
          onOpenChange={setIsApplicationsModalOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Applications for {selectedOpportunity.title}
              </DialogTitle>
              <DialogDescription>
                Review and select an applicant for this shadowing opportunity.
              </DialogDescription>
            </DialogHeader>
            {console.log("Applications in dialog:", selectedOpportunity)}
            {selectedOpportunity.applications &&
            selectedOpportunity.applications.length > 0 ? (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {selectedOpportunity.applications.map((application) => (
                  <div
                    key={application.id}
                    className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {application.user.pictureUrl ? (
                            <img
                              src={application.user.pictureUrl}
                              alt={application.user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-medium text-gray-500 text-lg">
                              {application.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {application.user.name}
                          </h4>
                          <div className="flex items-center mt-1">
                            {application.user.currentRole && (
                              <p className="text-sm text-gray-500">
                                {application.user.currentRole}
                              </p>
                            )}
                            {application.user.organisationId &&
                              application.user.organisation && (
                                <>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <p className="text-sm text-gray-500">
                                    {application.user.organisation.name}
                                  </p>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                      {selectedOpportunity.status === "Open" && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptApplication(application)}
                          className="flex-shrink-0"
                        >
                          Accept
                        </Button>
                      )}
                    </div>

                    {application.message && (
                      <div className="mt-3 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {application.message}
                        </p>
                      </div>
                    )}

                    {application.createdAt && (
                      <div className="mt-3 text-xs text-gray-500">
                        Applied{" "}
                        {format(
                          new Date(application.createdAt),
                          "MMMM d, yyyy",
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No applications received yet.</p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApplicationsModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}