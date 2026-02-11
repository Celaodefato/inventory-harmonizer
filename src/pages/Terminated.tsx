import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, UserX, Calendar, Mail, Save, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    terminationDate: '',
    notes: '',
  });
  const [search, setSearch] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const saved = await getTerminatedEmployees();
    setEmployees(saved);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', terminationDate: '', notes: '' });
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
    const sanitizedName = sanitizeInput(formData.name);
    const sanitizedEmail = sanitizeInput(formData.email);
    const sanitizedNotes = sanitizeInput(formData.notes);

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
        createdAt: new Date().toISOString(),
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
      e.email.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Colaboradores Desligados</h1>
            <p className="text-muted-foreground">
              Gerencie a lista de colaboradores desligados para auditoria de segurança
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Desligado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador Desligado'}
                </DialogTitle>
                <DialogDescription>
                  {editingEmployee
                    ? 'Atualize as informações do colaborador desligado'
                    : 'Cadastre um colaborador que foi desligado da empresa'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            <strong>Importante:</strong> Colaboradores cadastrados aqui serão cruzados automaticamente
            com os inventários durante a sincronização. Endpoints ou acessos ativos de desligados
            gerarão alertas de segurança.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar por nome ou email..."
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
                Adicione colaboradores desligados para monitorar riscos de segurança
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/30 animate-fade-in"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <UserX className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{employee.name}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {employee.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Desligado em {formatDate(employee.terminationDate)}
                        </span>
                      </div>
                      {employee.notes && (
                        <p className="mt-1 text-sm text-muted-foreground/80">
                          {employee.notes}
                        </p>
                      )}
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
              ))}
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
