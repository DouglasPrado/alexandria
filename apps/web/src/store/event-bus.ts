import { create } from "zustand";

type EventMap = {
  "upload:complete": { fileId: string };
  "node:status-changed": { nodeId: string; status: string };
};

type Handler<T> = (payload: T) => void;

interface EventBusState {
  listeners: Map<string, Set<Handler<unknown>>>;
  subscribe: <K extends keyof EventMap>(
    event: K,
    handler: Handler<EventMap[K]>,
  ) => () => void;
  emit: <K extends keyof EventMap>(event: K, payload: EventMap[K]) => void;
}

export const useEventBus = create<EventBusState>()((set, get) => ({
  listeners: new Map(),

  subscribe: (event, handler) => {
    const { listeners } = get();
    if (!listeners.has(event as string)) {
      listeners.set(event as string, new Set());
    }
    listeners.get(event as string)!.add(handler as Handler<unknown>);

    return () => {
      listeners.get(event as string)?.delete(handler as Handler<unknown>);
    };
  },

  emit: (event, payload) => {
    const { listeners } = get();
    listeners.get(event as string)?.forEach((handler) => handler(payload));
  },
}));
