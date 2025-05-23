import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft } from "lucide-react";
import NavigationTabs from "@/components/navigation-tabs";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertOpportunitySchema } from "@shared/schema";
import { useOrganisations } from "@/lib/organisations";

// Form validation schema
const createOpportunitySchema = insertOpportunitySchema.extend({
  // We keep the array but it's not used in the UI anymore
  learningAreaIds: z.array(z.number()).default([]),
});

export default function CreateOpportunity() {
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [matchedRoute, params] = useRoute("/edit-opportunity/:id");
  const opportunityId = matchedRoute && params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch organisations
  const { data: organisations, isLoading: isLoadingOrgs } = useOrganisations();

  // Fetch opportunity if editing
  const { data: opportunity, isLoading: isLoadingOpportunity } = useQuery({
    queryKey: [`/api/opportunities/${opportunityId}`],
    enabled: !!opportunityId,
  });

  console.log(opportunity);

  // Set up form with react-hook-form
  const form = useForm<z.infer<typeof createOpportunitySchema>>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      title: "",
      description: "",
      format: "In-Person",
      durationLimit: "1 Day",
      organisationId: user?.organisationId || 0,
      createdByUserId: user?.id || 0,
      status: "Open",
      hostDetails: "",
      learningAreaIds: [],
    },
  });

  // Set form values when editing and data is loaded
  useEffect(() => {
    if (
      opportunityId &&
      opportunity &&
      !isLoadingOpportunity &&
      !isLoadingOrgs
    ) {
      setIsEditing(true);

      // Set form values
      form.reset({
        ...opportunity,
        organisationId: opportunity.organisation_id || opportunity.organisationId || 0,
        hostDetails: opportunity.host_details || '',
        // Use empty array for learningAreaIds as we removed the UI for it
        learningAreaIds: [],
      });
    }
  }, [
    opportunity,
    opportunityId,
    isLoadingOpportunity,
    isLoadingOrgs,
    form,
    user?.organisationId,
  ]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof createOpportunitySchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create opportunities",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && opportunityId) {
        // Update existing opportunity
        const updatedOpportunity = await apiRequest(
          "PUT",
          `/api/opportunities/${opportunityId}`,
          {
            ...data,
            id: opportunityId,
            createdByUserId: user.id,
          },
        );

        if (!updatedOpportunity) {
          throw new Error("Failed to update opportunity");
        }

        toast({
          title: "Opportunity updated",
          description:
            "The opportunity has been updated successfully",
        });
      } else {
        // Create new opportunity
        await apiRequest("POST", "/api/opportunities", {
          ...data,
          createdByUserId: user.id,
        });

        toast({
          title: "Opportunity created",
          description:
            "Your opportunity has been created successfully",
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user.id}/opportunities`],
      });

      // Redirect to home page
      navigate("/");
    } catch (error) {
      console.error("Error creating opportunity:", error);
      toast({
        title: "Submission failed",
        description:
          "There was an error creating your opportunity. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <NavigationTabs />

      <main className="py-4 sm:py-6 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <a className="inline-flex items-center">
                  <ChevronLeft className="-ml-0.5 mr-2 h-4 w-4" />
                  Cancel
                </a>
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing
                  ? "Edit Opportunity"
                  : "Create New Opportunity"}
              </CardTitle>
              <CardDescription>
                Provide details about the opportunity you'd like to offer.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="organisationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Organisation</FormLabel>
                        <Select
                          disabled={isLoadingOrgs}
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organisation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organisations?.map((org) => (
                              <SelectItem
                                key={org.id}
                                value={org.id.toString()}
                              >
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Product Manager"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="In-Person">In-Person</SelectItem>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Duration</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1 Hour">1 Hour</SelectItem>
                            <SelectItem value="Half-Day">Half-Day</SelectItem>
                            <SelectItem value="1 Day">1 Day</SelectItem>
                            <SelectItem value="2 Half-Days">
                              2 Half-Days
                            </SelectItem>
                            <SelectItem value="2 Days">2 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hostDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host Details</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Textarea
                              placeholder="10+ years exp in Fintech. Experienced with large orgs, agile at scale, and innovation within constraints."
                              rows={4}
                              maxLength={280}
                              className="min-h-[100px]"
                              {...field}
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {field.value?.length ?? 0}/280
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What will they learn?</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Textarea
                              placeholder="- Understand how product teams operate in a large org
- Learn about agile delivery practices and ceremonies
- Cross team collaboration"
                              rows={4}
                              maxLength={280}
                              className="min-h-[100px]"
                              {...field}
                            />
                            <div className="text-xs text-muted-foreground text-right">
                              {field.value?.length ?? 0}/280
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/">Cancel</Link>
                    </Button>
                    <Button type="submit">
                      {isEditing ? "Update Opportunity" : "Create Opportunity"}
                    </Button>
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