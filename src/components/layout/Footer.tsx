import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full py-2 mt-auto bg-black/50 border-t border-white/5 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-white/50">
        <p className="text-center sm:text-left leading-tight">
          &copy; 2026 | Todos os Direitos Reservados | Desenvolvido por{' '}
          <a
            href="https://gere.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-accent hover:text-yellow-300 font-medium transition-colors"
          >
            Gere.App
          </a>
        </p>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to="/privacidade" className="hover:text-white transition-colors">
            Política de Privacidade
          </Link>
          <span className="text-white/20">&bull;</span>
          <Link to="/termos" className="hover:text-white transition-colors">
            Termos de Serviço
          </Link>
        </div>
      </div>
    </footer>
  );
}
