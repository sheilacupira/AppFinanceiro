/**
 * Bank Connection Manager
 * UI para conectar contas bancárias via Open Finance
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, Trash2, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { openFinanceService } from '@/lib/openFinance';
import { bankConnectionStorage } from '@/lib/bankConnectionStorage';
import type { BankInstitution, BankConnection } from '@/types/openFinance';

export function BankConnectionManager() {
  const [banks, setBanks] = useState<BankInstitution[]>([]);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Inicializa serviço
      await openFinanceService.initialize();

      // Carrega bancos disponíveis
      const bankList = await openFinanceService.listBanks();
      setBanks(bankList);

      // Carrega conexões salvas
      const savedConnections = bankConnectionStorage.getAll();
      setConnections(savedConnections);
    } catch (err) {
      setError('Erro ao carregar dados. Verifique sua conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (bank: BankInstitution) => {
    setConnecting(true);
    setError('');

    try {
      // Cria conexão pendente
      const newConnection: BankConnection = {
        id: `conn-${Date.now()}`,
        bankId: bank.id,
        bankName: bank.name,
        bankLogo: bank.logo,
        status: 'PENDING',
        connectedAt: Date.now(),
        accounts: [],
      };

      // Salva conexão
      bankConnectionStorage.upsert(newConnection);
      setConnections([...connections, newConnection]);

      // Gera token para Pluggy Connect Widget
      const connectToken = await openFinanceService.getConnectToken();

      // TODO: Abrir Pluggy Connect Widget em modal/iframe
      // Por enquanto, apenas simulamos conexão bem-sucedida em modo mock
      
      // Simula conexão bem-sucedida (mock)
      setTimeout(() => {
        newConnection.status = 'CONNECTED';
        newConnection.accounts = [
          {
            id: `acc-${Date.now()}`,
            connectionId: newConnection.id,
            accountId: 'ext-123',
            type: 'CHECKING',
            name: 'Conta Corrente',
            number: '1234',
            balance: 5000,
            currency: 'BRL',
          },
        ];
        bankConnectionStorage.upsert(newConnection);
        setConnections(bankConnectionStorage.getAll());
        setConnecting(false);
      }, 2000);

    } catch (err) {
      setError('Erro ao conectar banco. Tente novamente.');
      console.error(err);
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Deseja realmente desconectar esta conta?')) {
      return;
    }

    try {
      // Remove do Pluggy
      await openFinanceService.deleteItem(connectionId);

      // Remove do storage
      bankConnectionStorage.delete(connectionId);
      setConnections(connections.filter((c) => c.id !== connectionId));
    } catch (err) {
      setError('Erro ao desconectar. Tente novamente.');
      console.error(err);
    }
  };

  const handleSync = async (connection: BankConnection) => {
    setError('');
    
    try {
      // Atualiza status
      bankConnectionStorage.updateStatus(connection.id, 'UPDATING');
      setConnections(bankConnectionStorage.getAll());

      // TODO: Buscar transações do Pluggy e importar automaticamente
      
      // Simula sincronização
      setTimeout(() => {
        bankConnectionStorage.markSynced(connection.id);
        setConnections(bankConnectionStorage.getAll());
      }, 1500);

    } catch (err) {
      bankConnectionStorage.updateStatus(connection.id, 'ERROR', 'Falha na sincronização');
      setConnections(bankConnectionStorage.getAll());
      setError('Erro ao sincronizar. Tente novamente.');
      console.error(err);
    }
  };

  const getStatusIcon = (status: BankConnection['status']) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'ERROR':
      case 'LOGIN_ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'UPDATING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: BankConnection['status']) => {
    switch (status) {
      case 'CONNECTED':
        return 'Conectado';
      case 'ERROR':
        return 'Erro';
      case 'LOGIN_ERROR':
        return 'Erro de login';
      case 'UPDATING':
        return 'Sincronizando';
      case 'PENDING':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Open Finance</h2>
        <p className="text-muted-foreground mt-1">
          Conecte suas contas bancárias para importação automática de transações
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conexões Ativas */}
      {connections.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contas Conectadas</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    {connection.bankLogo ? (
                      <img
                        src={connection.bankLogo}
                        alt={connection.bankName}
                        className="h-10 w-10 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{connection.bankName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(connection.status)}
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(connection.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connection.accounts.map((account) => (
                      <div key={account.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{account.name}</span>
                          {account.balance !== undefined && (
                            <span className="text-green-600">
                              R$ {account.balance.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {account.number && (
                          <div className="text-muted-foreground text-xs">
                            ••• {account.number}
                          </div>
                        )}
                      </div>
                    ))}

                    {connection.lastSyncAt && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Última sincronização:{' '}
                        {new Date(connection.lastSyncAt).toLocaleString('pt-BR')}
                      </div>
                    )}

                    {connection.errorMessage && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertDescription className="text-xs">
                          {connection.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(connection)}
                        disabled={connection.status === 'UPDATING'}
                      >
                        {connection.status === 'UPDATING' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sincronizar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDisconnect(connection.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bancos Disponíveis */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Conectar Nova Conta</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {banks.map((bank) => {
            const isConnected = connections.some((c) => c.bankId === bank.id);
            
            return (
              <Card
                key={bank.id}
                className={`cursor-pointer hover:border-primary transition-colors ${
                  isConnected ? 'opacity-50' : ''
                }`}
                onClick={() => !isConnected && !connecting && handleConnect(bank)}
              >
                <CardContent className="flex flex-col items-center p-4 space-y-2">
                  {bank.logo ? (
                    <img
                      src={bank.logo}
                      alt={bank.name}
                      className="h-12 w-12 object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="font-medium text-sm">{bank.name}</p>
                    {isConnected && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Conectado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {connecting && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Conectando ao banco...</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
