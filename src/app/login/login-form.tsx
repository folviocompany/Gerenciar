'use client';
import { useActionState, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { login } from './actions';
import { Button } from '@/components/ui/button';
export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, { error: '' });
  const [visible, setVisible] = useState(false);
  return <form action={action} className="login-form">
    <div className="field"><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="username" placeholder="Seu e-mail profissional" required maxLength={254} disabled={!configured || pending} /></div>
    <div className="field"><label htmlFor="password">Senha</label><div className="password-field"><input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" required maxLength={256} disabled={!configured || pending} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
    {state.error && <p role="alert" className="alert error">{state.error}</p>}
    {!configured && <p className="alert">Seu espaço está sendo preparado. O acesso estará disponível assim que a configuração inicial for concluída.</p>}
    <Button type="submit" disabled={!configured || pending}>{pending ? <><LoaderCircle size={18} className="spin" /> Entrando…</> : <>Entrar no meu espaço <ArrowRight size={18} /></>}</Button>
  </form>;
}
