"use client";

import { useRemoteList } from "./use-remote-list";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type RoleDTO,
} from "@/app/settings/roles-actions";

export type Role = RoleDTO;

const KEY = "roles";

interface RoleInput {
  name: string;
  baseHourlyRate: number;
}

export function useRoles() {
  const { items: roles, loaded, add, update, remove } = useRemoteList<Role, RoleInput>(KEY, {
    fetchAll: getRoles,
    create: ({ name, baseHourlyRate }) => createRole(name, baseHourlyRate),
    update: (id, { name, baseHourlyRate }) => updateRole(id, name, baseHourlyRate),
    remove: deleteRole,
  });

  return {
    roles,
    loaded,
    addRole: (name: string, baseHourlyRate: number) => add({ name, baseHourlyRate }),
    updateRole: (id: string, name: string, baseHourlyRate: number) =>
      update(id, { name, baseHourlyRate }),
    removeRole: remove,
  };
}
