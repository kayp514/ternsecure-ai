import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@tern-secure/nextjs/server';
import { myProvider } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';

export const runtime = 'nodejs';

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.uid) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    console.log('Creating new chat with params:', {
      message: userMessage,
      id,
      userId: session.user.uid
    });
    const title = await generateTitleFromUserMessage({ message: userMessage });
    console.log('Generated title:', title);
    if (!title || !id || !session.user.uid) {
      console.error('Missing required data:', { title, id, userId: session.user.uid });
      return new Response('Missing required data for chat creation', { status: 400 });
    }

  try {
    await saveChat({ id, userId: session.user.uid, title });
  } catch (error) {
    console.error('Chat creation failed:', error);
    return new Response(JSON.stringify({ error: 'Failed to create chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

try {
  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });
} catch (error) {
  console.error('Message save failed:', error);
  return new Response(JSON.stringify({ error: 'Failed to save message' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === 'chat-model-reasoning'
            ? []
            : [
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
              ],
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
        },
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.uid) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });
              console.log('chat api: Sanitized response messages:', sanitizedResponseMessages);
              

              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    //content: message.content,
                    content: JSON.parse(JSON.stringify(message.content)), 
                    createdAt: new Date(),
                  };
                }),
              });
            } catch (error) {
              console.error('Save operation failed:', error);
              console.error('Failed to save chat');
              throw error;
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: () => {
      return 'Oops, an error occured!';
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat?.userId !== session.user.uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
