import { useState, useMemo } from 'react';
import { Search, Download, ChevronUp, ChevronDown, Filter, AlertTriangle } from 'lucide-react';
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

type SortField = 'hostname' | 'ip' | 'os' | 'sources' | 'risk';
type SortDirection = 'asc' | 'desc';
type SourceFilter = 'all' | 'vicarius' | 'cortex' | 'warp' | 'pam' | 'jumpcloud' | 'missing-any' | 'risk';

export function ComparisonTable({ endpoints, title }: ComparisonTableProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('hostname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const filteredAndSortedEndpoints = useMemo(() => {
    let result = [...endpoints];

    if (search) {
      const sanitized = sanitizeInput(search).toLowerCase();
      result = result.filter(
        (e) =>
          e.hostname.toLowerCase().includes(sanitized) ||
          e.ip.toLowerCase().includes(sanitized) ||
          (e.os && e.os.toLowerCase().includes(sanitized)) ||
          (e.userEmail && e.userEmail.toLowerCase().includes(sanitized))
      );
    }

    if (sourceFilter !== 'all') {
      if (sourceFilter === 'missing-any') {
        result = result.filter((e) => e.sources.length < 5);
      } else if (sourceFilter === 'risk') {
        result = result.filter((e) => e.riskLevel === 'high');
      } else {
        result = result.filter((e) => e.sources.includes(sourceFilter as any));
      }
    }

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
        case 'risk':
          const riskOrder = { high: 3, medium: 2, low: 1, none: 0 };
          comparison = (riskOrder[b.riskLevel || 'none'] || 0) - (riskOrder[a.riskLevel || 'none'] || 0);
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
      case 'pam':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'jumpcloud':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const riskCount = endpoints.filter(e => e.riskLevel === 'high').length;

  return (
    <div className="rounded-xl border border-border bg-card animate-fade-in">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
            {riskCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {riskCount} risco(s)
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>

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
                <SelectItem value="pam">PAM</SelectItem>
                <SelectItem value="jumpcloud">JumpCloud</SelectItem>
                <SelectItem value="missing-any">Com divergências</SelectItem>
                <SelectItem value="risk">⚠️ Com risco</SelectItem>
              </SelectContent>
            </Select>

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
          <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
            <tr className="border-b border-border">
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
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Usuário
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
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('risk')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon field="risk" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEndpoints.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum endpoint encontrado
                </td>
              </tr>
            ) : (
              filteredAndSortedEndpoints.map((endpoint, index) => (
                <tr
                  key={`${endpoint.hostname}-${index}`}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    'hover:bg-primary/5',
                    endpoint.riskLevel === 'high' && 'bg-destructive/5',
                    endpoint.sources.length < 5 && endpoint.riskLevel !== 'high' && 'bg-warning/5'
                  )}
                >
                  <td className="px-4 py-4 text-sm font-medium text-card-foreground">
                    {endpoint.hostname}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground font-mono">
                    {endpoint.ip}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {endpoint.os || '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {endpoint.userEmail || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {endpoint.sources.map((source) => {
                        const origin = endpoint.sourceOrigins[source];
                        return (
                          <div key={source} className="flex flex-col items-center gap-0.5">
                            <Badge
                              variant="outline"
                              className={cn('text-xs min-w-[70px] justify-center', getSourceBadgeVariant(source))}
                            >
                              {source}
                            </Badge>
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-1 rounded-sm",
                              origin === 'api' ? "text-success" : origin === 'csv' ? "text-primary" : "text-muted-foreground/60"
                            )}>
                              {origin}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {endpoint.riskLevel === 'high' ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Risco
                      </Badge>
                    ) : endpoint.sources.length === 5 ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        Parcial
                      </Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          {filteredAndSortedEndpoints.length === endpoints.length ? (
            `${endpoints.length} endpoint${endpoints.length !== 1 ? 's' : ''} total`
          ) : (
            `Mostrando ${filteredAndSortedEndpoints.length} de ${endpoints.length} endpoints`
          )}
        </p>
      </div>
    </div>
  );
}
