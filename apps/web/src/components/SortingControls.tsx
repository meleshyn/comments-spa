import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { SortBy, SortOrder } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SortingControlsProps {
  /** Current sort field */
  sortBy: SortBy;
  /** Current sort order */
  sortOrder: SortOrder;
  /** Callback when sort field changes */
  onSortByChange: (sortBy: SortBy) => void;
  /** Callback when sort order changes */
  onSortOrderChange: (sortOrder: SortOrder) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Material Design 3 sorting controls for comments
 * Provides dropdown for sort field and switch for sort order
 */
export function SortingControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  className,
}: SortingControlsProps) {
  const handleSortOrderToggle = (checked: boolean) => {
    onSortOrderChange(checked ? 'desc' : 'asc');
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 bg-card border border-border rounded-lg',
        className
      )}
    >
      {/* Sort By Dropdown */}
      <div className="flex items-center gap-2">
        <Label
          htmlFor="sort-by"
          className="text-sm font-medium text-foreground whitespace-nowrap"
        >
          Sort by:
        </Label>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger
            id="sort-by"
            className="w-[140px] bg-input border-border focus:border-ring"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date</SelectItem>
            <SelectItem value="userName">Username</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order Switch */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="size-4 text-muted-foreground" />
        <Label
          htmlFor="sort-order"
          className="text-sm font-medium text-foreground whitespace-nowrap"
        >
          {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        </Label>
        <Switch
          id="sort-order"
          checked={sortOrder === 'desc'}
          onCheckedChange={handleSortOrderToggle}
        />
      </div>
    </div>
  );
}
