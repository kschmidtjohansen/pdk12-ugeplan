type Listener<TPayload> = (payload: TPayload) => void;

interface Registration<TPayload> {
  id: number;
  callback: Listener<TPayload>;
}

export class RealtimeChannelRegistry<TPayload = unknown> {
  private readonly channelListeners = new Map<string, Map<string, Registration<TPayload>>>();
  private readonly keyIndex = new Map<string, { channelKey: string; registrationId: number }>();
  private nextRegistrationId = 1;

  add(channelKey: string, key: string, callback: Listener<TPayload>): number {
    this.remove(key);

    const registrationId = this.nextRegistrationId++;
    const listeners = this.channelListeners.get(channelKey) ?? new Map<string, Registration<TPayload>>();
    listeners.set(key, { id: registrationId, callback });
    this.channelListeners.set(channelKey, listeners);
    this.keyIndex.set(key, { channelKey, registrationId });
    return registrationId;
  }

  remove(key: string, expectedRegistrationId?: number): { channelKey: string; isEmpty: boolean } | null {
    const indexed = this.keyIndex.get(key);
    if (!indexed) return null;
    if (expectedRegistrationId !== undefined && indexed.registrationId !== expectedRegistrationId) return null;

    this.keyIndex.delete(key);
    const listeners = this.channelListeners.get(indexed.channelKey);
    const registration = listeners?.get(key);
    if (listeners && registration?.id === indexed.registrationId) listeners.delete(key);

    const isEmpty = !listeners || listeners.size === 0;
    if (isEmpty) this.channelListeners.delete(indexed.channelKey);
    return { channelKey: indexed.channelKey, isEmpty };
  }

  emit(channelKey: string, payload: TPayload): void {
    this.channelListeners.get(channelKey)?.forEach(({ callback }) => callback(payload));
  }

  listenerCount(channelKey: string): number {
    return this.channelListeners.get(channelKey)?.size ?? 0;
  }
}