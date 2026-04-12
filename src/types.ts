export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
}

export interface AuditEntry {
  userId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  timestamp: string;
}
