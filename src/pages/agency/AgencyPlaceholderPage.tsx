import React from 'react';
import { AgencyScreenPlaceholder } from '@/components/agency/AgencyScreenPlaceholder';

interface AgencyPlaceholderPageProps {
  screenId: string;
}

export const AgencyPlaceholderPage: React.FC<AgencyPlaceholderPageProps> = ({ screenId }) => {
  return (
    <div className="min-h-full bg-slate-100 flex items-center justify-center p-6">
      <AgencyScreenPlaceholder screenId={screenId} />
    </div>
  );
};

export default AgencyPlaceholderPage;
