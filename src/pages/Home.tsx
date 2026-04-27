import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Store, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, MapPin, BarChart3, LineChart, ChevronDown } from 'lucide-react';
import { Footer } from '../components/layout/Footer';

const CheeseIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15.25 3a1.17 1.17 0 0 0-1.25 1.17c0 1.65-1.35 3-3 3A3 3 0 0 1 8 4.17 1.17 1.17 0 0 0 6.75 3 4.75 4.75 0 0 0 2 7.75v8.5A4.75 4.75 0 0 0 6.75 21h10.5A4.75 4.75 0 0 0 22 16.25v-8.5A4.75 4.75 0 0 0 17.25 3h-2Z" />
    <circle cx="16" cy="14" r="2" />
    <circle cx="9" cy="15" r="1.5" />
    <circle cx="12" cy="9" r="1" />
  </svg>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-2 border-[#d36101] rounded-[20px] overflow-hidden bg-[#2b1400]/40 hover:bg-[#2b1400]/60 transition-colors mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-white group"
      >
        <span className="text-lg pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-app-accent transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-white/90 leading-relaxed font-medium">
          {answer}
        </p>
      </div>
    </div>
  );
};

const faqsProdutor = [
  {
    question: "Quanto custa para me cadastrar?",
    answer: "O cadastro no Banco do Queijo é totalmente gratuito. Não cobramos mensalidade para você expor seus produtos na nossa vitrine."
  },
  {
    question: "Como os atacadistas entram em contato comigo?",
    answer: "Os atacadistas interessados nos seus queijos iniciam uma conversa direta com você pelo WhatsApp, clicando em um botão no seu perfil."
  },
  {
    question: "Preciso ter CNPJ para vender?",
    answer: "O CNPJ ou CPF é importante para garantir a segurança das negociações. Recomendamos que você mantenha seu cadastro completo e com as certificações em dia."
  },
  {
    question: "Como o preço é definido na vitrine?",
    answer: "O Banco do Queijo apresenta as cotações atuais do mercado (índices), mas a negociação e o valor final de cada quilo de queijo são definidos diretamente entre você e o comprador."
  }
];

const faqsAtacadista = [
  {
    question: "A plataforma cobra comissão sobre as compras?",
    answer: "Não. O Banco do Queijo conecta você diretamente ao produtor, sem intermediários e sem cobrança de comissões sobre os negócios fechados."
  },
  {
    question: "Como garanto a qualidade e procedência dos queijos?",
    answer: "Incentivamos todos os produtores a publicarem selos, prêmios e fotos detalhadas de sua produção e instalações, ajudando você a garantir a qualidade de quem está comprando."
  },
  {
    question: "O pagamento é feito pelo site?",
    answer: "Não. A negociação, a forma de pagamento e as condições (incluindo o frete) são combinadas entre você e o produtor de queijo diretamente pelo WhatsApp."
  },
  {
    question: "Posso encontrar produtores da minha região?",
    answer: "Sim. A plataforma possibilita contato com produtores de todo o País. O Produtor informa seu Estado e Cidade, assim você pode priorizar a compra da maneira que melhor lhe atender."
  }
];

const FaqSection = () => {
  const [activeTab, setActiveTab] = useState<'produtor' | 'atacadista'>('produtor');
  
  return (
    <section className="w-full bg-[#1A0A00] py-12 md:py-16 px-4 md:px-8 relative z-40 border-t border-[#d36101]/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Dúvidas Frequentes
          </h2>
          <p className="text-white/60 text-lg">Tudo o que você precisa saber sobre a plataforma.</p>
        </div>
        
        <div className="flex justify-center mb-10 pb-4 w-full">
          <div className="flex flex-row w-full sm:w-auto bg-[#2b1400]/80 p-1.5 rounded-[20px] border-2 border-[#d36101] shadow-inner gap-0 text-center">
            <button 
              onClick={() => setActiveTab('produtor')}
              className={`w-1/2 sm:w-auto px-2 sm:px-6 py-2.5 sm:py-3 rounded-[14px] text-[13px] sm:text-base font-bold transition-all ${activeTab === 'produtor' ? 'bg-[#d36101] text-white shadow-[0_0_15px_rgba(211,97,1,0.5)]' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
            >
              Dúvidas do Produtor
            </button>
            <button 
              onClick={() => setActiveTab('atacadista')}
              className={`w-1/2 sm:w-auto px-2 sm:px-6 py-2.5 sm:py-3 rounded-[14px] text-[13px] sm:text-base font-bold transition-all ${activeTab === 'atacadista' ? 'bg-app-accent text-[#2b1400] shadow-[0_0_15px_rgba(244,215,99,0.5)]' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
            >
              Dúvidas do Atacadista
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {(activeTab === 'produtor' ? faqsProdutor : faqsAtacadista).map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export function Home() {
  return (
    <div className="h-[100dvh] flex flex-col bg-app-bgDark text-gray-100 overflow-hidden">
      
      {/* Hero Background */}
      <div className="absolute top-0 left-0 w-full h-[100dvh] z-0 overflow-hidden pointer-events-none bg-[#2b1400]">
        <video 
          src="https://video.wixstatic.com/video/6acedd_b8aa7ae2be2f4d0fb1c8dd81ac1e15bf/720p/mp4/file.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover object-right md:object-center opacity-70" 
        />
        <div className="absolute inset-0 bg-[#3e1c00]/40"></div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-app-bgDark via-app-bgDark/90 to-transparent z-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col pt-0 relative z-30 w-full scroll-smooth">
        <header className="relative z-30 pt-6 pb-4 px-4 md:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-center md:justify-between items-center bg-transparent">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
          <div className="w-24 h-24 md:w-20 md:h-20 shrink-0 flex items-center justify-center">
            <img src="https://i.ibb.co/jvsrNzd3/Banco-do-Queijo-sem-fundo.png" alt="Banco do Queijo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-app-accent tracking-tight leading-none drop-shadow-md">Banco do Queijo</h1>
          </div>
        </div>
        <div className="hidden md:flex gap-4 items-center">
          <Link to="/login" className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-app-cardDark/90 backdrop-blur-md shadow-lg flex items-center justify-center text-white hover:bg-[#5a2800] border border-[#5a2800] transition-all active:scale-95" title="Entrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </Link>
          </div>
        </header>

        <main className="flex-1 w-full relative flex flex-col items-center justify-start pb-0">
        
        {/* Título Hero Section */}
        <section className="px-4 sm:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto mt-[2vh] md:mt-[4vh] mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-30 text-center flex flex-col items-center w-full min-h-[50vh]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-accent/20 border border-app-accent/30 text-app-accent text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg cursor-default">
             <Star className="w-3 h-3 text-app-accent" /> A Maior Plataforma de Queijos do Brasil
          </span>
          <h2 className="text-4xl md:text-[4rem] leading-[1.1] font-bold text-white tracking-tight max-w-5xl drop-shadow-2xl mb-6">
            Mais Vendas para Quem Produz, <br className="md:hidden" /> <span className="hidden md:inline"><br /></span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-accent to-yellow-200">Mais Lucro para Quem Vende.</span>
          </h2>
          <p className="text-white/90 max-w-3xl text-lg md:text-xl font-medium drop-shadow-md mb-16">
            Conectamos Produtores Artesanais a Compradores Atacadistas. Elimine Intermediários, Reduza Custos e Garanta Sempre o Melhor Queijo com Base na Cotação Atual.
          </p>

          {/* Cards de Cadastro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
            
            {/* Card Produtor */}
            <Link 
              to="/cadastro?role=PRODUTOR" 
              className="group relative overflow-hidden rounded-[2rem] bg-app-cardDark/80 backdrop-blur-md border-2 border-[#d36101]/80 p-8 text-left transition-all duration-500 hover:bg-[#703200]/95 hover:border-app-accent hover:shadow-[0_0_40px_rgba(211,97,1,0.5)] hover:-translate-y-2 flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <CheeseIcon className="w-40 h-40 text-app-accent" />
              </div>
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-16 h-16 rounded-2xl bg-[#703200] flex items-center justify-center mb-6 border-2 border-[#d36101] group-hover:bg-app-accent group-hover:border-app-accent transition-colors duration-500 shadow-lg">
                  <CheeseIcon className="w-8 h-8 text-app-accent group-hover:text-app-bgDark transition-colors duration-500" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Sou Produtor</h3>
                <p className="text-white/75 font-medium mb-8 text-lg flex-1">
                  Encontre novos clientes, negocie grandes volumes e venda sua produção de forma direta e segura para todo o Brasil.
                </p>
                <div className="flex justify-start w-full mt-auto">
                  <div className="relative inline-flex group/btn w-full sm:w-auto">
                    <div className="absolute -inset-1 bg-[#d36101] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                    <div className="relative flex w-full items-center justify-center px-8 py-4 bg-[#d36101] text-white font-bold text-lg rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
                      Quero Vender <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Atacadista */}
            <Link 
              to="/cadastro?role=ATACADISTA" 
              className="group relative overflow-hidden rounded-[2rem] bg-app-cardDark/80 backdrop-blur-md border-2 border-app-accent/80 p-8 text-left transition-all duration-500 hover:bg-[#5a4813]/95 hover:border-app-accent hover:shadow-[0_0_40px_rgba(244,215,99,0.5)] hover:-translate-y-2 flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <Store className="w-40 h-40 text-app-accent" />
              </div>
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-16 h-16 rounded-2xl bg-[#5a4813] flex items-center justify-center mb-6 border-2 border-app-accent group-hover:bg-app-accent transition-colors duration-500 shadow-lg">
                  <Store className="w-8 h-8 text-app-accent group-hover:text-app-bgDark transition-colors duration-500" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Sou Atacadista</h3>
                <p className="text-white/75 font-medium mb-8 text-lg flex-1">
                  Conecte-se com as melhores queijarias para comprar no atacado com os preços mais competitivos do mercado.
                </p>
                <div className="flex justify-start w-full mt-auto">
                  <div className="relative inline-flex group/btn w-full sm:w-auto">
                    <div className="absolute -inset-1 bg-app-accent rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                    <div className="relative flex w-full items-center justify-center px-8 py-4 bg-app-accent text-app-cardDark font-bold text-lg rounded-full transition-transform hover:scale-[1.02] active:scale-95 shadow-lg">
                      Quero Comprar <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Informational Section */}
        <section className="w-full relative z-40 bg-app-bgDark">
          
          {/* Benefícios */}
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 md:py-20">
            <div className="text-center mb-12 flex flex-col items-center">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-accent/20 border border-app-accent/30 text-app-accent text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg cursor-default">
                 <Star className="w-3 h-3 text-app-accent" /> Para Todos os Perfis
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Uma Plataforma, <span className="text-app-accent">Vantagens Reais</span>
              </h2>
              <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
                Desenvolvemos o Banco do Queijo para resolver as dores de quem produz e de quem compra.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 text-left">
              
              {/* Box Produtor */}
              <div className="bg-[#1f0e00] rounded-[2rem] border border-[#d36101]/30 p-8 md:p-10 relative overflow-hidden group hover:border-[#d36101]/60 transition-colors">
                <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CheeseIcon className="w-64 h-64 text-[#d36101]" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#d36101]/20 text-[#d36101] font-bold text-sm mb-8 border border-[#d36101]/30">
                    <CheeseIcon className="w-4 h-4" /> Vantagens para o Produtor
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#d36101]/20 flex items-center justify-center shrink-0 mt-1">
                        <TrendingUp className="w-5 h-5 text-[#d36101]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">Aumente sua Lucratividade</h4>
                        <p className="text-white/60 leading-relaxed">Elimine intermediários e venda diretamente para quem compra em volume, melhorando sua margem de lucro.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#d36101]/20 flex items-center justify-center shrink-0 mt-1">
                        <MapPin className="w-5 h-5 text-[#d36101]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">Alcance Nacional</h4>
                        <p className="text-white/60 leading-relaxed">Sua queijaria visível para atacadistas e supermercados de todos os estados do Brasil.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#d36101]/20 flex items-center justify-center shrink-0 mt-1">
                        <BarChart3 className="w-5 h-5 text-[#d36101]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">Preço Justo (Cotação)</h4>
                        <p className="text-white/60 leading-relaxed">Acompanhe a precificação real do mercado para valorizar a qualidade da sua produção.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box Atacadista */}
              <div className="bg-app-accent rounded-[2rem] border border-app-accent p-8 md:p-10 relative overflow-hidden group hover:shadow-lg transition-all">
                <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Store className="w-64 h-64 text-[#2b1400]" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#2b1400]/10 text-[#2b1400] font-bold text-sm mb-8 border border-[#2b1400]/20">
                    <Store className="w-4 h-4" /> Vantagens para o Atacadista
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#2b1400]/10 flex items-center justify-center shrink-0 mt-1">
                        <LineChart className="w-5 h-5 text-[#2b1400]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-[#2b1400] mb-1">Custo Reduzido</h4>
                        <p className="text-[#2b1400]/80 leading-relaxed font-medium">Negocie direto com a fonte produtora e garanta as melhores condições e preços para o seu negócio.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#2b1400]/10 flex items-center justify-center shrink-0 mt-1">
                        <ShieldCheck className="w-5 h-5 text-[#2b1400]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-[#2b1400] mb-1">Qualidade e Variedade</h4>
                        <p className="text-[#2b1400]/80 leading-relaxed font-medium">Encontre desde o queijo coalho artesanal até peças maturadas exclusivas para atender seus clientes.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-[#2b1400]/10 flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 className="w-5 h-5 text-[#2b1400]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-[#2b1400] mb-1">Negociação Facilitada</h4>
                        <p className="text-[#2b1400]/80 leading-relaxed font-medium">Inicie conversas pelo WhatsApp diretamente com os produtores verificados na plataforma.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <FaqSection />

          {/* Call To Action Banner */}
          <div className="w-full py-16 md:py-20 px-4 md:px-8 relative overflow-hidden">
             <video 
                src="https://video.wixstatic.com/video/6acedd_b8aa7ae2be2f4d0fb1c8dd81ac1e15bf/720p/mp4/file.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover object-center" 
             />
             <div className="absolute inset-0 bg-[#4a2000]/60 backdrop-blur-[2px]"></div>
             
             <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-md">
                   Pronto para transformar sua maneira de fazer negócios?
                </h2>
                <p className="text-white/90 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto drop-shadow">
                   O Banco do Queijo é cem por cento gratuito para cadastro. Escolha seu perfil e junte-se à revolução do mercado.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link 
                    to="/cadastro?role=PRODUTOR" 
                    className="w-full sm:w-auto px-8 py-4 bg-[#d36101] text-white font-bold text-lg rounded-full hover:bg-[#b05000] transition-colors shadow-lg shadow-black/20"
                  >
                    Quero Vender Queijo
                  </Link>
                  <Link 
                    to="/cadastro?role=ATACADISTA" 
                    className="w-full sm:w-auto px-8 py-4 bg-app-accent text-app-bgDark font-bold text-lg rounded-full hover:bg-yellow-300 transition-colors shadow-lg shadow-black/20"
                  >
                    Quero Comprar Queijo
                  </Link>
                </div>
             </div>
          </div>

        </section>
      </main>
      </div>
      <div className="shrink-0 relative z-50">
        <Footer />
      </div>
    </div>
  );
}
