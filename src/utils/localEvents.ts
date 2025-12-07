export type LocalEvent = {
  id: string;
  name: string;
  expiresAt: number; // epoch ms
  createdAt: number;
  owner: string;
  sold: number;
  scanned: number;
};

export type LocalTicket = {
  eventId: string;
  address: string;
  tokenId: string;
  purchasedAt: number;
  scanned: boolean;
};

const EVENTS_KEY = "spotlight_events";
const TICKETS_KEY = "spotlight_tickets";

const safeGet = (key: string) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
};

const safeSet = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
};

export const loadEvents = (): LocalEvent[] => {
  const raw = safeGet(EVENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveEvents = (events: LocalEvent[]) => {
  safeSet(EVENTS_KEY, JSON.stringify(events));
};

export const createEvent = (
  name: string,
  expiresAt: number,
  owner: string
): LocalEvent => {
  const events = loadEvents();
  const event: LocalEvent = {
    id: crypto.randomUUID(),
    name,
    expiresAt,
    createdAt: Date.now(),
    owner: owner.toLowerCase(),
    sold: 0,
    scanned: 0,
  };
  events.push(event);
  saveEvents(events);
  return event;
};

export const incrementSold = (eventId: string) => {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx >= 0) {
    events[idx].sold += 1;
    saveEvents(events);
  }
};

export const incrementScanned = (eventId: string) => {
  const events = loadEvents();
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx >= 0) {
    events[idx].scanned += 1;
    saveEvents(events);
  }
};

export const loadTickets = (): LocalTicket[] => {
  const raw = safeGet(TICKETS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveTickets = (tickets: LocalTicket[]) => {
  safeSet(TICKETS_KEY, JSON.stringify(tickets));
};

export const addTicket = (ticket: LocalTicket) => {
  const tickets = loadTickets();
  const exists = tickets.find(
    (t) =>
      t.address.toLowerCase() === ticket.address.toLowerCase() &&
      t.eventId === ticket.eventId
  );
  if (!exists) {
    tickets.push({ ...ticket, address: ticket.address.toLowerCase() });
    saveTickets(tickets);
  }
};

export const markTicketScanned = (address: string, eventId: string) => {
  const tickets = loadTickets();
  const idx = tickets.findIndex(
    (t) =>
      t.address.toLowerCase() === address.toLowerCase() &&
      t.eventId === eventId
  );
  if (idx >= 0) {
    tickets[idx].scanned = true;
    saveTickets(tickets);
  }
};

export const ticketsForAddress = (address: string): LocalTicket[] => {
  return loadTickets().filter(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
};

export const eventsForOwner = (owner: string): LocalEvent[] => {
  return loadEvents().filter((e) => e.owner === owner.toLowerCase());
};

export const activeEvents = (now: number = Date.now()): LocalEvent[] => {
  return loadEvents().filter((e) => e.expiresAt > now);
};



