# 🍳 Retro Egg Timer – Pixel PWA

![PWA](https://img.shields.io/badge/PWA-Installable-blue)
![Offline](https://img.shields.io/badge/Offline-First-success)
![Mobile](https://img.shields.io/badge/Mobile-Ready-orange)
![VanillaJS](https://img.shields.io/badge/JS-Vanilla-yellow)

Um **Progressive Web App (PWA)** de timer culinário com interface **retrô pixel art** inspirada em mini aplicativos vintage e widgets clássicos.
O usuário escolhe o ponto da gema e acompanha uma contagem regressiva com feedback visual, sonoro e tátil.

Projeto focado em **experiência do usuário, design de interface personalizada e fundamentos modernos de aplicações web**.

---

## 🚀 Funcionalidades

* ⏱️ **Timer** para 4 pontos de cozimento: Extra Mole (3 min), Mole (5 min), Média (7 min), Dura (10 min)
* 🎮 Interface retrô pixel art personalizada
* 📱 Design responsivo (mobile-first)
* ⚡ Instalável como aplicativo (PWA) e funcionamento offline
* 🔔 Alarme sonoro, vibração e notificação ao finalizar
* 🔋 **Modo Background Mobile**: O timer continua rodando e toca o alarme mesmo com a tela bloqueada (Android/iOS)
* 👤 **Login Personalizado**: Escolha seu "Nome de Chef" ao logar com o Google
* 📋 **Aba Histórico**:
    * Sincronização em tempo real via Firebase Firestore (se logado)
    * Armazenamento local (LocalStorage) se offline/deslogado
    * **Exclusão de itens**: Apague registros antigos do histórico
* 🧩 UI inspirada em janelas vintage com animações CSS

---

## 🛠️ Tecnologias

* HTML5 Semantic
* CSS3 (Grid, Flexbox, Animations, Media Queries)
* JavaScript (ES6+)
* **PWA & APIs**:
    * Service Workers (Cache offline)
    * Web Audio API (Sons)
    * Vibration API (Feedback tátil)
    * Screen Wake Lock API (Manter tela ativa)
    * Notifications API
* **Firebase (Backend-as-a-Service)**:
    * Authentication (Google Sign-In)
    * Firestore Database (NoSQL Realtime)

---

## 📂 Estrutura do projeto

```
/project
 ├── index.html
 ├── style.css
 ├── script.js
 ├── manifest.json
 ├── service-worker.js
 ├── firebase-config.js
 ├── FIREBASE-SETUP.md (Guia de configuração)
 └── assets/
     ├── eggs/
     ├── icons/
     └── sounds/
```

---

## 💻 Como rodar e configurar

1. Clone o projeto
2. Para usar as funcionalidades de **Login e Nuvem**, é necessário configurar o Firebase.
   - Siga o guia passo a passo em: **[FIREBASE-SETUP.md](FIREBASE-SETUP.md)**
3. Para rodar localmente (necessário servidor HTTP para o Auth funcionar):

```bash
# Com Python 3
python3 -m http.server

# Ou com Node.js
npx http-server .
```

4. Acesse `http://localhost:8000` (ou a porta indicada).

---

## 📱 Instalar como aplicativo

1. Acesse a versão publicada no celular
2. Toque em **Compartilhar** (iOS) ou **Menu** (Android)
3. Toque em **Adicionar à tela inicial**

---

## 🎯 Objetivos do projeto

* Prática de desenvolvimento front-end com JavaScript puro
* Integração com serviços de Backend (Firebase)
* Utilização de APIs modernas de navegador (Wake Lock, AudioContext)
* Construção de PWA offline-first

---

## 📈 Melhorias implementadas recentemente

* [x] Login com Google e persistência de dados
* [x] Escolha de nome de usuário personalizado
* [x] Exclusão de itens do histórico
* [x] Suporte a background timer (tela bloqueada)
* [ ] Modo escuro (futuro)

---

## 👨‍💻 Autor

Projeto desenvolvido como estudo prático em desenvolvimento web e criação de PWAs com foco em portfólio profissional.

---

## 📄 Licença

Livre para uso educacional, modificações e melhorias.
