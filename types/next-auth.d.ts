import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string; // 🔥 ADICIONADO
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      role: string; // 🔥 ADICIONADO
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string; // 🔥 ADICIONADO
  }
}
