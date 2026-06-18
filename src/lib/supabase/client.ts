import { createMySQLClient } from '../mysql-client';

export function createClient() {
  return createMySQLClient();
}
