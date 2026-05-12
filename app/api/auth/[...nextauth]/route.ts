import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(",").map(e => e.trim()) || [];
      if (user.email && allowedEmails.includes(user.email)) {
        return true;
      }
      // If not allowed, redirect to login page with error
      return "/login?error=AccessDenied";
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
