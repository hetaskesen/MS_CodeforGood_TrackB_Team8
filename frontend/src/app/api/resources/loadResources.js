import fs from "fs";
import path from "path";
import { getBorough } from "@/lib/zipToBorough";

let cachedResources = null;
let cachedMeta = null;

function getDataPath() {
  const base = process.cwd();
  const candidates = [
    path.join(base, "backend", "all_resources.json"),
    path.join(base, "..", "backend", "all_resources.json"),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

export function getResources() {
  if (cachedResources) return cachedResources;
  const dataPath = getDataPath();
  if (!dataPath) return null;
  const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  cachedResources = (Array.isArray(raw) ? raw : []).filter(
    (r) =>
      r?.resourceStatus?.id === "PUBLISHED" && !r.mergedToResourceId
  );
  return cachedResources;
}

export function getMeta() {
  if (cachedMeta) return cachedMeta;
  const resources = getResources();
  if (!resources) return null;

  const types = [
    ...new Set(
      resources.map((r) => r.resourceType?.id).filter(Boolean)
    ),
  ].sort();

  const zips = [
    ...new Set(resources.map((r) => r.zipCode).filter(Boolean)),
  ].sort((a, b) => String(a).localeCompare(String(b)));

  const tags = [
    ...new Set(
      resources.flatMap((r) =>
        (r.tags || []).map((t) => t.name).filter(Boolean)
      )
    ),
  ].sort();

  const boroughs = [
    ...new Set(
      resources.map((r) => getBorough(r.zipCode)).filter(Boolean)
    ),
  ].sort();

  const regions = [
    ...new Set(
      resources.flatMap((r) =>
        (r.regions || []).map((reg) => reg.id).filter(Boolean)
      )
    ),
  ].sort();

  cachedMeta = { types, zips, boroughs, tags, regions, totalCount: resources.length };
  return cachedMeta;
}

export function getDataPathForError() {
  return getDataPath();
}
