
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => (
  <Input
    type="text"
    placeholder="Search projects..."
    onChange={(e) => onSearch(e.target.value)}
    className="max-w-sm"
  />
);
