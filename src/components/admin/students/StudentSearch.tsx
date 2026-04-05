
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface StudentSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search students..."
        className="pl-8 w-[250px]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default StudentSearch;
