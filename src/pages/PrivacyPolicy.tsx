import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#2b1400] text-gray-100 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-[#d36101] hover:text-[#ffcb05] transition-colors font-medium">
          &larr; Voltar para Home
        </Link>
        <Card className="bg-[#4a2000] border-white/10 shadow-2xl rounded-[24px]">
          <CardHeader className="border-b border-white/10 pb-6 rounded-t-[24px] bg-[#3e1c00]">
            <CardTitle className="text-3xl flex items-center gap-3 text-white">
              <ShieldCheck className="w-8 h-8 text-[#ffcb05]" />
              Política de Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 prose prose-invert max-w-none text-white/80">
            <h3 className="text-xl font-bold text-white mb-4">1. Coleta de Informações</h3>
            <p className="mb-6">
              O <strong>Banco do Queijo</strong> coleta informações pessoais que você nos fornece diretamente ao criar uma conta, como nome, e-mail, telefone, CPF/CNPJ e endereço. Além disso, podemos coletar dados sobre as transações e interações realizadas dentro da plataforma.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">2. Uso de Informações</h3>
            <p className="mb-6">
              Utilizamos suas informações para:
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Fornecer, operar, manter e melhorar nossa plataforma;</li>
                <li>Processar transações e enviar avisos relacionados;</li>
                <li>Responder a comentários, perguntas e fornecer suporte ao cliente;</li>
                <li>Verificar sua identidade (KYC) e prevenir fraudes;</li>
                <li>Garantir a segurança e integridade do nosso serviço.</li>
              </ul>
            </p>

            <h3 className="text-xl font-bold text-white mb-4">3. Compartilhamento de Informações</h3>
            <p className="mb-6">
              Não vendemos suas informações pessoais a terceiros. As informações de contato e endereço podem ser compartilhadas entre Produtores e Atacadistas exclusivamente para a finalização das negociações de compra e frete iniciadas dentro da nossa plataforma.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">4. Segurança de Dados</h3>
            <p className="mb-6">
              Empregamos medidas de segurança estruturais, técnicas e administrativas para proteger suas informações pessoais. Nossas bases de dados são hospedadas em provedores de nuvem de alta segurança e utilizamos criptografia para mitigar os riscos de perda ou acesso não autorizado.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">5. Direitos do Usuário</h3>
            <p className="mb-6">
              De acordo com a LGPD, você tem o direito de solicitar o acesso, correção, atualização ou exclusão de seus dados pessoais. Se desejar exercer esses direitos ou encerrar sua conta, entre em contato através de nossos canais de suporte.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">6. Contato</h3>
            <p>
              Se você tiver alguma dúvida sobre esta Política de Privacidade, as práticas deste site, ou suas relações com este site, entre em contato conosco pelos canais oficiais disponíveis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
