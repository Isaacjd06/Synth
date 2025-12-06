import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      // Extended fields from Prisma User model
      google_id?: string | null;
      avatar_url?: string | null;
      email_verified?: boolean | null;
      provider?: string | null;
      last_login_at?: Date | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    google_id?: string | null;
    avatar_url?: string | null;
    email_verified?: boolean | null;
    provider?: string | null;
    last_login_at?: Date | null;
  }
}

