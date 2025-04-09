import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Organisation } from '@shared/schema';
import { useOrganisations } from '@/lib/organisations';

interface OpportunityFiltersProps {
  onFilterChange: (filters: {
    organisationId?: number;
    format?: string;
    status?: string;
  }) => void;
}

export default function OpportunityFilters({ onFilterChange }: OpportunityFiltersProps) {
  const [selectedOrganisation, setSelectedOrganisation] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  
  const { data: organisations, isLoading: isLoadingOrgs } = useOrganisations();

  // Update parent component when filters change
  useEffect(() => {
    const filters: {
      organisationId?: number;
      format?: string;
    } = {};
    
    if (selectedOrganisation && selectedOrganisation !== 'all') {
      filters.organisationId = parseInt(selectedOrganisation);
    }
    
    if (selectedFormat && selectedFormat !== 'all') {
      filters.format = selectedFormat;
    }
    
    onFilterChange(filters);
  }, [selectedOrganisation, selectedFormat, onFilterChange]);

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-1/3">
          <Select
            value={selectedOrganisation}
            onValueChange={setSelectedOrganisation}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organisations?.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-1/3">
          <Select
            value={selectedFormat}
            onValueChange={setSelectedFormat}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="In-Person">In-Person</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
