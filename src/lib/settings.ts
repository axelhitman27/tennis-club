import { db } from "./db";

export function getSettings() {
  return db.settings.upsert({ where: { id: "club" }, update: {}, create: { id: "club" } });
}
