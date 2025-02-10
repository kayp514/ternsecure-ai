import { redirect } from 'next/navigation';
import { auth } from '@tern-secure/nextjs/server';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/sign-in');
  }

  redirect('/chat');
} 