import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.MYSQL_HOST || '127.0.0.1';
    const port = parseInt(process.env.MYSQL_PORT || '3306');
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'ncc_cbt';

    console.log(`[MySQL] Initializing pool for ${user}@${host}:${port}/${database}`);

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      dateStrings: true // Return date columns as strings to prevent time-zone shifts
    });
  }
  return pool;
}

export interface QueryPayload {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete';
  selectCols?: string;
  insertData?: any;
  updateData?: any;
  filters?: Array<{ type: 'eq' | 'neq' | 'in' | 'or' | 'ilike'; col: string; val: any }>;
  order?: Array<{ col: string; ascending: boolean }>;
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
}

/**
 * Compiles and executes a Supabase-like query payload against the MySQL database.
 */
export async function executePayload(payload: QueryPayload): Promise<{ data: any; error: any }> {
  try {
    const pool = getPool();
    let sql = '';
    const params: any[] = [];

    const table = payload.table;

    if (payload.action === 'select') {
      const cols = payload.selectCols && payload.selectCols !== '*' ? payload.selectCols : '*';
      sql = `SELECT ${cols} FROM \`${table}\``;
    } else if (payload.action === 'insert') {
      const data = Array.isArray(payload.insertData) ? payload.insertData : [payload.insertData];
      if (data.length === 0) {
        return { data: [], error: null };
      }

      // Check all unique keys in the insert object array
      const keys = Object.keys(data[0]);
      const cols = keys.map(k => `\`${k}\``).join(', ');
      
      const valuePlaceholders = data.map(() => {
        return `(${keys.map(() => '?').join(', ')})`;
      }).join(', ');

      data.forEach((row: any) => {
        keys.forEach(key => {
          let val = row[key];
          // Convert objects or arrays to JSON string for JSON columns
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          params.push(val);
        });
      });

      sql = `INSERT INTO \`${table}\` (${cols}) VALUES ${valuePlaceholders}`;
      
      const [result] = await pool.execute(sql, params);
      
      // Return the inserted data or the inserted ID
      return { data: payload.insertData, error: null };
    } else if (payload.action === 'update') {
      const updateData = payload.updateData;
      const keys = Object.keys(updateData);
      
      const sets = keys.map(k => {
        let val = updateData[k];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        params.push(val);
        return `\`${k}\` = ?`;
      }).join(', ');

      sql = `UPDATE \`${table}\` SET ${sets}`;
    } else if (payload.action === 'delete') {
      sql = `DELETE FROM \`${table}\``;
    }

    // Append Filters (WHERE Clause)
    if (payload.filters && payload.filters.length > 0) {
      const whereClauses: string[] = [];
      
      payload.filters.forEach(filter => {
        if (filter.type === 'eq') {
          whereClauses.push(`\`${filter.col}\` = ?`);
          params.push(filter.val);
        } else if (filter.type === 'neq') {
          whereClauses.push(`\`${filter.col}\` != ?`);
          params.push(filter.val);
        } else if (filter.type === 'in') {
          const inVal = Array.isArray(filter.val) ? filter.val : [filter.val];
          if (inVal.length > 0) {
            const placeholders = inVal.map(() => '?').join(', ');
            whereClauses.push(`\`${filter.col}\` IN (${placeholders})`);
            inVal.forEach(v => params.push(v));
          } else {
            // Empty array matches nothing
            whereClauses.push('1 = 0');
          }
        } else if (filter.type === 'ilike') {
          whereClauses.push(`LOWER(\`${filter.col}\`) LIKE LOWER(?)`);
          params.push(filter.val.replace(/%/g, '') ? filter.val : `%${filter.val}%`);
        } else if (filter.type === 'or') {
          // Parse Supabase OR syntax e.g., 'col1.eq.val1,col2.eq.val2'
          const orConditions = filter.val.split(',');
          const orSqls: string[] = [];
          orConditions.forEach((cond: string) => {
            const parts = cond.split('.');
            if (parts.length >= 3) {
              const col = parts[0];
              const op = parts[1];
              let val = parts.slice(2).join('.');
              // Remove optional quotes from val
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
              }
              if (op === 'eq') {
                orSqls.push(`\`${col}\` = ?`);
                params.push(val);
              } else if (op === 'neq') {
                orSqls.push(`\`${col}\` != ?`);
                params.push(val);
              }
            }
          });
          if (orSqls.length > 0) {
            whereClauses.push(`(${orSqls.join(' OR ')})`);
          }
        }
      });

      if (whereClauses.length > 0) {
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }
    }

    // Append Ordering
    if (payload.action === 'select' && payload.order && payload.order.length > 0) {
      const orders = payload.order.map(o => `\`${o.col}\` ${o.ascending ? 'ASC' : 'DESC'}`).join(', ');
      sql += ` ORDER BY ${orders}`;
    }

    // Append Limit
    if (payload.action === 'select' && payload.limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(payload.limit);
    }

    // Execute SELECT/UPDATE/DELETE
    if (payload.action === 'select') {
      const [rows]: any = await pool.execute(sql, params);
      let data = rows;

      // JSON fields parsing helper (MySQL returns JSON strings or objects, let's normalize)
      data = rows.map((row: any) => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          const val = newRow[key];
          if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
            try {
              newRow[key] = JSON.parse(val);
            } catch (e) {
              // Ignore
            }
          }
        });
        return newRow;
      });

      if (payload.single) {
        return { data: data.length > 0 ? data[0] : null, error: data.length > 0 ? null : { message: 'Row not found', code: 'PGRST116' } };
      }
      if (payload.maybeSingle) {
        return { data: data.length > 0 ? data[0] : null, error: null };
      }

      return { data, error: null };
    } else {
      // UPDATE or DELETE
      const [result]: any = await pool.execute(sql, params);
      
      // Return updated row count / status
      return { data: { affectedRows: result.affectedRows }, error: null };
    }
  } catch (err: any) {
    console.error(`[MySQL] Query error in execution:`, err);
    return { data: null, error: { message: err.message || 'MySQL query error', code: err.code } };
  }
}
