async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `${method} ${url} failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  getState: () => req("GET", "/api/state"),

  addTarget: (data) => req("POST", "/api/targets", data),
  updateTarget: (id, data) => req("PUT", `/api/targets/${id}`, data),
  deleteTarget: (id) => req("DELETE", `/api/targets/${id}`),

  addMilestone: (targetId, data) => req("POST", `/api/targets/${targetId}/milestones`, data),
  reorderMilestones: (targetId, ids) =>
    req("PUT", `/api/targets/${targetId}/milestones/order`, { ids }),
  updateMilestone: (id, data) => req("PUT", `/api/milestones/${id}`, data),
  deleteMilestone: (id) => req("DELETE", `/api/milestones/${id}`),

  addSubtask: (milestoneId, data) => req("POST", `/api/milestones/${milestoneId}/subtasks`, data),
  updateSubtask: (id, data) => req("PUT", `/api/subtasks/${id}`, data),
  deleteSubtask: (id) => req("DELETE", `/api/subtasks/${id}`),

  addHabit: (data) => req("POST", "/api/habits", data),
  updateHabit: (id, data) => req("PUT", `/api/habits/${id}`, data),
  deleteHabit: (id) => req("DELETE", `/api/habits/${id}`),
  // opts: { value } (0–100), { rest: true }, or { done } (legacy true/false).
  logHabit: (id, date, opts) => req("PUT", `/api/habits/${id}/log`, { date, ...opts }),

  restore: (backup) => req("POST", "/api/restore", backup),
};
