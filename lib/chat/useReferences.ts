import { useState, useMemo } from 'react';
import { ExtendedMessage } from './useStreamingChat';

export function useReferences(messages: ExtendedMessage[]) {
  const [isOpen, setIsOpen] = useState(false);

  // Extract recent references from the latest model message
  const currentMetadata = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'model' && messages[i].metadata) {
        return messages[i].metadata;
      }
    }
    return null;
  }, [messages]);

  const hasReferences = currentMetadata?.textChunks?.length || currentMetadata?.pyqs?.length;

  return {
    isOpen,
    setIsOpen,
    hasReferences,
    metadata: currentMetadata
  };
}
