# Configuração do Firebase para Egg Timer

Este guia explica como configurar o projeto Firebase necessário para o funcionamento do Login com Google e do Histórico neste projeto.

## 1. Criar Projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **"Adicionar projeto"**.
3. Dê um nome ao projeto (ex: `egg-timer-web`) e continue.
4. (Opcional) Desative o Google Analytics para simplificar e crie o projeto.

## 2. Registrar o App Web

1. Na tela inicial do projeto, clique no ícone **Web** ( `</>` ).
2. Dê um apelido ao app (ex: `Egg Timer Web`).
3. Clique em **Registrar app**.
4. **IMPORTANTE:** Copie apenas o objeto `firebaseConfig` (o conteúdo entre as chaves `{ ... }`). Você precisará dele no próximo passo.

## 3. Configurar o Código

1. Na pasta do projeto, localize ou crie o arquivo `firebase-config.js`.
2. Cole o objeto de configuração dentro da variável `window.firebaseConfig`, conforme o exemplo abaixo:

```javascript
window.firebaseConfig = {
  apiKey: "Sua_API_Key_Aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

> **Nota:** Não compartilhe sua API Key publicamente (não envie este arquivo para o GitHub se o repositório for público).

## 4. Ativar Autenticação (Google Login)

1. No menu lateral do Firebase, vá em **Criação** > **Authentication**.
2. Clique em **Vamos começar**.
3. Na aba **Sign-in method**, selecione **Google**.
4. Clique em **Ativar**.
5. Selecione um **E-mail de suporte** para o projeto.
6. Clique em **Salvar**.

## 5. Configurar Firestore (Banco de Dados)

1. No menu lateral, vá em **Criação** > **Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha um local para o servidor (ex: `southamerica-east1` para São Paulo, ou o padrão).
4. Escolha o modo de regras de segurança:
   - Para testes rápidos: **Iniciar no modo de teste** (permite escrita/leitura por 30 dias).
   - Para produção (Recomendado): **Iniciar no modo de produção**. Neste caso, você precisará configurar as regras depois para permitir que apenas usuários logados escrevam.

   **Exemplo de regras básicas de segurança:**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 6. Solução de Problemas Comuns

### Erro: `auth/operation-not-supported-in-this-environment`
Se você receber este erro ao tentar logar, é porque está abrindo o arquivo `index.html` direto (protocolo `file://`).
O Firebase Authentication **requer um servidor HTTP** para funcionar (protocolo `http://` ou `https://`).

**Como corrigir:**
Use uma extensão como "Live Server" no VS Code ou rode um comando simples no terminal:

```bash
# Python 3
python3 -m http.server

# Node.js (se tiver http-server instalado)
npx http-server .
```

Acesse pelo endereço local (ex: `http://127.0.0.1:8000` ou `http://localhost:5500`).

### Domínios Autorizados
Se o login ainda falhar, verifique se o seu domínio local está autorizado:
1. Vá em **Authentication** > **Settings** (Configurações) > **Domínios autorizados**.
2. Certifique-se de que `localhost` e `127.0.0.1` estão na lista.
