import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto bg-black/50 border-t border-white/5 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col items-center justify-center gap-2 text-sm text-white/50 text-center">
        <p>
          &copy; 2026 | Todos os Direitos Reservados | Desenvolvido por Gere Tecnologia |{' '}
          <a
            href="https://gere.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-app-accent hover:text-yellow-300 font-medium transition-colors"
          >
            Gere.App
          </a>
        </p>
        <div className="flex items-center gap-4 text-xs mt-1">
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
