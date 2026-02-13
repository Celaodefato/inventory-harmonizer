import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, UserX, Calendar, Mail, Save, X, CheckCircle2, Circle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getTerminatedEmployees,
  addTerminatedEmployee,
  deleteTerminatedEmployee,
  updateTerminatedEmployee,
} from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { TerminatedEmployee } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sanitizeInput } from '@/lib/validation';
import { cn } from '@/lib/utils';

export default function TerminatedPage() {
  const [employees, setEmployees] = useState<TerminatedEmployee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<TerminatedEmployee | null>(null);
  const [formData, setFormData] = useState<Partial<TerminatedEmployee>>({
    name: '',
    email: '',
    terminationDate: '',
    notes: '',
    responsible: '',
    adDisabled: false,
    googlePasswordChanged: false,
    autoReplySet: false,
    takeoutCompleted: false,
    machineBackup: false,
    licenseRemovalRequested: false,
    licenseRemoved: false,
    movedToTerminatedOu: false,
    machineCollected: false,
    glpiUpdated: false,
  });
  const [search, setSearch] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();

    const channel = supabase
      .channel('terminated-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'terminated_employees' },
        () => {
          loadEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEmployees = async () => {
    const saved = await getTerminatedEmployees();
    setEmployees(saved);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      terminationDate: '',
      notes: '',
      responsible: '',
      adDisabled: false,
      googlePasswordChanged: false,
      autoReplySet: false,
      takeoutCompleted: false,
      machineBackup: false,
      licenseRemovalRequested: false,
      licenseRemoved: false,
      movedToTerminatedOu: false,
      machineCollected: false,
      glpiUpdated: false,
    });
    setEditingEmployee(null);
  };

  const handleOpenDialog = (employee?: TerminatedEmployee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        terminationDate: employee.terminationDate ? new Date(employee.terminationDate).toISOString().split('T')[0] : '',
        notes: employee.notes || '',
        responsible: employee.responsible || '',
        adDisabled: employee.adDisabled || false,
        googlePasswordChanged: employee.googlePasswordChanged || false,
        autoReplySet: employee.autoReplySet || false,
        takeoutCompleted: employee.takeoutCompleted || false,
        machineBackup: employee.machineBackup || false,
        licenseRemovalRequested: employee.licenseRemovalRequested || false,
        licenseRemoved: employee.licenseRemoved || false,
        movedToTerminatedOu: employee.movedToTerminatedOu || false,
        machineCollected: employee.machineCollected || false,
        glpiUpdated: employee.glpiUpdated || false,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    const sanitizedName = sanitizeInput(formData.name || '');
    const sanitizedEmail = sanitizeInput(formData.email || '');
    const sanitizedNotes = sanitizeInput(formData.notes || '');
    const sanitizedResponsible = sanitizeInput(formData.responsible || '');

    if (!sanitizedName || !sanitizedEmail || !formData.terminationDate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, email e data de desligamento',
        variant: 'destructive',
      });
      return;
    }

    if (!sanitizedEmail.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Informe um email válido',
        variant: 'destructive',
      });
      return;
    }

    if (editingEmployee) {
      const updated: TerminatedEmployee = {
        ...editingEmployee,
        name: sanitizedName,
        email: sanitizedEmail,
        terminationDate: formData.terminationDate,
        notes: sanitizedNotes,
        responsible: sanitizedResponsible,
        adDisabled: formData.adDisabled,
        googlePasswordChanged: formData.googlePasswordChanged,
        autoReplySet: formData.autoReplySet,
        takeoutCompleted: formData.takeoutCompleted,
        machineBackup: formData.machineBackup,
        licenseRemovalRequested: formData.licenseRemovalRequested,
        licenseRemoved: formData.licenseRemoved,
        movedToTerminatedOu: formData.movedToTerminatedOu,
        machineCollected: formData.machineCollected,
        glpiUpdated: formData.glpiUpdated,
      };
      await updateTerminatedEmployee(updated);
      toast({ title: 'Registro atualizado', description: 'Colaborador desligado atualizado com sucesso' });
    } else {
      const newEmployee: TerminatedEmployee = {
        id: `te-${Date.now()}`,
        name: sanitizedName,
        email: sanitizedEmail,
        terminationDate: formData.terminationDate,
        notes: sanitizedNotes,
        responsible: sanitizedResponsible,
        createdAt: new Date().toISOString(),
        adDisabled: formData.adDisabled,
        googlePasswordChanged: formData.googlePasswordChanged,
        autoReplySet: formData.autoReplySet,
        takeoutCompleted: formData.takeoutCompleted,
        machineBackup: formData.machineBackup,
        licenseRemovalRequested: formData.licenseRemovalRequested,
        licenseRemoved: formData.licenseRemoved,
        movedToTerminatedOu: formData.movedToTerminatedOu,
        machineCollected: formData.machineCollected,
        glpiUpdated: formData.glpiUpdated,
      };
      await addTerminatedEmployee(newEmployee);
      toast({ title: 'Registro adicionado', description: 'Colaborador desligado cadastrado com sucesso' });
    }

    await loadEmployees();
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    await deleteTerminatedEmployee(id);
    await loadEmployees();
    toast({ title: 'Registro removido', description: 'Colaborador removido da lista' });
  };

  const filteredEmployees = employees.filter((e) => {
    const searchLower = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(searchLower) ||
      e.email.toLowerCase().includes(searchLower) ||
      (e.responsible && e.responsible.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  const calculateProgress = (employee: TerminatedEmployee) => {
    const checklistItems = [
      employee.adDisabled,
      employee.googlePasswordChanged,
      employee.autoReplySet,
      employee.takeoutCompleted,
      employee.machineBackup,
      employee.licenseRemovalRequested,
      employee.licenseRemoved,
      employee.movedToTerminatedOu,
      employee.machineCollected,
      employee.glpiUpdated,
    ];
    const completed = checklistItems.filter(Boolean).length;
    const total = checklistItems.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Colaboradores Desligados</h1>
            <p className="text-muted-foreground">
              Gerencie o checklist completo de offboarding
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Desligado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador Desligado'}
                </DialogTitle>
                <DialogDescription>
                  {editingEmployee
                    ? 'Atualize as informações e o checklist de offboarding'
                    : 'Cadastre um colaborador e acompanhe o processo de offboarding'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        placeholder="João da Silva"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email corporativo *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao.silva@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Data de desligamento *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.terminationDate}
                        onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="responsible">Responsável</Label>
                      <Input
                        id="responsible"
                        placeholder="Nome do responsável"
                        value={formData.responsible}
                        onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist de Acessos */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Acessos e Contas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="adDisabled"
                        checked={formData.adDisabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, adDisabled: checked as boolean })}
                      />
                      <Label htmlFor="adDisabled" className="text-sm font-normal cursor-pointer">
                        Desativado no AD?
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="googlePasswordChanged"
                        checked={formData.googlePasswordChanged}
                        onCheckedChange={(checked) => setFormData({ ...formData, googlePasswordChanged: checked as boolean })}
                      />
                      <Label htmlFor="googlePasswordChanged" className="text-sm font-normal cursor-pointer">
                        Senha Google alterada?
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="movedToTerminatedOu"
                        checked={formData.movedToTerminatedOu}
                        onCheckedChange={(checked) => setFormData({ ...formData, movedToTerminatedOu: checked as boolean })}
                      />
                      <Label htmlFor="movedToTerminatedOu" className="text-sm font-normal cursor-pointer">
                        Movido para desligados (AD e Google)?
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Checklist de Dados */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Dados e Email</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoReplySet"
                        checked={formData.autoReplySet}
                        onCheckedChange={(checked) => setFormData({ ...formData, autoReplySet: checked as boolean })}
                      />
                      <Label htmlFor="autoReplySet" className="text-sm font-normal cursor-pointer">
                        Resposta automática configurada?
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="takeoutCompleted"
                        checked={formData.takeoutCompleted}
                        onCheckedChange={(checked) => setFormData({ ...formData, takeoutCompleted: checked as boolean })}
                      />
                      <Label htmlFor="takeoutCompleted" className="text-sm font-normal cursor-pointer">
                        Takeout realizado (email, drive e chat)?
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Checklist de Equipamento */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Equipamento</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="machineBackup"
                        checked={formData.machineBackup}
                        onCheckedChange={(checked) => setFormData({ ...formData, machineBackup: checked as boolean })}
                      />
                      <Label htmlFor="machineBackup" className="text-sm font-normal cursor-pointer">
                        Backup da máquina realizado?
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="machineCollected"
                        checked={formData.machineCollected}
                        onCheckedChange={(checked) => setFormData({ ...formData, machineCollected: checked as boolean })}
                      />
                      <Label htmlFor="machineCollected" className="text-sm font-normal cursor-pointer">
                        Máquina recolhida?
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="glpiUpdated"
                        checked={formData.glpiUpdated}
                        onCheckedChange={(checked) => setFormData({ ...formData, glpiUpdated: checked as boolean })}
                      />
                      <Label htmlFor="glpiUpdated" className="text-sm font-normal cursor-pointer">
                        GLPI atualizado?
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Checklist de Licenças */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Licenças</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="licenseRemovalRequested"
                        checked={formData.licenseRemovalRequested}
                        onCheckedChange={(checked) => setFormData({ ...formData, licenseRemovalRequested: checked as boolean })}
                      />
                      <Label htmlFor="licenseRemovalRequested" className="text-sm font-normal cursor-pointer">
                        Remoção de licença solicitada?
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="licenseRemoved"
                        checked={formData.licenseRemoved}
                        onCheckedChange={(checked) => setFormData({ ...formData, licenseRemoved: checked as boolean })}
                      />
                      <Label htmlFor="licenseRemoved" className="text-sm font-normal cursor-pointer">
                        Licença removida?
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingEmployee ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm text-foreground">
            <strong>Importante:</strong> Utilize o checklist para acompanhar todas as etapas do processo de offboarding.
            Colaboradores cadastrados aqui serão cruzados automaticamente com os inventários durante a sincronização.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar por nome, email ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* List */}
        <div className="rounded-xl border border-border bg-card">
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserX className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-foreground">Nenhum colaborador cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Adicione colaboradores desligados para acompanhar o processo de offboarding
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEmployees.map((employee) => {
                const progress = calculateProgress(employee);
                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30 animate-fade-in"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <UserX className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{employee.name}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {employee.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(employee.terminationDate)}
                          </span>
                          {employee.responsible && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Resp: {employee.responsible}
                            </span>
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                progress.percentage === 100 ? "bg-success" : "bg-primary"
                              )}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(employee)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        {employees.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Total: {employees.length} colaborador(es) desligado(s)
          </div>
        )}
      </div>
    </MainLayout>
  );
}
