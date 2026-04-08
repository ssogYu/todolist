type GroupEvent = {
  type: "group-sync";
  groupId: string;
  triggeredAt: string;
};

type Subscriber = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();

declare global {
  var todoSseChannels: Map<string, Set<Subscriber>> | undefined;
}

function getChannels() {
  if (!globalThis.todoSseChannels) {
    globalThis.todoSseChannels = new Map<string, Set<Subscriber>>();
  }

  return globalThis.todoSseChannels;
}

function serializeEvent(event: GroupEvent) {
  return encoder.encode(`event: sync\ndata: ${JSON.stringify(event)}\n\n`);
}

export function subscribeToGroup(
  groupId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  const channels = getChannels();
  const subscribers = channels.get(groupId) ?? new Set<Subscriber>();
  const subscriber = {
    id: crypto.randomUUID(),
    controller,
  };

  subscribers.add(subscriber);
  channels.set(groupId, subscribers);

  return () => {
    const currentSubscribers = channels.get(groupId);

    if (!currentSubscribers) {
      return;
    }

    for (const item of currentSubscribers) {
      if (item.id === subscriber.id) {
        currentSubscribers.delete(item);
      }
    }

    if (currentSubscribers.size === 0) {
      channels.delete(groupId);
    }
  };
}

export function sendGroupSync(groupId: string) {
  const subscribers = getChannels().get(groupId);

  if (!subscribers?.size) {
    return;
  }

  const payload = serializeEvent({
    type: "group-sync",
    groupId,
    triggeredAt: new Date().toISOString(),
  });

  for (const subscriber of subscribers) {
    subscriber.controller.enqueue(payload);
  }
}
