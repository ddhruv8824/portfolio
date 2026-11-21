import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { AgentRun, DB, Draft, Project } from "./types";

// MVP storage: a single JSON file. Swap this module for Postgres (e.g. Supabase)
// when moving beyond the MVP — the rest of the app only uses these functions.

const DB_PATH = path.join(process.cwd(), "data", "pulsora.json");

// Route handlers and server components can run in separate module instances, so we
// never trust an in-memory copy: every read hits the file, and every write is a
// serialized read-modify-write.
let lock: Promise<unknown> = Promise.resolve();

async function readDb(): Promise<DB> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as DB;
  } catch {
    return { projects: [], drafts: [], runs: [] };
  }
}

async function load(): Promise<DB> {
  return readDb();
}

/** Run `fn` against a fresh copy of the DB and persist the result atomically. */
function mutate<T>(fn: (db: DB) => T): Promise<T> {
  const next = lock.then(async () => {
    const db = await readDb();
    const result = fn(db);
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    const tmp = `${DB_PATH}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, DB_PATH);
    return result;
  });
  lock = next.catch(() => undefined);
  return next;
}

export const newId = () => randomUUID().slice(0, 8);
const now = () => new Date().toISOString();

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  const db = await load();
  return [...db.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProject(id: string): Promise<Project | undefined> {
  return (await load()).projects.find((p) => p.id === id);
}

export async function createProject(p: Omit<Project, "id" | "createdAt">): Promise<Project> {
  const project: Project = { ...p, id: newId(), createdAt: now() };
  await mutate((db) => db.projects.push(project));
  return project;
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project | undefined> {
  return mutate((db) => {
    const p = db.projects.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    return p;
  });
}

export async function deleteProject(id: string): Promise<void> {
  await mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.drafts = db.drafts.filter((d) => d.projectId !== id);
    db.runs = db.runs.filter((r) => r.projectId !== id);
  });
}

// ---------- Drafts ----------

export async function listDrafts(projectId: string): Promise<Draft[]> {
  const db = await load();
  return db.drafts
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addDrafts(
  drafts: Omit<Draft, "id" | "createdAt" | "updatedAt" | "status">[],
): Promise<Draft[]> {
  const created: Draft[] = drafts.map((d) => ({
    ...d,
    id: newId(),
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  }));
  await mutate((db) => db.drafts.push(...created));
  return created;
}

export async function updateDraft(
  id: string,
  patch: Partial<Pick<Draft, "status" | "title" | "body">>,
): Promise<Draft | undefined> {
  return mutate((db) => {
    const d = db.drafts.find((x) => x.id === id);
    if (d) Object.assign(d, patch, { updatedAt: now() });
    return d;
  });
}

// ---------- Runs (activity log) ----------

export async function addRun(r: Omit<AgentRun, "id" | "createdAt">): Promise<AgentRun> {
  const run: AgentRun = { ...r, id: newId(), createdAt: now() };
  await mutate((db) => db.runs.push(run));
  return run;
}

export async function listRuns(projectId: string): Promise<AgentRun[]> {
  const db = await load();
  return db.runs
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
