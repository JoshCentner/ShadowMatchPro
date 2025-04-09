import { Link } from 'wouter';
import { Opportunity, Organisation } from '@shared/schema';
import { MapPin, Monitor } from 'lucide-react';
import { getOrganisationColor } from '@/lib/organisations';

interface OpportunityCardProps {
  opportunity: {
    id: number;
    title: string;
    description: string;
    format: string;
    durationLimit: string;
    status: string;
    organisation: Organisation;
  };
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  // Format icons
  const FormatIcon = opportunity.format === 'In-Person' 
    ? MapPin 
    : Monitor;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {opportunity.organisation.logo_url ? (
              <img 
                src={opportunity.organisation.logo_url} 
                alt={`${opportunity.organisation.name} logo`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className={`h-10 w-10 rounded-full ${getOrganisationColor(opportunity.organisation.shortCode)} flex items-center justify-center`}>
                <span className="text-xs font-medium">{opportunity.organisation.shortCode}</span>
              </div>
            )}
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{opportunity.title}</h3>
              <p className="text-sm text-gray-500">{opportunity.durationLimit}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${opportunity.status.toLowerCase()}`}>
            {opportunity.status}
          </span>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600 line-clamp-3">
            {opportunity.description}
          </p>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="inline-flex items-center text-sm text-gray-500">
            <FormatIcon className="h-5 w-5 mr-1.5 text-gray-400" />
            {opportunity.format}
          </span>
          <Link href={`/opportunities/${opportunity.id}`}>
            <a 
              className={`inline-flex items-center text-sm font-medium ${
                opportunity.status === 'Filled' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-primary hover:text-blue-600'
              }`}
            >
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
