"use client";

import { useRemoteList } from "./use-remote-list";
import { getRoles, createRole, deleteRole, type RoleDTO } from "@/app/settings/roles-actions";

export type Role = RoleDTO;

const KEY = "roles";

interface CreateRoleInput {
  name: string;
  baseHourlyRate: number;
}

export function useRoles() {
  const { items: roles, loaded, add, remove } = useRemoteList<Role, CreateRoleInput>(KEY, {
    fetchAll: getRoles,
    create: ({ name, baseHourlyRate }) => createRole(name, baseHourlyRate),
    remove: deleteRole,
  });

  return {
    roles,
    loaded,
    addRole: (name: string, baseHourlyRate: number) => add({ name, baseHourlyRate }),
    removeRole: remove,
  };
}
