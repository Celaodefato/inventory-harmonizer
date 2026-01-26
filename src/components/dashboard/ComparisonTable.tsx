import { useState, useMemo } from 'react';
import { Search, Download, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NormalizedEndpoint } from '@/types/inventory';
import { exportToCSV } from '@/lib/inventory';
import { sanitizeInput } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  endpoints: NormalizedEndpoint[];
  title: string;
}

type SortField = 'hostname' | 'ip' | 'os' | 'sources';
type SortDirection = 'asc' | 'desc';
type SourceFilter = 'all' | 'vicarius' | 'cortex' | 'warp' | 'missing-any';

export function ComparisonTable({ endpoints, title }: ComparisonTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('hostname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const filteredAndSortedEndpoints = useMemo(() => {
    let result = [...endpoints];

    // Apply search filter
    if (search) {
      const sanitized = sanitizeInput(search).toLowerCase();
      result = result.filter(
        (e) =>
          e.hostname.toLowerCase().includes(sanitized) ||
          e.ip.toLowerCase().includes(sanitized) ||
          (e.os && e.os.toLowerCase().includes(sanitized))
      );
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'missing-any') {
        result = result.filter((e) => e.sources.length < 3);
      } else {
        result = result.filter((e) => e.sources.includes(sourceFilter as any));
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'hostname':
          comparison = a.hostname.localeCompare(b.hostname);
          break;
        case 'ip':
          comparison = a.ip.localeCompare(b.ip);
          break;
        case 'os':
          comparison = (a.os || '').localeCompare(b.os || '');
          break;
        case 'sources':
          comparison = a.sources.length - b.sources.length;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [endpoints, search, sortField, sortDirection, sourceFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'vicarius':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'cortex':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'warp':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card animate-fade-in">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

            {/* Filter */}
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vicarius">Vicarius</SelectItem>
                <SelectItem value="cortex">Cortex</SelectItem>
                <SelectItem value="warp">Warp</SelectItem>
                <SelectItem value="missing-any">Com divergências</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(filteredAndSortedEndpoints, 'endpoints')}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('hostname')}
              >
                <div className="flex items-center">
                  Hostname
                  <SortIcon field="hostname" />
                </div>
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('ip')}
              >
                <div className="flex items-center">
                  IP
                  <SortIcon field="ip" />
                </div>
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('os')}
              >
                <div className="flex items-center">
                  OS
                  <SortIcon field="os" />
                </div>
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('sources')}
              >
                <div className="flex items-center">
                  Fontes
                  <SortIcon field="sources" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEndpoints.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum endpoint encontrado
                </td>
              </tr>
            ) : (
              filteredAndSortedEndpoints.map((endpoint, index) => (
                <tr
                  key={`${endpoint.hostname}-${index}`}
                  className={cn(
                    'table-row-hover border-b border-border last:border-0',
                    endpoint.sources.length < 3 && 'bg-warning/5'
                  )}
                >
                  <td className="px-4 py-3 text-sm font-medium text-card-foreground">
                    {endpoint.hostname}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {endpoint.ip}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {endpoint.os || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {endpoint.sources.map((source) => (
                        <Badge
                          key={source}
                          variant="outline"
                          className={cn('text-xs', getSourceBadgeVariant(source))}
                        >
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredAndSortedEndpoints.length} de {endpoints.length} endpoints
        </p>
      </div>
    </div>
  );
}
