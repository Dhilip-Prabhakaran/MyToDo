import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Storage layer with two interchangeable backends behind one interface
// (initDb / load / save):
//   - MongoDB    when MONGODB_URI is set  → durable, survives redeploys
//   - JSON file  otherwise                → zero-setup local development
// The whole app state is a single record, so both backends stay trivial.

const emptyState = { targets: [], milestones: [], subtasks: [], habits: [], habitLogs: [] };
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "mytodo";
const DOC_ID = "app-state";

// ---------- local JSON-file backend ----------
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const dbFile = path.join(dataDir, "db.json");

function fileLoad() {
  if (!fs.existsSync(dbFile)) return structuredClone(emptyState);
  try {
    const parsed = JSON.parse(fs.readFileSync(dbFile, "utf8"));
    return { ...structuredClone(emptyState), ...parsed };
  } catch {
    return structuredClone(emptyState);
  }
}

function fileSave(state) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = dbFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, dbFile);
}

// ---------- MongoDB backend ----------
let collection = null;

async function mongoInit() {
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  collection = client.db(MONGODB_DB).collection("app");
}

async function mongoLoad() {
  const doc = await collection.findOne({ _id: DOC_ID });
  if (!doc) return structuredClone(emptyState);
  const { _id, ...state } = doc;
  return { ...structuredClone(emptyState), ...state };
}

async function mongoSave(state) {
  await collection.replaceOne({ _id: DOC_ID }, { _id: DOC_ID, ...state }, { upsert: true });
}

// ---------- public interface ----------
export const backend = MONGODB_URI ? `MongoDB (db: ${MONGODB_DB})` : "local JSON file";

export async function initDb() {
  if (MONGODB_URI) await mongoInit();
}

export async function load() {
  return MONGODB_URI ? mongoLoad() : fileLoad();
}

export async function save(state) {
  return MONGODB_URI ? mongoSave(state) : fileSave(state);
}
