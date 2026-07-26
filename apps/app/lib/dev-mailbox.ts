import { env } from "./env";

export type DevMailboxMessage = {
  to: string;
  subject: string;
  text: string;
  createdAt?: string;
};

export function isDevMailboxUiEnabled(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

export function devMailboxUrl(email: string): string {
  const base = env.apiUrl.replace(/\/$/, "");
  return `${base}/api/dev/mailbox?to=${encodeURIComponent(email)}`;
}

export function extractEmailLink(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>]+/);
  return match?.[0] ?? null;
}

function isDevMailboxMessage(value: unknown): value is DevMailboxMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("to" in value) || !("subject" in value) || !("text" in value)) {
    return false;
  }
  return (
    typeof value.to === "string" &&
    typeof value.subject === "string" &&
    typeof value.text === "string" &&
    (!("createdAt" in value) || typeof value.createdAt === "string")
  );
}

export async function fetchDevMailbox(email: string): Promise<DevMailboxMessage[]> {
  const response = await fetch(devMailboxUrl(email));
  if (!response.ok) {
    throw new Error("Local mailbox is unavailable for this API");
  }
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("messages" in body)) {
    return [];
  }
  const { messages } = body;
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.filter(isDevMailboxMessage);
}
