import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Root page — redireciona com base no estado do sistema.
 * O middleware cuida da proteção; aqui apenas encaminhamos.
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token');

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
