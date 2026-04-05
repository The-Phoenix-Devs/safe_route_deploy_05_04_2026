
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RouteSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const RouteSearch: React.FC<RouteSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search routes..."
        className="pl-8 w-[250px]"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default RouteSearch;
