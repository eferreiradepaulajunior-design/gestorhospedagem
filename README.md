# S.C.H - Sistema de Controle de Hospedagens (Gestor de Hospedagem)

Um sistema completo, robusto e responsivo desenvolvido em Next.js para gerenciamento e controle financeiro de hospedagens de sites, domínios e carteira de clientes. O sistema foi projetado para oferecer uma experiência de aplicativo nativo no celular e conta com integrações avançadas de dados e pagamentos.

---

## 🚀 Principais Funcionalidades

### 👥 Multi-tenancy & Segurança Rigorosa
* **Isolamento de Dados:** Todo o banco de dados Firestore é estruturado sob o conceito de multi-tenancy. Cada cliente, hospedagem ou transação possui associação direta com o `userId` do usuário autenticado.
* **Firestore Security Rules:** Regras de segurança robustas implantadas diretamente no Firebase garantem que um usuário jamais consiga ler ou gravar dados pertencentes a outro usuário.

### 📊 Dashboard Financeiro de Alta Performance
* **Projeção Recorrente Inteligente:** Gráficos interativos (previsto vs. recebido) que projetam faturamentos automaticamente ao longo do ano baseando-se no ciclo de cobrança de cada serviço (Mensal, Trimestral, Semestral ou Anual).
* **Visão de Fluxo de Caixa:** Monitoramento instantâneo de faturamento total, valores já recebidos no ano e saldos pendentes a receber.

### 📱 Experiência Mobile Nativa
* **Bottom Navigation Bar:** Barra inferior flutuante com blur translúcido e micro-animações táteis (efeito de mola no clique), idêntica a de aplicativos nativos do iOS e Android.
* **Otimização Tátil (PWA-like):** Removidos atrasos de duplo clique, flashes azuis de toque (`tap-highlight-color`) e seleção acidental de textos em botões/menus.

### 🏢 Cadastro de Clientes por CNPJ
* **Autopreenchimento Instantâneo:** Digite o CNPJ da empresa e o sistema consulta a API pública `CNPJ.ws` para importar e formatar automaticamente os dados cadastrais (Razão Social, Nome Fantasia, E-mail, Telefone) e todo o endereço (CEP, Rua, Número, Bairro, Cidade, UF).

### 🔄 Integração Financeira com Asaas
* **Sincronização Manual:** Valide pagamentos em tempo real diretamente do painel de hospedagens. Com um clique o sistema consulta o Asaas e registra a baixa no Firestore se o status constar como pago.
* **Webhooks Automatizados:** Rota de webhook pronta em `/api/webhooks/asaas`. O Asaas notifica o sistema a cada pagamento confirmado e a hospedagem é liquidada de forma 100% autônoma, sem precisar de cliques.
* **Segurança de API Keys:** Painel administrativo em **Configurações > Asaas** para o usuário gerenciar sua chave de forma segura. A chamada à API é protegida no servidor do Next.js e usa autenticação JWT do Firebase Auth.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [Next.js](https://nextjs.org/) (App Router, Versão 16)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
* **Banco & Autenticação:** [Firebase v10](https://firebase.google.com/) (Auth, Firestore DB, Cloud Rules & Indexes)
* **Gráficos:** [Recharts](https://recharts.org/)
* **Animações:** [Framer Motion](https://www.framer.com/motion/)

---

## 📦 Como Instalar e Rodar o Projeto

1. Clone o repositório no seu computador:
   ```bash
   git clone https://github.com/eferreiradepaulajunior-design/gestorhospedagem.git
   cd gestorhospedagem
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie e configure o arquivo `.env.local` na raiz do projeto contendo as credenciais de acesso do Firebase e Asaas:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

   # Configurações padrão do Asaas (caso queira injetar via servidor global)
   ASAAS_API_KEY=seu_token_aqui
   ASAAS_API_URL=https://sandbox.asaas.com/api/v3
   ```

4. Execute o servidor de desenvolvimento local:
   ```bash
   npm run dev
   ```
   Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 🔒 Regras e Índices do Firebase

Para que o banco funcione perfeitamente com todas as queries otimizadas e regras de segurança, certifique-se de realizar o deploy do Firestore:

```bash
# Executar na raiz do projeto (caso tenha o Firebase CLI instalado)
npx firebase-tools deploy --only firestore --project SEU_PROJETO_FIREBASE
```

---

## 🔌 Configurando o Webhook do Asaas

1. Acesse o sistema e vá até a tela de **Configurações > Asaas**.
2. Copie a **URL do Webhook** que o sistema gerou para você.
3. No painel do seu **Asaas**, vá em **Minha Conta > Integrações > Webhooks > Fila de Cobrança**.
4. Ative o Webhook, cole a URL copiada e selecione o evento **"Pagamento Confirmado"** (`PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`).
5. A partir de agora, toda fatura paga no Asaas será liquidada automaticamente no sistema.
