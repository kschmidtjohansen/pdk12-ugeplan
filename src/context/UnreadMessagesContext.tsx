import React, { createContext, useContext } from 'react';
import { useUnreadMessages, UnreadMessagesState } from '@/hooks/useUnreadMessages';

const defaultState: UnreadMessagesState = {
  unreadByAssignment: {},
  totalUnread: 0,
  hasUnread: () => false,
  unreadFor: () => 0,
  markRead: () => {},
  refresh: async () => {},
};

const UnreadMessagesContext = createContext<UnreadMessagesState>(defaultState);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useUnreadMessages();
  return <UnreadMessagesContext.Provider value={state}>{children}</UnreadMessagesContext.Provider>;
};

export const useUnreadMessagesContext = (): UnreadMessagesState => useContext(UnreadMessagesContext);
