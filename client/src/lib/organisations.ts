import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Organisation } from '@shared/schema';

export const useOrganisations = () => {
  return useQuery<Organisation[]>({
    queryKey: ['/api/organisations'],
  });
};

export function useOrganisationById(id?: number) {
  const { data: organisations } = useOrganisations();
  const [organisation, setOrganisation] = useState<Organisation | undefined>(undefined);
  
  useEffect(() => {
    if (organisations && id) {
      const org = organisations.find(org => org.id === id);
      setOrganisation(org);
    }
  }, [organisations, id]);
  
  return organisation;
}

export const organisationColors: Record<string, string> = {
  'SEEK': 'bg-blue-100 text-blue-800',
  'REA': 'bg-green-100 text-green-800',
  'ATLSN': 'bg-purple-100 text-purple-800',
  // Default color if no match
  'default': 'bg-gray-200 text-gray-600'
};

export function getOrganisationColor(shortCode?: string): string {
  if (!shortCode) return organisationColors.default;
  return organisationColors[shortCode] || organisationColors.default;
}
