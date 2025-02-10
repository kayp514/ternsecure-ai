'use server';

import { generateText, type Message } from 'ai';
import { cookies } from 'next/headers';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  createUser,
  getUser
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/models';
import type { DatabaseUserInput, FirebaseAuthUser, SignUpResult } from '@/lib/db/types';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('chat-model-small'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function createDatabaseUser(firebaseUser: FirebaseAuthUser): Promise<SignUpResult> {
  console.log("1. createDatabaseUser received:", JSON.stringify(firebaseUser, null, 2))

if (!firebaseUser || typeof firebaseUser !== "object") {
  console.error("2. Invalid input:", firebaseUser)
  return {
    success: false,
    error: {
      code: "INVALID_INPUT",
      message: "Invalid or missing Firebase user data",
    },
  }
}

try {
  const userInput: DatabaseUserInput = {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    avatar: firebaseUser.photoURL ?? null,
    emailVerified: firebaseUser.emailVerified ?? false,
    createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
    lastSignInAt: firebaseUser.metadata.lastSignInTime 
      ? new Date(firebaseUser.metadata.lastSignInTime)
      : new Date(),
  }
  console.log("3. Transformed to DatabaseUserInput:", JSON.stringify(userInput, null, 2))

  const user = await createUser(userInput)
   console.log("4. Database user created:", JSON.stringify(user, null, 2))

  if (!user) {
      throw new Error("No user returned from database creation")
    }

  return {
    success: true,
    user: {
      uid: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  }
} catch (error) {
  console.error("5. Error in createDatabaseUser:", error)
  return {
    success: false,
    error: {
      code: "DB_ERROR",
      message: error instanceof Error ? error.message : "Failed to create user in database",
    },
  }
}
}

export async function verifyDatabaseUser(id: string): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string | null;
    emailVerified: boolean | null;
  }
  error?: {
    code: string;
    message: string;}
}> {
  try {
    console.log("1. Verifying user in database, id:", id)

    const res = await getUser(id);
    console.log("2. Database response:", res)

    if(!res.success || !res.user) {
      console.log("3. User not found in database")
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
      };
    }

    console.log("4. User found in database")
    return {
      success: true,
      user: {
        id: res.user?.id ?? '',
        email: res.user?.email || null,
        emailVerified: res.user?.emailVerified || null,
      },
    };
  } catch (error) {
    console.error('Error in verifyDatabaseUser:', error);
    return {
      success: false,
      error: {
        code: 'DB_ERROR',
        message: error instanceof Error ? error.message : 'Failed to verify user in database',
      },
    };
  }
}


