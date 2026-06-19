// Supabase-to-MySQL Compatibility Client (Client-Side & Server-Side unified mock)
import { QueryPayload } from './mysql-db';

class MySQLQueryBuilder {
  private payload: QueryPayload;

  constructor(table: string) {
    this.payload = {
      table,
      action: 'select',
      filters: [],
      order: []
    };
  }

  select(columns: string = '*') {
    this.payload.selectCols = columns;
    return this;
  }

  insert(data: any) {
    this.payload.action = 'insert';
    this.payload.insertData = data;
    return this;
  }

  update(data: any) {
    this.payload.action = 'update';
    this.payload.updateData = data;
    return this;
  }

  delete() {
    this.payload.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.payload.filters?.push({ type: 'eq', col: column, val: value });
    return this;
  }

  neq(column: string, value: any) {
    this.payload.filters?.push({ type: 'neq', col: column, val: value });
    return this;
  }

  in(column: string, values: any[]) {
    this.payload.filters?.push({ type: 'in', col: column, val: values });
    return this;
  }

  or(filterString: string) {
    this.payload.filters?.push({ type: 'or', col: '', val: filterString });
    return this;
  }

  ilike(column: string, value: string) {
    this.payload.filters?.push({ type: 'ilike', col: column, val: value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.payload.order?.push({ col: column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.payload.limit = count;
    return this;
  }

  single() {
    this.payload.single = true;
    return this;
  }

  maybeSingle() {
    this.payload.maybeSingle = true;
    return this;
  }

  range(from: number, to: number) {
    this.payload.limit = to - from + 1;
    return this;
  }

  // Thenable implementation to support async/await directly on the query builder
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      let res;
      if (typeof window === 'undefined') {
        // Server-Side: Execute directly to avoid HTTP loop
        const { executePayload } = await import('./mysql-db');
        res = await executePayload(this.payload);
      } else {
        // Client-Side: Call database API route
        const httpRes = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.payload)
        });
        res = await httpRes.json();
      }
      return onfulfilled ? onfulfilled(res) : res;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }
}

class MySQLChannel {
  name: string;
  listeners: Array<{ event: string; table: string; callback: () => void }> = [];
  intervalId: any = null;

  constructor(name: string) {
    this.name = name;
  }

  on(type: string, filter: { event: string; schema: string; table: string }, callback: () => void) {
    this.listeners.push({ event: filter.event, table: filter.table, callback });
    return this;
  }

  subscribe() {
    // Client-side Polling: Triggers changes checking every 4 seconds to simulate real-time
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => {
        this.listeners.forEach(l => l.callback());
      }, 4000);
    }
    return {
      unsubscribe: () => {
        if (this.intervalId) clearInterval(this.intervalId);
      }
    };
  }
}

// Storage Mock: Saves uploads to /api/upload which writes to local public/uploads/ folder
class MySQLStorageBucket {
  private bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  async upload(fileName: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('bucket', this.bucketName);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal upload file');
      return { data: result, error: null };
    } catch (err: any) {
      console.error('[Storage Mock] Upload error:', err);
      return { data: null, error: { message: err.message || 'Gagal upload file' } };
    }
  }

  getPublicUrl(fileName: string) {
    return {
      data: {
        publicUrl: `/uploads/${fileName}`
      }
    };
  }
}

export function createMySQLClient(cookiesStore?: any) {
  return {
    from: (table: string) => new MySQLQueryBuilder(table),
    
    channel: (name: string) => new MySQLChannel(name),
    
    storage: {
      from: (bucket: string) => new MySQLStorageBucket(bucket)
    },

    auth: {
      signUp: async (options: any) => {
        try {
          if (typeof window === 'undefined') {
            const { executePayload } = await import('./mysql-db');
            const bcrypt = await import('bcryptjs');
            const { cookies } = await import('next/headers');

            const email = options.email;
            const password = options.password;
            const username = options.options?.data?.username || email.split('@')[0];
            const full_name = options.options?.data?.full_name || '';
            const school = options.options?.data?.school || '';
            const npsn = options.options?.data?.npsn || '';

            const { data: existing } = await executePayload({
              table: 'profiles',
              action: 'select',
              filters: [{ type: 'eq', col: 'email', val: email }]
            });

            if (existing && existing.length > 0) {
              throw new Error('Email sudah terdaftar');
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            const id = 'user-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);

            const newUser = {
              id,
              username,
              email,
              password_hash,
              full_name,
              school: school || null,
              npsn: npsn || null,
              role: 'peserta'
            };

            await executePayload({
              table: 'profiles',
              action: 'insert',
              insertData: newUser
            });

            const cookieStore = await cookies();
            cookieStore.set('ncc_hint', '1', { path: '/', maxAge: 60 * 60 * 24 * 7 });

            return { data: { user: { id, email, role: 'peserta' } }, error: null };
          } else {
            const res = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: options.email,
                password: options.password,
                username: options.options?.data?.username || options.email.split('@')[0],
                full_name: options.options?.data?.full_name || '',
                school: options.options?.data?.school || '',
                npsn: options.options?.data?.npsn || ''
              })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            return { data: { user: result.user }, error: null };
          }
        } catch (err: any) {
          return { data: { user: null }, error: { message: err.message || 'Gagal daftar' } };
        }
      },

      signInWithPassword: async (options: any) => {
        try {
          if (typeof window === 'undefined') {
            const { executePayload } = await import('./mysql-db');
            const bcrypt = await import('bcryptjs');
            const jwt = await import('jsonwebtoken');
            const { cookies } = await import('next/headers');

            const email = options.email;
            const password = options.password;

            const { data: users } = await executePayload({
              table: 'profiles',
              action: 'select',
              filters: [{ type: 'eq', col: 'email', val: email }]
            });

            if (!users || users.length === 0) {
              throw new Error('Kredensial tidak valid');
            }

            const user = users[0];
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
              throw new Error('Kredensial tidak valid');
            }

            const JWT_SECRET = process.env.JWT_SECRET || 'ncc-super-secret-key';
            const token = jwt.sign(
              {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                user_metadata: { role: user.role }
              },
              JWT_SECRET,
              { expiresIn: '7d' }
            );

            const cookieStore = await cookies();
            cookieStore.set('sb-access-token', token, {
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 7 // 7 days
            });
            cookieStore.set('ncc-auth-token', token, {
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 7
            });
            cookieStore.set('ncc_hint', '1', { path: '/', maxAge: 60 * 60 * 24 * 7 });

            const userObj = {
              id: user.id,
              email: user.email,
              role: user.role,
              user_metadata: { role: user.role }
            };

            return { data: { user: userObj }, error: null };
          } else {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: options.email,
                password: options.password
              })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            return { data: { user: result.user }, error: null };
          }
        } catch (err: any) {
          return { data: { user: null }, error: { message: err.message || 'Gagal login' } };
        }
      },

      signOut: async () => {
        try {
          const res = await fetch('/api/auth/logout', { method: 'POST' });
          return { error: res.ok ? null : { message: 'Sign out failed' } };
        } catch (err: any) {
          return { error: { message: err.message } };
        }
      },

      getUser: async () => {
        // Direct execution on server if cookiesStore is provided, otherwise fetch
        try {
          if (typeof window === 'undefined') {
            const token = cookiesStore?.get('sb-access-token')?.value || cookiesStore?.get('ncc-auth-token')?.value;
            if (!token) return { data: { user: null }, error: null };
            
            try {
              const parts = token.split('.');
              if (parts.length !== 3) return { data: { user: null }, error: null };
              
              const base64Url = parts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const decoded = JSON.parse(jsonPayload);
              return { data: { user: decoded }, error: null };
            } catch (e) {
              return { data: { user: null }, error: null };
            }
          } else {
            const res = await fetch('/api/auth/user');
            if (!res.ok) return { data: { user: null }, error: null };
            const result = await res.json();
            return { data: { user: result.user }, error: null };
          }
        } catch (err) {
          return { data: { user: null }, error: null };
        }
      },

      getSession: async () => {
        // Returns a minimal mock session
        try {
          let token = '';
          if (typeof window === 'undefined') {
            token = cookiesStore?.get('sb-access-token')?.value || cookiesStore?.get('ncc-auth-token')?.value || '';
          } else {
            const res = await fetch('/api/auth/session');
            if (res.ok) {
              const result = await res.json();
              token = result.session?.access_token || '';
            }
          }
          if (!token) return { data: { session: null }, error: null };
          return {
            data: {
              session: {
                access_token: token,
                user: {}
              }
            },
            error: null
          };
        } catch (err) {
          return { data: { session: null }, error: null };
        }
      }
    }
  };
}

export function createMySQLServerClient(options?: any) {
  // Extract custom cookies handler if provided
  const reqCookies = options?.cookies;
  
  // Create a cookies adapter
  const adapter = {
    get: (name: string) => {
      if (reqCookies && typeof reqCookies.getAll === 'function') {
        const cList = reqCookies.getAll();
        const found = cList.find((c: any) => c.name === name);
        return found ? { value: found.value } : undefined;
      }
      return undefined;
    }
  };
  
  return createMySQLClient(adapter);
}
