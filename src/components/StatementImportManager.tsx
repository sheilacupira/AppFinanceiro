import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/finance';
import {
  buildDefaultCsvMapping,
  buildTransactionsFromItems,
  detectFormat,
  parseCsvPreview,
  parseCsvWithMapping,
  parseStatement,
  type CsvMapping,
  type CsvPreview,
  type StatementFormat,
  type StatementItem,
} from '@/lib/statementImport';
import { getAllCategories } from '@/lib/categoryMatcher';
import { deduplicateTransactions } from '@/lib/transactionDeduplication';
import { generateImportBatchId, saveLastImportBatch, getLastImportBatch, clearLastImportBatch } from '@/lib/importBatchTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MAX_PREVIEW = 25;

export function StatementImportManager() {
  const { data, addTransaction, deleteImportBatch } = useFinance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [items, setItems] = useState<StatementItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [format, setFormat] = useState<StatementFormat | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [csvMapping, setCsvMapping] = useState<CsvMapping | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [categoryOverrides, setCategoryOverrides] = useState<Map<string, string>>(new Map());
  const [lastBatch, setLastBatch] = useState<ReturnType<typeof getLastImportBatch>>(() => getLastImportBatch());

  const transactions = useMemo(() => buildTransactionsFromItems(items), [items]);
  const existingIds = useMemo(() => new Set(data.transactions.map((t) => t.id)), [data.transactions]);

  const newTransactions = useMemo(() => {
    return transactions.filter((transaction) => !existingIds.has(transaction.id));
  }, [existingIds, transactions]);

  // Calculate deduplication info
  const deduplicationInfo = useMemo(() => {
    if (newTransactions.length === 0) {
      return { unique: [], duplicates: [], duplicateCount: 0 };
    }
    const result = deduplicateTransactions(newTransactions, data.transactions);
    return { ...result, duplicateCount: result.duplicates.length };
  }, [newTransactions, data.transactions]);

  const totals = useMemo(() => {
    return newTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [newTransactions]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setWarnings([]);
    setItems([]);
    setFileName(file.name);
    setRawText(null);
    setFormat(null);
    setCsvPreview(null);
    setCsvMapping(null);
    setShowMapping(false);

    try {
      const text = await file.text();
      const detectedFormat = detectFormat(file.name, text);
      setRawText(text);
      setFormat(detectedFormat);

      if (detectedFormat === 'csv') {
        const preview = parseCsvPreview(text);
        setCsvPreview(preview);
        setCsvMapping(buildDefaultCsvMapping(preview));
      }

      const result = parseStatement(file.name, text);
      setItems(result.items);
      setWarnings(result.warnings);
      setErrors(result.errors);

      if (!result.items.length && !result.errors.length) {
        toast('Nenhuma transacao valida encontrada.');
        if (detectedFormat === 'csv') {
          setShowMapping(true);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao ler o arquivo.';
      setErrors([message]);
    }
  };

  const handleApplyMapping = () => {
    if (!rawText || !csvMapping) return;
    const result = parseCsvWithMapping(rawText, csvMapping);
    setItems(result.items);
    setWarnings(result.warnings);
    setErrors(result.errors);
    setShowMapping(false);
  };

  const updateMappingIndex = (key: keyof CsvMapping, value: string) => {
    if (!csvMapping) return;
    if (key === 'hasHeader') return;
    const numeric = Number(value);
    const requiresValue = key === 'dateIndex' || key === 'descriptionIndex';
    if (Number.isNaN(numeric)) {
      return;
    }
    setCsvMapping({
      ...csvMapping,
      [key]: numeric < 0 && !requiresValue ? null : numeric,
    });
  };

  const handleImport = () => {
    if (!newTransactions.length) {
      toast.error('Nenhuma transacao nova para importar.');
      return;
    }

    // Deduplicate transactions before importing
    const { unique, duplicates } = deduplicateTransactions(newTransactions, data.transactions);
    
    if (duplicates.length > 0) {
      const proceed = window.confirm(
        `Encontradas ${duplicates.length} duplicata(s).\n\n` +
        `${unique.length} transação(ões) única(s) pode(m) ser importada(s).\n\n` +
        `Deseja continuar e importar apenas as transações únicas?`
      );
      
      if (!proceed) {
        return;
      }
    }
    
    if (unique.length === 0) {
      toast.error('Todas as transações são duplicatas. Nada foi importado.');
      return;
    }

    setIsImporting(true);

    try {
      const importBatchId = generateImportBatchId();
      
      unique.forEach((transaction) => {
        // Apply category override if exists
        const finalTransaction = {
          ...transaction,
          categoryId: categoryOverrides.get(transaction.id) || transaction.categoryId,
          importBatchId, // Add import batch ID
        };
        addTransaction(finalTransaction);
      });

      // Save last import batch for undo functionality
      saveLastImportBatch({
        id: importBatchId,
        count: unique.length,
        timestamp: Date.now(),
      });
      
      // Update UI state
      setLastBatch(getLastImportBatch());

      const message = duplicates.length > 0 
        ? `Importadas ${unique.length} transações (${duplicates.length} duplicatas ignoradas)`
        : `Importadas ${unique.length} transações`;
      
      toast.success(message);
      setItems([]);
      setFileName(null);
      setCategoryOverrides(new Map());
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setItems([]);
    setErrors([]);
    setWarnings([]);
    setFileName(null);
    setRawText(null);
    setFormat(null);
    setCsvPreview(null);
    setCsvMapping(null);
    setShowMapping(false);
    setCategoryOverrides(new Map());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUndoLastImport = () => {
    if (!lastBatch) return;

    const confirmed = window.confirm(
      `Deseja realmente deletar os ${lastBatch.count} lançamentos do último import?`
    );

    if (confirmed) {
      deleteImportBatch(lastBatch.id);
      clearLastImportBatch();
      setLastBatch(null);
      toast.success(`Deletados ${lastBatch.count} lançamentos.`);
    }
  };

  const renderColumnSelect = (
    label: string,
    value: number | null,
    onChange: (value: string) => void,
    allowNone: boolean = true
  ) => {
    if (!csvPreview) return null;

    return (
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={value ?? -1}
          onChange={(event) => onChange(event.target.value)}
        >
          {allowNone && <option value={-1}>Nao usar</option>}
          {csvPreview.columns.map((column, index) => (
            <option key={`${label}-${column}-${index}`} value={index}>
              {column}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Extrato (OFX/CSV)</CardTitle>
        <CardDescription>
          Envie um extrato em formato OFX ou CSV. Faremos a leitura, mostraremos uma previa e voce confirma a importacao.
        </CardDescription>
        {lastBatch && (
          <div className="mt-3 rounded-md border border-warning/40 bg-warning/10 p-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Último import: {lastBatch.count} lançamentos
            </span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleUndoLastImport}
            >
              Desfazer
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ofx,.csv,text/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Selecionar arquivo
            </Button>
            {items.length > 0 && (
              <Button variant="ghost" onClick={handleReset}>
                Limpar
              </Button>
            )}
          </div>
          {fileName && <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>}
        </div>

        {errors.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        {format === 'csv' && csvPreview && csvMapping && (
          <div className="rounded-md border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mapear colunas CSV</p>
                <p className="text-xs text-muted-foreground">Ajuste se o CSV nao for detectado automaticamente.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMapping((prev) => !prev)}>
                {showMapping ? 'Esconder' : 'Mostrar'}
              </Button>
            </div>

            {showMapping && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={csvMapping.hasHeader}
                    onChange={(event) => setCsvMapping({ ...csvMapping, hasHeader: event.target.checked })}
                  />
                  Primeira linha e cabecalho
                </label>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {renderColumnSelect('Data', csvMapping.dateIndex, (value) => updateMappingIndex('dateIndex', value), false)}
                  {renderColumnSelect('Descricao', csvMapping.descriptionIndex, (value) => updateMappingIndex('descriptionIndex', value), false)}
                  {renderColumnSelect('Valor (coluna unica)', csvMapping.amountIndex, (value) => updateMappingIndex('amountIndex', value))}
                  {renderColumnSelect('Debito', csvMapping.debitIndex, (value) => updateMappingIndex('debitIndex', value))}
                  {renderColumnSelect('Credito', csvMapping.creditIndex, (value) => updateMappingIndex('creditIndex', value))}
                  {renderColumnSelect('Tipo', csvMapping.typeIndex, (value) => updateMappingIndex('typeIndex', value))}
                  {renderColumnSelect('Fonte', csvMapping.sourceIndex, (value) => updateMappingIndex('sourceIndex', value))}
                </div>

                <Button variant="outline" onClick={handleApplyMapping}>
                  Aplicar mapeamento
                </Button>
              </div>
            )}
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Novos lancamentos</span>
                <span className="font-medium">{newTransactions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total entradas</span>
                <span className="font-medium text-income">{formatCurrency(totals.income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total saidas</span>
                <span className="font-medium text-expense">{formatCurrency(totals.expense)}</span>
              </div>
            </div>

            <ScrollArea className="h-80 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newTransactions.slice(0, MAX_PREVIEW).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-xs">{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{transaction.description}</TableCell>
                      <TableCell className="text-xs">
                        <select
                          className="h-7 text-xs rounded border border-input bg-background px-2"
                          value={categoryOverrides.get(transaction.id) || transaction.categoryId}
                          onChange={(e) => {
                            setCategoryOverrides((prev) => {
                              const next = new Map(prev);
                              next.set(transaction.id, e.target.value);
                              return next;
                            });
                          }}
                        >
                          {getAllCategories().map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className={`text-xs font-medium ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => {
                            const newTxs = newTransactions.filter(t => t.id !== transaction.id);
                            setItems(items.filter(item => {
                              const tx = buildTransactionsFromItems([item])[0];
                              return tx.id !== transaction.id;
                            }));
                          }}
                          className="text-xs text-destructive hover:underline"
                        >
                          ✕
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {newTransactions.length > MAX_PREVIEW && (
              <p className="text-xs text-muted-foreground">
                Mostrando {MAX_PREVIEW} de {newTransactions.length} lancamentos.
              </p>
            )}

            {/* Duplicates warning */}
            {deduplicationInfo.duplicateCount > 0 && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 px-3 py-2 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>{deduplicationInfo.duplicateCount} duplicata(s)</strong> detectada(s).
                  Apenas {deduplicationInfo.unique.length} transação(ões) única(s) será(ão) importada(s).
                </p>
              </div>
            )}

            <Button className="w-full" onClick={handleImport} disabled={isImporting}>
              {isImporting ? 'Importando...' : `Importar ${deduplicationInfo.unique.length || newTransactions.length} lancamentos`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
