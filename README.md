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
* ⚡ Instalável como aplicativo (PWA)
* 🔔 Alarme sonoro ao finalizar (com suporte a tocar no iOS)
* 📳 Vibração em dispositivos compatíveis
* 🔔 Notificação no dispositivo quando o timer termina (“Sua gema está pronta!”)
* 📋 **Aba Histórico** com lista de ovos recentes (tipo + data/hora)
* 💾 Persistência local com LocalStorage
* ☁️ **Histórico na nuvem (opcional)** — login com Google e sincronização via Firebase (Firestore); acesse o histórico de qualquer lugar com sua conta
* 🌐 Funcionamento offline com Service Worker
* ⏳ Timer preciso em segundo plano (usa hora de término, não apenas intervalos)
* 🧩 UI inspirada em janelas vintage

---

## 🛠️ Tecnologias

* HTML5
* CSS3 (layout responsivo + UI customizada)
* JavaScript Vanilla
* Progressive Web App (PWA)
* Service Workers
* Firebase (opcional): Authentication (Google) e Firestore para histórico na nuvem
* Web APIs:
  * Audio API
  * Vibrate API
  * LocalStorage
  * Notifications API

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
 └── assets/
     ├── eggs/
     ├── icons/
     └── sounds/
```

---

## 💻 Como rodar localmente

### Método rápido

Abra o arquivo `index.html` diretamente no navegador.

### Ambiente de desenvolvimento (recomendado)

Para testar login com Google e histórico na nuvem, use um servidor local (Firebase Auth exige origem HTTP/HTTPS):

```bash
npx serve
```

Abra o endereço local exibido no terminal.

---

## 📱 Instalar como aplicativo

1. Acesse a versão publicada
2. Abra no navegador do celular
3. Toque em **Adicionar à tela inicial**
4. O app será instalado como aplicativo nativo

---

## 🎯 Objetivos do projeto

* Prática de desenvolvimento front-end
* Construção de Progressive Web Apps
* Criação de interfaces personalizadas
* Implementação de recursos offline
* Simulação de produto real para portfólio

---

## ☁️ Histórico na nuvem (Firebase)

Para salvar o histórico online e acessar de qualquer dispositivo com sua conta Google, siga o passo a passo em **[FIREBASE-SETUP.md](FIREBASE-SETUP.md)**. Sem configurar o Firebase, o app continua funcionando normalmente com histórico apenas local.

---

## 📈 Possíveis melhorias futuras

* 🎨 Animações da gema cozinhando
* 🧠 Preferências do usuário
* 🌙 Modo escuro
* 🎮 Animações pixel

---

## 👨‍💻 Autor

Projeto desenvolvido como estudo prático em desenvolvimento web e criação de PWAs com foco em portfólio profissional.

---

## 📄 Licença

Livre para uso educacional, modificações e melhorias.
