//import 'server-only';
import { prisma } from '../prisma';
import { BlockKind } from '@/components/block';
import type { Message, Suggestion } from '@prisma/client';
import type { DatabaseUserInput } from './types';


export async function getUser(email: string) {
  try {
    return await prisma.user.findMany({
      where: { email },
    });
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(data: DatabaseUserInput | null) {
  if (!data) {
    console.error("user: Input is null in createUser");
    throw new Error("User input data is required")
  }

  try {
    const sanitizedData = {
      id: data.id,
      email: data.email.toLowerCase(),
      avatar: data.avatar,
      emailVerified: data.emailVerified,
      createdAt: data.createdAt,
      lastSignInAt: data.lastSignInAt,
      updatedAt: new Date(),
      disabled: false,
    }
   const user =  await prisma.user.create({
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        lastSignInAt: true,
        updatedAt: true,
        disabled: true,
      }
    });

    if (!user) {
      throw new Error("Failed to create user: No user returned from database")
    }
    return user;
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    console.log('saveChat - Attempting to save chat with:', { id, userId, title });
    
    if (!id || !userId || !title) {
      console.error('saveChat - Missing required fields:', { id, userId, title });
      throw new Error('Missing required fields for chat creation');
    }

    const result = await await prisma.chat.create({
      data: {
        id,
        createdAt: new Date(),
        userId,
        title,
        visibility: 'private'
      },
    });
    console.log('saveChat - Successfully created chat:', result);
    return result;
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    // Using transaction to ensure all related records are deleted
    return await prisma.$transaction(async (tx) => {
      await tx.vote.deleteMany({ where: { chatId: id } });
      await tx.message.deleteMany({ where: { chatId: id } });
      return tx.chat.delete({ where: { id } });
    });
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await prisma.chat.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await prisma.chat.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await prisma.message.createMany({
      data: messages,
    });
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const existingVote = await prisma.vote.findFirst({
      where: { messageId },
    });

    if (existingVote) {
      return await prisma.vote.update({
        where: {
          chatId_messageId: {
            chatId,
            messageId,
          },
        },
        data: { isUpvoted: type === 'up' },
      });
    }

    return await prisma.vote.create({
      data: {
        chatId,
        messageId,
        isUpvoted: type === 'up',
      },
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await prisma.vote.findMany({
      where: { chatId: id },
    });
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await prisma.document.create({
      data: {
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await prisma.document.findMany({
      where: { id },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    return await prisma.document.findFirst({
      where: { id },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.suggestion.deleteMany({
        where: {
          documentId: id,
          documentCreatedAt: { gt: timestamp },
        },
      });

      return await tx.document.deleteMany({
        where: {
          id,
          createdAt: { gt: timestamp },
        },
      });
    });
  } catch (error) {
    console.error('Failed to delete documents by id after timestamp from database');
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await prisma.suggestion.createMany({
      data: suggestions,
    });
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await prisma.suggestion.findMany({
      where: { documentId },
    });
  } catch (error) {
    console.error('Failed to get suggestions by document version from database');
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await prisma.message.findMany({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await prisma.message.findMany({
      where: {
        chatId,
        createdAt: { gte: timestamp },
      },
      select: { id: true },
    });

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      return await prisma.$transaction(async (tx) => {
        await tx.vote.deleteMany({
          where: {
            chatId,
            messageId: { in: messageIds },
          },
        });

        return await tx.message.deleteMany({
          where: {
            chatId,
            id: { in: messageIds },
          },
        });
      });
    }
  } catch (error) {
    console.error('Failed to delete messages by id after timestamp from database');
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { visibility },
    });
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
