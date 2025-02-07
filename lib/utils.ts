import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  TextStreamPart,
  ToolInvocation,
  ToolSet,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@prisma/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

function isToolContent(content: any): content is Array<{
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: string;
}> {
  return Array.isArray(content) && content.every(item => 
    item.type === 'tool-result' &&
    typeof item.toolCallId === 'string' &&
    typeof item.toolName === 'string' &&
    typeof item.result === 'string'
  );
}

interface TextContent {
  type: 'text';
  text: string;
}

interface ToolCallContent {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface ReasoningContent {
  type: 'reasoning';
  reasoning: string;
}

function isTextContent(content: unknown): content is TextContent {
  return typeof content === 'object' 
    && content !== null 
    && 'type' in content 
    && (content as any).type === 'text' 
    && 'text' in content 
    && typeof (content as any).text === 'string';
}

function isToolCallContent(content: unknown): content is ToolCallContent {
  return typeof content === 'object' 
    && content !== null 
    && 'type' in content 
    && (content as any).type === 'tool-call'
    && 'toolCallId' in content 
    && 'toolName' in content 
    && 'args' in content;
}

function isReasoningContent(content: unknown): content is ReasoningContent {
  return typeof content === 'object' 
    && content !== null 
    && 'type' in content 
    && (content as any).type === 'reasoning'
    && 'reasoning' in content 
    && typeof (content as any).reasoning === 'string';
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if (message.role === 'tool') {
      if (!isToolContent(message.content)) {
        console.warn('Invalid tool message content structure:', message);
        return chatMessages;
      }

      return addToolMessageToChat({
        toolMessage: {
          id: message.id,
          role: 'tool',
          content: message.content
        } as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = '';
    let reasoning: string | undefined = undefined;
    const toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const item of message.content) {
        if (isTextContent(item)) {
          textContent += item.text;
        } else if (isToolCallContent(item)) {
          toolInvocations.push({
            state: 'call',
            toolCallId: item.toolCallId,
            toolName: item.toolName,
            args: item.args,
          });
        } else if (isReasoningContent(item)) {
          reasoning = item.reasoning;
        }
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      reasoning,
      toolInvocations,
    });

    return chatMessages;
  }, []);
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}