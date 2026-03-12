import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPool } from '@/lib/db';
import { z } from 'zod';

interface SigeUser {
  Codigo:             number;
  Apellido:           string;
  Nombre:             string;
  Login:              string;
  Clave:              string;
  Bloqueado:          string;
  Inactivo:           string;
  SuperAdministrador: string;
}

// Solo letras, números y algunos caracteres comunes en usernames — sin quotes ni chars peligrosos
const LOGIN_REGEX = /^[a-zA-Z0-9._-]{1,50}$/;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuario',    type: 'text'     },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {

        const parsed = z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        }).safeParse(credentials);

        if (!parsed.success) return null;

        const masterPassword = process.env.AUTH_MASTER_PASSWORD;
        if (parsed.data.password !== masterPassword) return null;

        const whitelist = (process.env.AUTH_ALLOWED_USERS ?? '')
          .split(',')
          .map(u => u.trim().toUpperCase());

        const username = parsed.data.username.toUpperCase();

        if (!whitelist.includes(username)) return null;

        // Validar formato antes de interpolar
        if (!LOGIN_REGEX.test(username)) return null;

        const pool   = await getPool();
        const result = await pool.request().query<SigeUser>(`
          SELECT Codigo, Apellido, Nombre, Login, Clave, Bloqueado, Inactivo, SuperAdministrador
          FROM usUsuarios
          WHERE Login = '${username}'
        `);

        const user = result.recordset[0];
        if (!user) return null;

        if (user.Bloqueado === 'S' || user.Inactivo === 'S') return null;

        return {
          id:   String(user.Codigo),
          name: `${user.Nombre} ${user.Apellido}`,
        };
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    }
  }
});