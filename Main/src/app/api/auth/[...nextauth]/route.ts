import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "admin@fuzzy.com" && credentials?.password === "password123") {
          return { id: "1", name: "Admin", email: "admin@fuzzy.com" };
        }
        return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});

export { handler as GET, handler as POST };