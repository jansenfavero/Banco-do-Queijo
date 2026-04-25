# PRD - Banco do Queijo

## 1. Visão Geral (Conceito)
O **Banco do Queijo** é uma plataforma B2B (Business to Business) inovadora, projetada como um marketplace especializado para o setor de queijos artesanais. A aplicação atua como uma ponte direta e eficiente entre produtores artesanais e compradores atacadistas ou distribuidores em todo o Brasil.

O conceito central é a **desintermediação**, permitindo que o produtor tenha maior margem de lucro e o comprador preços mais competitivos, eliminando atravessadores desnecessários.

---

## 2. Objetivos
- **Conexão Direta:** Facilitar o contato e a negociação entre quem produz e quem distribui.
- **Transparência:** Oferecer visibilidade sobre preços, volumes disponíveis e procedência.
- **Eficiência Operacional:** Automatizar o fluxo de pedidos, cotações e demandas.
- **Escalabilidade:** Permitir que produtores de qualquer porte acessem mercados nacionais.
- **Jornada Personalizada:** Oferecer interfaces distintas para os perfis de Produtor e Atacadista.

---

## 3. Público-Alvo e Funcionalidades por Perfil

### 3.1. Produtor (Vendedor)
Usuários que fabricam queijos artesanais.
- **Dashboard de Vendas:** Visão em tempo real de métricas (Faturamento, Volume, Pedidos).
- **Gerenciamento de Catálogo:** Cadastro detalhado de produtos (tipo de queijo, formato, preço/kg, volume disponível, selos de inspeção).
- **Gestão de Pedidos:** Recebimento e atualização de status de pedidos (Aceito, Em Trânsito, Entregue).
- **Perfil de Produtor:** Dados comerciais, fotos da produção e informações de frete.

### 3.2. Atacadista (Comprador)
Compradores recorrentes, restaurantes, empórios ou distribuidores.
- **Catálogo Público/Privado:** Busca por tipo de queijo e região.
- **Criação de Demandas:** Ferramenta para solicitar volumes específicos (Ex: "Preciso de 50kg de Queijo Canastra semanalmente").
- **Histórico de Pedidos:** Acompanhamento de compras e reposição.
- **Chat Direto:** Canal de negociação com produtores.

---

## 4. Identidade Visual (ID Visual)
A aplicação possui uma estética **Premium e Moderna**, focada no setor gastronômico artesanal.

- **Tipografia:** 'League Spartan' (Sans-serif) para uma leitura clara e moderna.
- **Paleta de Cores:**
  - `Background`: `#4a2000` (Marrom profundo, remete à terra e maturação).
  - `Card/Secondary`: `#d36101` (Laranja terroso, remete ao calor e queijos curados).
  - `Accent/Primary`: `#f4d763` (Amarelo ouro, cor clássica do queijo artesanal).
- **Elementos de UI:**
  - Cantos arredondados generosos (`border-radius: 25px`).
  - Efeitos de "Glow" em hover para destacar interatividade.
  - Animações sutis (float, pulse) para uma sensação de interface viva.
  - Modo Escuro (Dark Mode) como padrão nativo.

---

## 5. Stack Tecnológico (Recursos)
A aplicação utiliza as tecnologias mais modernas do mercado para garantir performance e escalabilidade:

- **Frontend:**
  - **React 19:** Última versão estável com suporte a hooks modernos.
  - **Vite:** Ferramenta de build ultrarrápida.
  - **TypeScript:** Segurança de tipos e facilidade de refatoração.
  - **Tailwind CSS v4:** Estilização baseada em utilitários e tokens.
  - **Shadcn UI:** Componentes de interface acessíveis e consistentes.
  - **Motion (Framer Motion):** Animações complexas e transições.
  - **Recharts:** Visualização de dados e métricas de dashboard.

- **Ferramentas e Bibliotecas:**
  - **React Hook Form & Zod:** Gerenciamento e validação de formulários.
  - **Lucide React:** Iconografia padronizada.
  - **Sonner:** Sistema de notificações (toasts) premium.

---

## 6. Estrutura do Projeto (Arquitetura)
O projeto segue uma arquitetura modular e organizada:

```text
/src
  /components
    /layout     - Estruturas de página (Header, Sidebar, AppLayout)
    /ui         - Componentes base (Botões, Inputs, Cards)
  /hooks        - Lógica reutilizável (useAuth, useOrders, etc.)
  /lib          - Configurações (Firebase, Error Mapping, Utils)
  /pages        - Páginas completas (Home, Dashboard, Catalog, etc.)
  App.tsx       - Roteamento e Provedores Globais
  index.css     - Design System e Tokens de estilo
```

---

## 7. Backend, Autenticação e Segurança

### 7.1. Firebase (BaaS)
- **Firebase Auth:** Gerenciamento completo de sessão (E-mail/Senha).
- **Firestore Database:** Banco NoSQL para persistência de dados em tempo real.
- **Firebase Storage:** Armazenamento de imagens de produtos e perfis.

### 7.2. Estrutura de Dados (Principais Entidades)
- **User:** Perfil, Role (PRODUTOR/ATACADISTA), Dados comerciais (CNPJ/CPF), Localização.
- **Product:** Dados do queijo, Preço, Volume, Fotos, Produtor vinculado.
- **Order:** Vínculo Comprador/Produtor, Status, Valores, Taxas de plataforma.
- **Demand:** Solicitações abertas de compradores para o mercado.
- **Chat/Message:** Sistema de mensageria interna.

### 7.3. Segurança (RBAC)
- Acesso controlado via **Roles**. O componente `ProtectedRoute` garante que usuários acessem apenas as áreas permitidas para seu perfil.
- Regras de segurança no Firestore garantem que um usuário não possa modificar dados de outro.

---

## 8. Roadmap e Melhorias Identificadas
- **Integração de Pagamentos:** Implementação de checkout direto via API (Ex: Mercado Pago/Stripe).
- **IA de Apoio:** Uso do SDK Gemini para suporte inteligente e auxílio na criação de descrições de produtos.
- **Mobile App:** Adaptação da PWA para aplicativos nativos.
- **Relatórios Avançados:** Exportação de métricas em PDF/CSV para produtores.
