import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportData, importData } from '@/lib/storage';
import { Download, Upload, Share2 } from 'lucide-react';

export function BackupManager() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExportDownload = () => {
    setIsExporting(true);
    try {
      const jsonData = exportData();
      const dataStr = JSON.stringify(JSON.parse(jsonData), null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `financeiro-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Backup baixado',
        description: 'Arquivo salvo com sucesso. Guarde em um local seguro!',
      });
    } catch (error) {
      toast({
        title: 'Erro ao fazer backup',
        description: 'Não foi possível exportar seus dados.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportShare = async () => {
    setIsExporting(true);
    try {
      const jsonData = exportData();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `financeiro-backup-${timestamp}.json`;
      
      // Criar URL com dados
      const dataBlob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Se o navegador suporta Web Share API
      if (navigator.share && navigator.canShare?.({ files: [new File([dataBlob], filename, { type: 'application/json' })] })) {
        const file = new File([dataBlob], filename, { type: 'application/json' });
        await navigator.share({
          files: [file],
          title: 'Backup do App Financeiro',
          text: 'Aqui está meu backup de dados financeiros',
        });
        toast({
          title: 'Compartilhado',
          description: 'Backup enviado com sucesso!',
        });
      } else {
        // Fallback: copiar para clipboard (WhatsApp Web)
        await navigator.clipboard.writeText(jsonData);
        toast({
          title: 'Copiado',
          description: 'JSON copiado. Cole no WhatsApp ou email!',
        });
      }
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Erro ao compartilhar',
        description: 'Não foi possível compartilhar. Tente baixar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        importData(jsonString, false); // false = replace, não merge
        
        toast({
          title: 'Backup restaurado',
          description: 'Seus dados foram restaurados com sucesso!',
        });
        
        // Reload page para mostrar novos dados
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast({
          title: 'Erro ao restaurar',
          description: 'O arquivo não é um backup válido.',
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = () => {
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Não foi possível ler o arquivo.',
        variant: 'destructive',
      });
      setIsImporting(false);
    };
    
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💾 Backup de Dados
        </CardTitle>
        <CardDescription>
          Exporte seus dados para restaurar em outro aparelho ou guardar com segurança
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Exportar */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Fazer Backup</p>
            <div className="flex gap-2">
              <Button
                onClick={handleExportDownload}
                disabled={isExporting}
                className="flex-1 gap-2"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exportando...' : 'Baixar'}
              </Button>
              <Button
                onClick={handleExportShare}
                disabled={isExporting}
                className="flex-1 gap-2"
                variant="outline"
              >
                <Share2 className="w-4 h-4" />
                {isExporting ? 'Compartilhando...' : 'Compartilhar'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Crie um arquivo com todos seus dados para guardar ou compartilhar
            </p>
          </div>

          {/* Restaurar */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Restaurar Backup</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={triggerFileInput}
                  disabled={isImporting}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Upload className="w-4 h-4" />
                  {isImporting ? 'Restaurando...' : 'Selecionar Arquivo'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurar Backup?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Seus dados atuais serão substituídos pelos dados do backup. Tem certeza?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction onClick={triggerFileInput}>
                  Confirmar
                </AlertDialogAction>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Carregue um arquivo de backup anterior (arquivo .json)
            </p>
          </div>
        </div>

        {/* Input file hidden */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
          <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">💡 Como usar:</p>
          <ol className="text-blue-800 dark:text-blue-200 space-y-1 text-xs list-decimal list-inside">
            <li>Clique em <strong>"Baixar"</strong> para salvar um backup seguro</li>
            <li>Compartilhe via <strong>WhatsApp, Email ou Drive</strong></li>
            <li>Em outro aparelho, clique em <strong>"Selecionar Arquivo"</strong></li>
            <li>Escolha o arquivo <strong>.json</strong> do backup</li>
            <li>Todos seus dados serão restaurados!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
