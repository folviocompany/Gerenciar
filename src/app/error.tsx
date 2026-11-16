'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="message-page"><h1>Não foi possível carregar este espaço.</h1><p>Tente novamente em instantes.</p><Button onClick={reset}>Tentar novamente</Button></main>; }
