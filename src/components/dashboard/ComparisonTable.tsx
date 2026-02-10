import { useState, useMemo } from 'react';
import { Search, Download, ChevronUp, ChevronDown, Filter, AlertTriangle, XCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NormalizedEndpoint } from '@/types/inventory';
import { exportToCSV, isEndpointCompliant } from '@/lib/inventory';
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
        result = result.filter((e) => !isEndpointCompliant(e));
      } else if (sourceFilter === 'risk') {
        result = result.filter((e) => (e.riskLevel && e.riskLevel !== 'none') || !isEndpointCompliant(e));
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

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('all');
  };

  const isFiltered = search !== '' || sourceFilter !== 'all';

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
        return 'bg-primary/5 text-primary border-primary/20';
      case 'cortex':
        return 'bg-orange-500/5 text-orange-500 border-orange-500/20';
      case 'warp':
        return 'bg-purple-500/5 text-purple-500 border-purple-500/20';
      case 'pam':
        return 'bg-destructive/5 text-destructive border-destructive/20';
      case 'jumpcloud':
        return 'bg-blue-500/5 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const riskCount = endpoints.filter(e => e.riskLevel === 'high').length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
            {riskCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 animate-pulse">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] font-bold text-destructive uppercase tracking-tight">{riskCount} Riscos Críticos</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-primary" />
              <Input
                placeholder="Hostname, IP ou OS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 w-[220px] bg-background border-border hover:border-primary/30 transition-all text-xs focus-visible:ring-primary/20"
              />
            </div>

            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
              <SelectTrigger className="h-9 w-[180px] bg-background border-border text-[10px] font-bold uppercase tracking-wider focus:ring-primary/20">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="FILTRAR FONTE" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-[10px] uppercase font-bold tracking-widest">Todas as Fontes</SelectItem>
                <SelectItem value="vicarius" className="text-[10px] uppercase font-bold tracking-widest">Vicarius</SelectItem>
                <SelectItem value="cortex" className="text-[10px] uppercase font-bold tracking-widest">Cortex</SelectItem>
                <SelectItem value="warp" className="text-[10px] uppercase font-bold tracking-widest">Warp</SelectItem>
                <SelectItem value="pam" className="text-[10px] uppercase font-bold tracking-widest">PAM</SelectItem>
                <SelectItem value="jumpcloud" className="text-[10px] uppercase font-bold tracking-widest">JumpCloud</SelectItem>
                <div className="h-px bg-border my-1" />
                <SelectItem value="missing-any" className="text-[10px] uppercase font-bold tracking-widest text-orange-500">Fora de Conformidade</SelectItem>
                <SelectItem value="risk" className="text-[10px] uppercase font-bold tracking-widest text-destructive">Riscos de Segurança</SelectItem>
              </SelectContent>
            </Select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Limpar Filtros
              </Button>
            )}

            <div className="h-4 w-px bg-border mx-1" />

            <Button
              variant="outline"
              size="sm"
              className="h-9 border-border bg-background hover:bg-muted font-bold text-[10px] uppercase tracking-wider"
              onClick={() => exportToCSV(filteredAndSortedEndpoints, 'inventory-report')}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 mt-4 animate-in fade-in slide-in-from-top-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Filtros Ativos:</span>
            {search && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold h-5 pl-2 pr-1 gap-1">
                BUSCA: "{search}"
                <X className="h-2.5 w-2.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => setSearch('')} />
              </Badge>
            )}
            {sourceFilter !== 'all' && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold h-5 pl-2 pr-1 gap-1">
                FONTE: {sourceFilter.toUpperCase()}
                <X className="h-2.5 w-2.5 cursor-pointer hover:text-destructive transition-colors" onClick={() => setSourceFilter('all')} />
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              <th
                className="cursor-pointer px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors h-12"
                onClick={() => handleSort('hostname')}
              >
                <div className="flex items-center">
                  Hostname
                  <SortIcon field="hostname" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleSort('ip')}
              >
                <div className="flex items-center">
                  IP
                  <SortIcon field="ip" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleSort('os')}
              >
                <div className="flex items-center">
                  OS
                  <SortIcon field="os" />
                </div>
              </th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                PROPRIETÁRIO / E-MAIL
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleSort('sources')}
              >
                <div className="flex items-center">
                  FONTES MONITORADAS
                  <SortIcon field="sources" />
                </div>
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                onClick={() => handleSort('risk')}
              >
                <div className="flex items-center">
                  COMPLIANCE
                  <SortIcon field="risk" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEndpoints.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center ring-8 ring-muted/10">
                      <Search className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Nenhum endpoint encontrado</p>
                      <p className="text-xs text-muted-foreground max-w-[250px] mx-auto leading-relaxed">
                        Tente ajustar os termos de busca ou remover os filtros aplicados.
                      </p>
                    </div>
                    {isFiltered && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2 h-8 px-4 border-primary/20 hover:bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Limpar Filtros Ativos
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <TooltipProvider delayDuration={0}>
                {filteredAndSortedEndpoints.map((endpoint, index) => (
                  <tr
                    key={`${endpoint.hostname}-${index}`}
                    className={cn(
                      'border-b border-border/50 last:border-0 transition-colors group',
                      'hover:bg-muted/30',
                      endpoint.riskLevel === 'high' && 'bg-destructive/[0.03] hover:bg-destructive/[0.05]',
                      !isEndpointCompliant(endpoint) && endpoint.riskLevel !== 'high' && 'bg-warning/[0.02] hover:bg-warning/[0.04]'
                    )}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {endpoint.hostname}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-muted-foreground font-mono font-bold">
                      {endpoint.ip}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                      {endpoint.os || '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                      {endpoint.userEmail || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {endpoint.sources.map((source) => {
                          const origin = endpoint.sourceOrigins[source];
                          return (
                            <Badge
                              key={source}
                              variant="outline"
                              className={cn('h-5 px-1.5 text-[9px] min-w-[64px] justify-center font-bold tracking-tight', getSourceBadgeVariant(source))}
                            >
                              {source.toUpperCase()}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-12">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            {endpoint.riskLevel === 'high' ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 cursor-help">
                                <AlertTriangle className="h-3 w-3" />
                                CRÍTICO
                              </div>
                            ) : isEndpointCompliant(endpoint) ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
                                CONFORME
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20 cursor-help">
                                <AlertTriangle className="h-3 w-3" />
                                PARCIAL
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        {(endpoint.riskReason || !isEndpointCompliant(endpoint)) && (
                          <TooltipContent className="bg-popover border-border p-3 shadow-xl max-w-[300px]">
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Motivo do Risco:</p>
                              <p className="text-xs font-medium leading-relaxed">
                                {endpoint.riskReason || 'Este endpoint está fora de conformidade com as diretrizes de segurança (ferramentas obrigatórias ausentes).'}
                              </p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </TooltipProvider>
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
