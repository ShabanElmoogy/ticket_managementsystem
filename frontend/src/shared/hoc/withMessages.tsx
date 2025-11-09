import React from "react";

export interface MessagesConfig {
  success: {
    created: string;
    updated: string;
    deleted: string;
  };
  error: {
    create: string;
    update: string;
    delete: string;
  };
  titles: {
    create: string;
    edit: string;
  };
}

export interface MessagesProps {
  messages: MessagesConfig;
}

export function withMessages<P extends object = Record<string, never>>(
  Component: React.ComponentType<P & MessagesProps>,
  messages: MessagesConfig
) {
  const MessagesWrapper = (props: P) => {
    return <Component {...props} messages={messages} />;
  };

  MessagesWrapper.displayName = `withMessages(${Component.displayName || Component.name})`;
  return MessagesWrapper;
}

export default withMessages;