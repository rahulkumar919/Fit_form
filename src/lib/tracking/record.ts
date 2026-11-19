import { connectDB, hasDB } from "@/lib/db/mongoose";
import { TrafficEventModel, type EventType } from "@/models/TrafficEvent";

export interface EventInput {
  type: EventType;
  vid: string;
  sid: string;
  path?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  linkCode?: string;
  device?: string;
  refId?: string;
  value?: number;
  orderId?: string;
}

/** Store analytics events. Never throws: tracking must never break shopping. */
export async function recordEvents(events: EventInput[]): Promise<void> {
  if (!hasDB() || events.length === 0) return;
  try {
    await connectDB();
    await TrafficEventModel.insertMany(
      events.map((e) => ({
        ...e,
        path: (e.path ?? "").slice(0, 300),
        source: e.source ?? "direct",
        value: Math.max(0, Math.round(e.value ?? 0)),
      })),
      { ordered: false },
    );
  } catch (err) {
    console.error("[tracking] failed to record events", err);
  }
}

/* ── Simple fixed-window rate limiter (per instance; good enough to stop floods) ── */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimited(key: string, limit = 120, windowMs = 60_000): boolean {
  const now = Date.now();
  if (buckets.size > 50_000) buckets.clear();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > limit;
}
