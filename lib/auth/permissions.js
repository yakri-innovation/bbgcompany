export const roles = {
  CLIENT: "CLIENT",
  ADVISOR: "ADVISOR",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN"
};

export const protectedRoutePrefixes = ["/espace-client", "/admin", "/manager"];

export const adminRoles = [roles.ADMIN, roles.SUPER_ADMIN];

export const managerRoles = [roles.MANAGER, ...adminRoles];

export const internalRoles = [roles.ADVISOR, roles.MANAGER, roles.ADMIN, roles.SUPER_ADMIN];
