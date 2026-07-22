"use client";

import { useState } from "react";
import { useRoles } from "@/lib/use-roles";
import { inputClass } from "@/lib/form-styles";

export function RolesManager() {
  const { roles, loaded, addRole, updateRole, removeRole } = useRoles();
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editAttempted, setEditAttempted] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const nameValid = name.trim() !== "";
  const rateNum = Number(rate);
  const rateValid = rate !== "" && rateNum >= 0;

  const editNameValid = editName.trim() !== "";
  const editRateNum = Number(editRate);
  const editRateValid = editRate !== "" && editRateNum >= 0;

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setError(null);
    if (!nameValid || !rateValid) return;
    setSubmitting(true);
    try {
      await addRole(name.trim(), Math.round(rateNum * 100) / 100);
      setName("");
      setRate("");
      setAttempted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add role — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeRole(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove role — try again.");
    }
  }

  function startEdit(role: { id: string; name: string; baseHourlyRate: number }) {
    setError(null);
    setEditingId(role.id);
    setEditName(role.name);
    setEditRate(String(role.baseHourlyRate));
    setEditAttempted(false);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(id: string) {
    setEditAttempted(true);
    if (!editNameValid || !editRateValid) return;
    setEditSubmitting(true);
    try {
      await updateRole(id, editName.trim(), Math.round(editRateNum * 100) / 100);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save role — try again.");
    } finally {
      setEditSubmitting(false);
    }
  }

  return (
    <div>
      {loaded && roles.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No roles yet — add one below (e.g. Bartender, Server, Event Bar).
        </p>
      )}

      {roles.length > 0 && (
        <ul className="space-y-2">
          {roles.map((role) =>
            editingId === role.id ? (
              <li
                key={role.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor={`edit-name-${role.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Role name
                    </label>
                    <input
                      id={`edit-name-${role.id}`}
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                  <div className="w-24">
                    <label
                      htmlFor={`edit-rate-${role.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Base $/hr
                    </label>
                    <input
                      id={`edit-rate-${role.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={editRate}
                      onChange={(event) => setEditRate(event.target.value)}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                </div>
                {editAttempted && (!editNameValid || !editRateValid) && (
                  <p className="mt-1.5 text-xs text-accent">
                    Enter a role name and a base rate of $0 or more.
                  </p>
                )}
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(role.id)}
                    disabled={editSubmitting}
                    className="cursor-pointer text-xs font-medium text-accent hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editSubmitting ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={editSubmitting}
                    className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={role.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{role.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${role.baseHourlyRate.toFixed(2)}/hr base
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(role)}
                    className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-accent"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(role.id)}
                    className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-accent"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="role-name" className="text-xs text-muted-foreground">
            Role name
          </label>
          <input
            id="role-name"
            type="text"
            placeholder="Position"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div className="w-28">
          <label htmlFor="role-rate" className="text-xs text-muted-foreground">
            Base $/hr
          </label>
          <input
            id="role-rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="Rate"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>
      {attempted && (!nameValid || !rateValid) && (
        <p className="mt-1.5 text-xs text-accent">
          Enter a role name and a base rate of $0 or more.
        </p>
      )}
      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
    </div>
  );
}
