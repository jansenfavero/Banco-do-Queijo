import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Store, ArrowRight } from 'lucide-react';
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

export function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-app-bgDark text-gray-100">
      
      {/* Hero Background */}
      <div className="absolute top-0 left-0 w-full h-screen z-0 overflow-hidden pointer-events-none bg-[#2b1400]">
        <video 
          src="https://video.wixstatic.com/video/6acedd_b8aa7ae2be2f4d0fb1c8dd81ac1e15bf/720p/mp4/file.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover object-right md:object-center opacity-70" 
        />
        <div className="absolute inset-0 bg-[#3e1c00]/40"></div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-app-bgDark via-app-bgDark/90 to-transparent"></div>
      </div>

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

      <main className="flex-grow w-full relative flex flex-col justify-center pb-20">
        
        {/* Título Hero Section */}
        <div className="px-4 sm:px-8 max-w-[95%] xl:max-w-[1400px] mx-auto mt-[2vh] md:mt-[5vh] mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-30 text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-accent/20 border border-app-accent/30 text-app-accent text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg cursor-default">
             <Star className="w-3 h-3 text-app-accent" /> A Maior Plataforma de Queijos do Brasil
          </span>
          <h2 className="text-4xl md:text-[4rem] leading-[1.1] font-bold text-white tracking-tight max-w-5xl drop-shadow-2xl mb-6">
            Mais Vendas para Quem Produz, <br className="md:hidden" /> <span className="hidden md:inline"><br /></span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-accent to-yellow-200">Mais Lucro para Quem Vende.</span>
          </h2>
          <p className="text-white/90 max-w-3xl text-lg md:text-xl font-medium drop-shadow-md mb-12">
            Conectamos Produtores Artesanais a Compradores Atacadistas. Elimine Intermediários, Reduza Custos e Garanta Sempre o Melhor Queijo, com o Melhor Preço, com Cotação em Tempo Real.
          </p>

          {/* Cards de Cadastro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            
            {/* Card Produtor */}
            <Link 
              to="/cadastro?role=PRODUTOR" 
              className="group relative overflow-hidden rounded-[2rem] bg-app-cardDark/80 backdrop-blur-md border border-[#d36101]/30 p-6 text-left transition-all duration-500 hover:bg-[#703200]/90 hover:border-app-accent hover:shadow-[0_0_30px_rgba(211,97,1,0.4)] hover:-translate-y-2"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <CheeseIcon className="w-32 h-32 text-app-accent" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#703200] flex items-center justify-center mb-6 border border-[#d36101]/50 group-hover:bg-app-accent group-hover:border-app-accent transition-colors duration-500">
                  <CheeseIcon className="w-8 h-8 text-app-accent group-hover:text-app-bgDark transition-colors duration-500" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Sou Produtor</h3>
                <p className="text-white/70 font-medium mb-8 text-lg">
                  Quero vender meus queijos diretamente para atacadistas e distribuidores de todo o Brasil.
                </p>
                <div className="flex justify-center w-full mt-2">
                  <div className="relative inline-flex group/btn">
                    <div className="absolute -inset-1 bg-[#d36101] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                    <div className="relative flex items-center justify-center px-8 py-3 bg-[#d36101] text-white font-bold text-lg rounded-full transition-transform hover:scale-105 shadow-lg animate-scale-pulse">
                      Criar Conta Grátis <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Atacadista */}
            <Link 
              to="/cadastro?role=ATACADISTA" 
              className="group relative overflow-hidden rounded-[2rem] bg-app-cardDark/80 backdrop-blur-md border border-[#d36101]/30 p-6 text-left transition-all duration-500 hover:bg-[#703200]/90 hover:border-app-accent hover:shadow-[0_0_30px_rgba(211,97,1,0.4)] hover:-translate-y-2"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                <Store className="w-32 h-32 text-app-accent" />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#703200] flex items-center justify-center mb-6 border border-[#d36101]/50 group-hover:bg-app-accent group-hover:border-app-accent transition-colors duration-500">
                  <Store className="w-8 h-8 text-app-accent group-hover:text-app-bgDark transition-colors duration-500" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">Sou Atacadista</h3>
                <p className="text-white/70 font-medium mb-8 text-lg">
                  Quero comprar queijos direto da fonte, com os melhores preços e negociação simplificada.
                </p>
                <div className="flex justify-center w-full mt-2">
                  <div className="relative inline-flex group/btn">
                    <div className="absolute -inset-1 bg-app-accent rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                    <div className="relative flex items-center justify-center px-8 py-3 bg-app-accent text-app-cardDark font-bold text-lg rounded-full transition-transform hover:scale-105 shadow-lg animate-scale-pulse">
                      Criar Conta Grátis <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
