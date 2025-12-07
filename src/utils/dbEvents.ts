import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type DbEvent = {
  id: string;
  name: string;
  expiresAt: number;
  createdAt: number;
  owner: string;
  sold: number;
  scanned: number;
};

export type DbTicket = {
  id: string;
  eventId: string;
  address: string;
  tokenId: string; // app-level ticket id
  purchasedAt: number;
  scanned: boolean;
};

const eventsCol = collection(db, "events");
const ticketsCol = collection(db, "tickets");

export const listActiveEvents = async (): Promise<DbEvent[]> => {
  const now = Date.now();
  const q = query(eventsCol, where("expiresAt", ">", now), orderBy("expiresAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DbEvent, "id">) }));
};

export const listOwnedEvents = async (owner: string): Promise<DbEvent[]> => {
  const q = query(eventsCol, where("owner", "==", owner.toLowerCase()), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DbEvent, "id">) }));
};

export const getEvent = async (eventId: string): Promise<DbEvent | null> => {
  const ref = doc(eventsCol, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<DbEvent, "id">) };
};

export const createEventDb = async (
  name: string,
  expiresAt: number,
  owner: string
): Promise<DbEvent> => {
  const newEvent: Omit<DbEvent, "id"> = {
    name,
    expiresAt,
    createdAt: Date.now(),
    owner: owner.toLowerCase(),
    sold: 0,
    scanned: 0,
  };
  const ref = await addDoc(eventsCol, newEvent);
  return { id: ref.id, ...newEvent };
};

export const incrementEventCounters = async (
  eventId: string,
  delta: Partial<{ sold: number; scanned: number }>
) => {
  const ref = doc(eventsCol, eventId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as DbEvent;
  await updateDoc(ref, {
    sold: (data.sold || 0) + (delta.sold || 0),
    scanned: (data.scanned || 0) + (delta.scanned || 0),
  });
};

export const createTicket = async (
  eventId: string,
  address: string
): Promise<DbTicket> => {
  const ticketBase = {
    eventId,
    address: address.toLowerCase(),
    purchasedAt: Date.now(),
    scanned: false,
  };
  const ref = await addDoc(ticketsCol, ticketBase);
  const ticket: DbTicket = {
    id: ref.id,
    tokenId: ref.id, // use doc id as app-level token id
    ...ticketBase,
  };
  // persist tokenId
  await updateDoc(ref, { tokenId: ticket.tokenId });
  await incrementEventCounters(eventId, { sold: 1 });
  return ticket;
};

export const listTicketsForAddress = async (address: string): Promise<DbTicket[]> => {
  const q = query(ticketsCol, where("address", "==", address.toLowerCase()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DbTicket, "id">) }));
};

export const getTicket = async (ticketId: string): Promise<DbTicket | null> => {
  const ref = doc(ticketsCol, ticketId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<DbTicket, "id">) };
};

export const markTicketScannedDb = async (ticketId: string) => {
  const ref = doc(ticketsCol, ticketId);
  await updateDoc(ref, { scanned: true });
};

export const ensureTicketExists = async (
  ticketId: string,
  eventId: string,
  address: string
): Promise<DbTicket> => {
  const ref = doc(ticketsCol, ticketId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as Omit<DbTicket, "id">;
    return { id: snap.id, ...data };
  }

  const ticket: DbTicket = {
    id: ticketId,
    tokenId: ticketId,
    eventId,
    address: address.toLowerCase(),
    purchasedAt: Date.now(),
    scanned: false,
  };
  await setDoc(ref, ticket);
  await incrementEventCounters(eventId, { sold: 1 });
  return ticket;
};

