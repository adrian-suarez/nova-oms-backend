export const UsersPermissions = {
  READ: {
    name: "users.read",
    description: "Read users",
  },

  CREATE: {
    name: "users.create",
    description: "Create users",
  },

  UPDATE: {
    name: "users.update",
    description: "Update users",
  },

  DELETE: {
    name: "users.delete",
    description: "Delete users",
  },
} as const;
