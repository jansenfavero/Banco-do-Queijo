import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#2b1400] text-gray-100 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/" className="inline-flex items-center text-[#d36101] hover:text-[#ffcb05] transition-colors font-medium">
          &larr; Voltar para Home
        </Link>
        <Card className="bg-[#4a2000] border-white/10 shadow-2xl rounded-[24px]">
          <CardHeader className="border-b border-white/10 pb-6 rounded-t-[24px] bg-[#3e1c00]">
            <CardTitle className="text-3xl flex items-center gap-3 text-white">
              <FileText className="w-8 h-8 text-[#ffcb05]" />
              Termos de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 prose prose-invert max-w-none text-white/80">
            <h3 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h3>
            <p className="mb-6">
              Ao acessar, registrar-se ou usar os serviços fornecidos pelo <strong>Banco do Queijo</strong> (a "Plataforma"), você concorda expressamente e reconhece que leu e se compromete a respeitar e cumprir todas as disposições contidas neste Termo de Serviço.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">2. Papel da Plataforma</h3>
            <p className="mb-6">
              O Banco do Queijo atua como um sistema de aproximação digital que visa conectar Produtores de queijo (vendedores) e Atacadistas (compradores). Nós não fabricamos, estocamos, despachamos ou entregamos quaisquer dos produtos ofertados. A Plataforma proporciona a interface necessária para facilitar negociações através da troca de intenções e listagem de estoques.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">3. Responsabilidades do Usuário</h3>
            <p className="mb-6">
              Você se compromete a:
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Fornecer dados reais, precisos e atualizáveis em seu cadastro;</li>
                <li>Garantir a veracidade e legalidade dos produtos ofertados ou das compras pretendidas;</li>
                <li>Honrar os acordos firmados (transações de compra e venda) utilizando as informações de contato fornecidas pela Plataforma;</li>
                <li>Manter o sigilo de suas credenciais de acesso não as compartilhando com terceiros.</li>
              </ul>
            </p>

            <h3 className="text-xl font-bold text-white mb-4">4. Restrições e Suspensões</h3>
            <p className="mb-6">
              O Banco do Queijo reserva-se o direito de, a seu exclusivo critério, auditar e moderar o comportamento de seus usuários. Perfis que violarem a boa-fé das negociações, praticarem fraude, utilizarem linguagem ofensiva ou não procederem com as validações KYC (Know Your Customer) aplicáveis, poderão ter suas contas suspensas ou encerradas permanentemente sem aviso prévio.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">5. Limitação de Responsabilidade</h3>
            <p className="mb-6">
              Reconhecendo a natureza do serviço que ofertamos, o Banco do Queijo não garante nem assume responsabilidade solidária por eventuais vícios aparentes ou ocultos nos queijos comercializados, ou sobre a viabilidade das entregas logísticas, uma vez que estas tratativas são executadas de forma descentralizada pelos Produtores. Qualquer disputa técnica a respeito da qualidade do material deve ser tratada diretamente entre as partes da compra, com a Plataforma podendo agir apenas como mitigador amigável.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">6. Propriedade Intelectual</h3>
            <p className="mb-6">
              Todo o conteúdo presente na Plataforma, incluindo design, logotipos, interface, bases de dados e algoritmos é propriedade intelectual exclusiva e protegida pelas leis aplicáveis de direitos autorais e propriedade industrial. É estritamente proibido extrair dados sem autorização tácita e oficial do Banco do Queijo.
            </p>

            <h3 className="text-xl font-bold text-white mb-4">7. Atualizações dos Termos</h3>
            <p>
              Estes termos poderão ser modificados ou adendados periodicamente para refletirem alterações no escopo do serviço ou conformidade regulatória. Entendemos que seu uso contínuo da Plataforma após quaisquer ajustes constitui a aceitação incondicional dos novos Termos de Serviço vigentes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
