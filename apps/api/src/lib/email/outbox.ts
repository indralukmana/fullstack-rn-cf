export type OutboundEmail = {
  id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  createdAt: string;
};

const MAX_MESSAGES = 100;
const messages: OutboundEmail[] = [];

export function recordOutboundEmail(
  message: Omit<OutboundEmail, "id" | "createdAt">,
): OutboundEmail {
  const recorded: OutboundEmail = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...message,
  };

  messages.unshift(recorded);
  if (messages.length > MAX_MESSAGES) {
    messages.length = MAX_MESSAGES;
  }

  return recorded;
}

export function listOutboundEmails(to?: string): OutboundEmail[] {
  if (!to) {
    return [...messages];
  }

  const needle = to.toLowerCase();
  return messages.filter((message) => message.to.toLowerCase() === needle);
}

export function clearOutboundEmails() {
  messages.length = 0;
}

export function extractLink(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>]+/);
  return match?.[0] ?? null;
}
