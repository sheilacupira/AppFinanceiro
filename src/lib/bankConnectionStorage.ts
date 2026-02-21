/**
 * Bank Connections Storage
 * Gerencia conexões com bancos via Open Finance
 */

import type { BankConnection, BankAccount } from '@/types/openFinance';

const STORAGE_KEY = 'bank-connections';

class BankConnectionStorage {
  /**
   * Salva todas as conexões
   */
  private saveConnections(connections: BankConnection[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
    } catch (error) {
      console.error('Erro ao salvar conexões:', error);
    }
  }

  /**
   * Carrega todas as conexões
   */
  getAll(): BankConnection[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
      return [];
    }
  }

  /**
   * Busca conexão por ID
   */
  getById(id: string): BankConnection | null {
    const connections = this.getAll();
    return connections.find((c) => c.id === id) || null;
  }

  /**
   * Adiciona ou atualiza conexão
   */
  upsert(connection: BankConnection): void {
    const connections = this.getAll();
    const index = connections.findIndex((c) => c.id === connection.id);

    if (index >= 0) {
      connections[index] = connection;
    } else {
      connections.push(connection);
    }

    this.saveConnections(connections);
  }

  /**
   * Remove conexão
   */
  delete(id: string): void {
    const connections = this.getAll().filter((c) => c.id !== id);
    this.saveConnections(connections);
  }

  /**
   * Atualiza status de uma conexão
   */
  updateStatus(id: string, status: BankConnection['status'], errorMessage?: string): void {
    const connection = this.getById(id);
    if (!connection) return;

    connection.status = status;
    if (errorMessage) {
      connection.errorMessage = errorMessage;
    } else {
      delete connection.errorMessage;
    }

    this.upsert(connection);
  }

  /**
   * Adiciona contas a uma conexão
   */
  updateAccounts(connectionId: string, accounts: BankAccount[]): void {
    const connection = this.getById(connectionId);
    if (!connection) return;

    connection.accounts = accounts;
    connection.lastSyncAt = Date.now();
    this.upsert(connection);
  }

  /**
   * Marca sincronização bem-sucedida
   */
  markSynced(connectionId: string): void {
    const connection = this.getById(connectionId);
    if (!connection) return;

    connection.lastSyncAt = Date.now();
    connection.status = 'CONNECTED';
    delete connection.errorMessage;
    this.upsert(connection);
  }

  /**
   * Limpa todas as conexões
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const bankConnectionStorage = new BankConnectionStorage();
