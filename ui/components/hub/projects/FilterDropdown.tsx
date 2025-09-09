import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterDropdownProps {
  onFilterChange: (value: string) => void;
  languages: string[];
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ onFilterChange, languages }) => (
  <Select onValueChange={onFilterChange}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filter by..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="owner">Owned</SelectItem>
      <SelectItem value="member">Contributed</SelectItem>
      <SelectItem value="fork">Forked</SelectItem>
      {languages.map((lang) => (
        <SelectItem key={lang} value={lang}>{
          lang
        }</SelectItem>
      ))}
    </SelectContent>
  </Select>
);