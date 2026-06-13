import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/connexion"
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
            clientProfile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });

        if (!user || !user.passwordHash || user.status === "SUSPENDED") {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: user.status === "INVITED" ? "ACTIVE" : user.status,
            lastLoginAt: new Date()
          }
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.clientProfile ? `${user.clientProfile.firstName} ${user.clientProfile.lastName}` : user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    }
  }
};
