import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'zh' | 'ja' | 'ru' | 'ar';

export const LANGUAGES: { code: Language; name: string; flag: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'zh', name: '简体中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

const translations = {
  en: {
    nav: { home: 'Home', plans: 'Plans', bounty: 'Bounty', stats: 'Live Payouts', faq: 'Help', contact: 'Support', dashboard: 'My Earnings', logout: 'Log Out', signin: 'Log In', getstarted: 'Start Earning' },
    hero: {
      title_start: 'Automated',
      title_end: 'Cloud Mining',
      subtitle: 'Earn daily passive income from cryptocurrency. No hardware required. Returns credited automatically every 24 hours.',
      cta_start: 'Start Mining Now',
      cta_plans: 'Calculate Profit',
      total_invested: 'Total Deposited',
      active_users: 'Happy Investors',
      uptime: 'Guaranteed Uptime'
    },
    home: {
      trust_text: 'Secure payments supported by',
      why_us: 'Why Investors Choose MineFlow',
      why_subtitle: 'We make crypto mining accessible, secure, and profitable for everyone.',
      feature_1: 'Instant Withdrawals',
      feature_1_desc: 'Get your money when you need it. Automated processing 24/7.',
      feature_2: 'Bank-Grade Security',
      feature_2_desc: 'Your funds are protected by SSL encryption and cold storage.',
      feature_3: 'Daily Returns',
      feature_3_desc: 'See profits in your account every single day like clockwork.',
      how_works: 'Start in 3 Minutes',
      how_subtitle: 'No technical skills needed. Just create an account and watch it grow.',
      step_1: 'Register Account',
      step_1_desc: 'Sign up instantly with just your email.',
      step_2: 'Select Plan',
      step_2_desc: 'Choose an earning rate that fits your budget.',
      step_3: 'Receive Profit',
      step_3_desc: 'Withdraw your earnings to your wallet instantly.',
      plans_title: 'Choose Your Earning Path',
      plans_subtitle: 'Simple plans with guaranteed daily returns.',
      faq_title: 'Common Questions',
      faq_subtitle: 'Everything you need to know to get started'
    },
    plans: { title: 'Investment Plans', subtitle: 'High-yield cloud mining solutions tailored for your growth.', popular: 'Most Popular', total_return: 'Total Return', daily_profit: 'Daily Profit', duration: 'Duration', min_deposit: 'Min Deposit', max_deposit: 'Max Deposit', withdrawal: 'Withdrawal', days: 'Days', instant: 'Instant', start_earning: 'Start Earning' },
    bounty: { title: 'Bounty Program', subtitle: 'Complete simple tasks and earn free crypto rewards.', reward: 'REWARD', submit: 'Submit Proof', placeholder: 'Link to your content', send: 'Submit for Review' },
    stats: { title: 'Live Platform Data', subtitle: 'Transparent real-time transactions from our community.', last_payouts: 'Recent Withdrawals', live: 'Live Feed', user: 'Investor', amount: 'Amount', time: 'Time', top_deposits: 'Top Deposits', top_partners: 'Top Referrers', referrals: 'Referrals' },
    auth: { welcome: 'Welcome Back', create: 'Create Free Account', signin_desc: 'Access your mining dashboard', signup_desc: 'Join 5,000+ investors earning daily', name: 'Full Name', email: 'Email Address', password: 'Password', forgot: 'Forgot Password?', signin_btn: 'Access Dashboard', create_btn: 'Start Earning', continue: 'Or continue with' },
    contact: { title: 'Support Center', subtitle: 'Need help? Our team is available 24/7 to assist you.', email: 'Email Support', phone: 'Phone', address: 'Address', message: 'How can we help?', send_btn: 'Send Message' },
    dashboard: { welcome: 'Overview', last_login: 'Last active', deposit_bal: 'Wallet Balance', earning_bal: 'Withdrawable Profit', deposit: 'Add Funds', withdraw: 'Withdraw', reinvest: 'Reinvest', transfer: 'Transfer', active_plans: 'Active Miners', total_earnings: 'Total Profit', my_ref: 'Referral Link', referral_note: 'Note: Referrals are validated within 24 hours.', copy: 'Copy', view_investments: 'My Miners', available_plans: 'Buy New Miner', recent_tx: 'Transaction History', no_tx: 'No recent activity' },
    deposit: { txid_used: 'This Transaction ID has already been used.', invalid_amount: 'Invalid amount.', min_amount: 'Minimum deposit is 10 USD.', txid_required: 'Transaction ID is required.' },
    footer: { quick_links: 'Quick Links', legal: 'Legal', newsletter: 'Newsletter', subscribe_desc: 'Get the latest mining news.', subscribe: 'Subscribe', rights: 'All rights reserved.', telegram: 'Join Community' }
  },
  // Keeping other languages as is for brevity in this specific update, 
  // but logically they should be updated to match the tone of English in a full production roll-out.
  es: {
    nav: { home: 'Inicio', plans: 'Planes', bounty: 'Recompensas', stats: 'Pagos en Vivo', faq: 'Ayuda', contact: 'Soporte', dashboard: 'Panel', logout: 'Salir', signin: 'Entrar', getstarted: 'Empezar' },
    hero: { title_start: 'Minería', title_end: 'Automática', subtitle: 'Gane ingresos pasivos diarios con criptomonedas. Sin hardware. Retornos acreditados cada 24 horas.', cta_start: 'Empezar Ahora', cta_plans: 'Ver Ganancias', total_invested: 'Total Depositado', active_users: 'Inversores Felices', uptime: 'Tiempo Activo' },
    home: { trust_text: 'Pagos seguros soportados por', why_us: 'Por qué elegir MineFlow', why_subtitle: 'Hacemos la minería accesible y segura.', feature_1: 'Retiros Instantáneos', feature_1_desc: 'Su dinero cuando lo necesite.', feature_2: 'Seguridad Bancaria', feature_2_desc: 'Protección SSL y almacenamiento en frío.', feature_3: 'Retornos Diarios', feature_3_desc: 'Beneficios en su cuenta cada día.', how_works: 'Empiece en 3 Minutos', how_subtitle: 'Sin habilidades técnicas requeridas.', step_1: 'Crear Cuenta', step_1_desc: 'Regístrese con su correo.', step_2: 'Elegir Plan', step_2_desc: 'Elija su tasa de ganancia.', step_3: 'Recibir Ganancias', step_3_desc: 'Retire a su billetera al instante.', plans_title: 'Elija su Ruta', plans_subtitle: 'Planes simples con retornos garantizados.', faq_title: 'Preguntas Comunes', faq_subtitle: 'Todo lo que necesita saber' },
    plans: { title: 'Planes de Inversión', subtitle: 'Soluciones de alto rendimiento.', popular: 'Mejor Valor', total_return: 'Retorno Total', daily_profit: 'Beneficio Diario', duration: 'Contrato', min_deposit: 'Depósito Min', max_deposit: 'Depósito Max', withdrawal: 'Retiro', days: 'Días', instant: 'Instantáneo', start_earning: 'Empezar a Ganar' },
    bounty: { title: 'Programa de Recompensas', subtitle: 'Complete tareas y gane cripto gratis.', reward: 'RECOMPENSA', submit: 'Enviar Prueba', placeholder: 'Enlace', send: 'Enviar' },
    stats: { title: 'Datos en Vivo', subtitle: 'Transacciones transparentes.', last_payouts: 'Retiros Recientes', live: 'En Vivo', user: 'Inversor', amount: 'Monto', time: 'Hora', top_deposits: 'Top Depósitos', top_partners: 'Top Socios', referrals: 'Referidos' },
    auth: { welcome: 'Bienvenido', create: 'Cuenta Gratuita', signin_desc: 'Acceda a su panel', signup_desc: 'Únase a 5,000+ inversores', name: 'Nombre', email: 'Correo', password: 'Contraseña', forgot: '¿Olvidó contraseña?', signin_btn: 'Acceder', create_btn: 'Empezar', continue: 'O continúe con' },
    contact: { title: 'Centro de Soporte', subtitle: '¿Necesita ayuda? Estamos aquí 24/7.', email: 'Correo', phone: 'Teléfono', address: 'Dirección', message: 'Mensaje', send_btn: 'Enviar' },
    dashboard: { welcome: 'Resumen', last_login: 'Activo', deposit_bal: 'Balance Billetera', earning_bal: 'Ganancia Retirable', deposit: 'Añadir Fondos', withdraw: 'Retirar', reinvest: 'Reinvertir', transfer: 'Transferir', active_plans: 'Mineros Activos', total_earnings: 'Ganancia Total', my_ref: 'Enlace Referido', referral_note: 'Nota: Los referidos se validan en 24 horas.', copy: 'Copiar', view_investments: 'Mis Mineros', available_plans: 'Novo Minerador', recent_tx: 'Histórico', no_tx: 'Sin actividad reciente' },
    footer: { quick_links: 'Menú', legal: 'Legal', newsletter: 'Actualizaciones', subscribe_desc: 'Reciba noticias.', subscribe: 'Unirse', rights: 'Derechos reservados.', telegram: 'Comunidad' }
  },
  pt: {
    nav: { home: 'Início', plans: 'Planos', bounty: 'Bounty', stats: 'Ao Vivo', faq: 'Ajuda', contact: 'Suporte', dashboard: 'Minha Conta', logout: 'Sair', signin: 'Entrar', getstarted: 'Começar' },
    hero: { title_start: 'Mineração', title_end: 'Automática', subtitle: 'Ganhe renda passiva diária com cripto. Sem hardware. Retornos creditados a cada 24 horas.', cta_start: 'Começar Agora', cta_plans: 'Ver Ganhos', total_invested: 'Total Depositado', active_users: 'Investidores Felizes', uptime: 'Uptime Garantido' },
    home: { trust_text: 'Pagamentos seguros via', why_us: 'Por que escolher a MineFlow', why_subtitle: 'Tornamos a mineração acessível e segura.', feature_1: 'Saques Instantâneos', feature_1_desc: 'Receba seu dinheiro na hora.', feature_2: 'Segurança Bancária', feature_2_desc: 'Proteção SSL e armazenamento frio.', feature_3: 'Retornos Diários', feature_3_desc: 'Lucros na sua conta todo dia.', how_works: 'Comece em 3 Minutos', how_subtitle: 'Sem habilidades técnicas necessárias.', step_1: 'Criar Conta', step_1_desc: 'Cadastre-se com seu e-mail.', step_2: 'Escolher Plano', step_2_desc: 'Escolha quanto quer ganhar.', step_3: 'Receber Lucro', step_3_desc: 'Saque para sua carteira instantaneamente.', plans_title: 'Escolha Seu Caminho', plans_subtitle: 'Planos simples com retorno garantido.', faq_title: 'Perguntas Comuns', faq_subtitle: 'Tudo o que você precisa saber' },
    plans: { title: 'Planos de Investimento', subtitle: 'Soluções de alto rendimento.', popular: 'Melhor Valor', total_return: 'Retorno Total', daily_profit: 'Lucro Diário', duration: 'Contrato', min_deposit: 'Depósito Mín', max_deposit: 'Depósito Máx', withdrawal: 'Saque', days: 'Dias', instant: 'Instantâneo', start_earning: 'Começar a Ganhar' },
    bounty: { title: 'Programa Bounty', subtitle: 'Complete tarefas e ganhe cripto grátis.', reward: 'RECOMPENSA', submit: 'Enviar Prova', placeholder: 'Link', send: 'Enviar' },
    stats: { title: 'Dados em Tempo Real', subtitle: 'Transações transparentes.', last_payouts: 'Saques Recentes', live: 'Feed Ao Vivo', user: 'Investidor', amount: 'Valor', time: 'Hora', top_deposits: 'Top Depósitos', top_partners: 'Top Parceiros', referrals: 'Referências' },
    auth: { welcome: 'Bem-vindo', create: 'Conta Grátis', signin_desc: 'Acesse seu painel', signup_desc: 'Junte-se a 5.000+ investidores', name: 'Nome', email: 'E-mail', password: 'Senha', forgot: 'Esqueceu?', signin_btn: 'Acessar', create_btn: 'Começar', continue: 'Ou continue com' },
    contact: { title: 'Central de Suporte', subtitle: 'Precisa de ajuda? Estamos aqui 24/7.', email: 'E-mail', phone: 'Telefone', address: 'Endereço', message: 'Mensagem', send_btn: 'Enviar' },
    dashboard: { welcome: 'Resumo', last_login: 'Ativo', deposit_bal: 'Saldo Carteira', earning_bal: 'Lucro Disponível', deposit: 'Adicionar Fundos', withdraw: 'Sacar', reinvest: 'Reinvestir', transfer: 'Transferir', active_plans: 'Mineradores Activos', total_earnings: 'Lucro Total', my_ref: 'Link de Indicação', referral_note: 'Nota: Os referidos são validados dentro de 24 horas.', copy: 'Copiar', view_investments: 'Meus Mineradores', available_plans: 'Novo Minerador', recent_tx: 'Histórico', no_tx: 'Sem atividade recente' },
    deposit: { txid_used: 'Este TXID já foi usado.', invalid_amount: 'Valor inválido.', min_amount: 'O depósito mínimo é de 10 USD.', txid_required: 'O TXID é obrigatório.' },
    footer: { quick_links: 'Menu', legal: 'Legal', newsletter: 'Atualizações', subscribe_desc: 'Receba novidades.', subscribe: 'Entrar', rights: 'Direitos reservados.', telegram: 'Comunidade' }
  },
  // Placeholders for other languages to prevent errors, utilizing English as fallback structure
  fr: { nav: { home: 'Accueil' }, hero: { title_start: 'Minage' } },
  de: { nav: { home: 'Start' }, hero: { title_start: 'Mining' } },
  zh: { nav: { home: '首页' }, hero: { title_start: '挖矿' } },
  ja: { nav: { home: 'ホーム' }, hero: { title_start: 'マイニング' } },
  ru: { nav: { home: 'Главная' }, hero: { title_start: 'Майнинг' } },
  ar: { nav: { home: 'الرئيسية' }, hero: { title_start: 'تعدين' } },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && LANGUAGES.find(l => l.code === savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.dir = currentLangObj.dir;
    document.documentElement.lang = language;
  }, [currentLangObj, language]);

  const t = (path: string) => {
    const keys = path.split('.');

    // First try current language
    let value: any = translations[language];
    let found = true;
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        found = false;
        break;
      }
    }
    if (found) return value;

    // Fallback to English
    value = translations['en'];
    for (const key of keys) {
      if (value && value[key]) {
        value = value[key];
      } else {
        return path; // Return key if not found in EN either
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: currentLangObj.dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};