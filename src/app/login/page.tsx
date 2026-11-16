import { Flower2, LockKeyhole, Sparkles } from 'lucide-react';
import { LoginForm } from './login-form';
import { getSupabaseConfig } from '@/lib/supabase/config';
export const dynamic = 'force-dynamic';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return <main className="login-page"><section className="brand-panel" aria-label="rocheclinic">
    <a href="/" className="brand"><Flower2 strokeWidth={1.2} size={35} /><span>rocheclinic<span className="brand-caption">GESTÃO & CUIDADO</span></span></a>
    <div className="brand-story"><span className="eyebrow"><span /> SEU ESPAÇO DE GESTÃO</span><h1>Mais leveza <br />para gerir.<br /><em>Mais tempo <br />para cuidar.</em></h1><p>O cuidado começa nos detalhes.<br />A organização da sua clínica também.</p><div className="brand-rule" /><span className="brand-note"><Sparkles size={17} /> Feito para a rotina de quem cuida.</span></div>
    <span className="brand-footer">ESTÉTICA · BELEZA · BEM-ESTAR</span><div className="petal petal-one" /><div className="petal petal-two" />
  </section><section className="login-panel"><div className="login-card"><span className="overline">BEM-VINDA À ROCHECLINIC</span><h2>Seu dia, em harmonia.</h2><p className="muted intro">Entre para acessar seu espaço e organizar<br className="desktop-break" /> a rotina da clínica.</p>{notice === 'access' && <p role="alert" className="alert error">Seu acesso ainda não está habilitado. Fale com a administração.</p>}<LoginForm configured={!!getSupabaseConfig()} /><div className="login-help">Precisa de ajuda com o acesso?<br /><span>Entre em contato com a administração da clínica.</span></div></div><p className="private-note"><LockKeyhole size={14} /> Acesso exclusivo às profissionais autorizadas</p></section></main>;
}
