import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from '@/lib/db';
import { z } from 'zod';
import sql from 'mssql';
import { createHash } from "crypto";

interface SigeUser {
    Codigo: number;
    Apellido: string;
    Nombre: string;
    Login: string;
    Clave: string;
    Bloqueado: string;
    Inactivo: string;
    SuperAdministrador: string;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost:true,
    providers: [
        Credentials({
            credentials: {
                username: { label: 'Usuario', type: 'text' },
                password: { label: 'Constraseña', type: 'password' },
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

                const isWhitelisted = whitelist.includes(parsed.data.username.toUpperCase());
                if (!isWhitelisted) return null;


                const users = await query<SigeUser>(
                    `SELECT Codigo, Apellido, Nombre, Login, Clave, Bloqueado, Inactivo, SuperAdministrador
                    FROM usUsuarios
                    WHERE Login = @login`,
                    { login: { type: sql.VarChar(255), value: parsed.data.username } }
                );

                const user = users[0];
                if (!user) return null;

                if (user.Bloqueado === 'S' || user.Inactivo === 'S') return null;
                
                return {
                    id: String(user.Codigo),
                    name: `${user.Nombre} ${user.Apellido}`,
                }
            }
        })
    ],
    pages: {
        signIn: '/login'
    },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60,
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (token.id) {
                session.user.id = token.id as string
            }
            return session;
        }
    }
})