import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Hardcoded users dengan password plain text (untuk development)
const users = [
  {
    id: "1",
    email: "admin@fuzzy.com",
    name: "Admin",
    password: "password123", // plain text!
    role: "ADMIN" as const,
  },
  {
    id: "2",
    email: "peneliti@fuzzy.com",
    name: "Peneliti",
    password: "password123",
    role: "PENELITI" as const,
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Login attempt:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        // Cari user berdasarkan email
        const user = users.find((u) => u.email === credentials.email);
        if (!user) {
          console.log("User not found:", credentials.email);
          return null;
        }

        // Bandingkan password langsung (plain text)
        if (user.password !== credentials.password) {
          console.log("Password mismatch");
          return null;
        }

        console.log("Login successful:", user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  debug: true, // biarkan true untuk melihat log
  secret: process.env.NEXTAUTH_SECRET,
};