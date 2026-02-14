// Guarda a referência do intervalo do cronômetro (para poder parar ao iniciar outro)
let countdown;
// Timestamp (ms) em que o cronômetro termina — usamos para calcular o tempo restante mesmo com a aba em segundo plano
let endTime = null;
// Referência do áudio do alarme (para poder parar quando o usuário fechar o modal)
let currentAlarm = null;
// Áudio já "desbloqueado" por gesto do usuário (necessário no iOS para tocar quando o timer terminar)
let preparedAlarm = null;
// Intervalo da vibração (para poder parar quando o usuário fechar o modal)
let vibrationInterval = null;
// Se já pedimos permissão de notificação (para não pedir de novo a cada timer)
let notificationPermissionAsked = false;

// Controle de Wake Lock (manter a tela ligada)
let wakeLock = null;

// Áudio silencioso para manter o app rodando em background no iOS/Android
let silentAudio = null;
const SILENT_MP3 = "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAAtAAAB5AAAAAAAAAAAAAA//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

const HISTORY_KEY = "eggTimerHistory";

// Firebase (opcional): só usa se firebase-config.js existir e tiver config
let firebaseAuth = null;
let firebaseDb = null;
const FIRESTORE_COLLECTION = "history";

if (typeof firebase !== "undefined" && window.firebaseConfig) {
  // Verifica se o usuário configurou o Firebase (tirou os placeholders)
  const isConfigured = window.firebaseConfig.apiKey !== "SUA_API_KEY" &&
    window.firebaseConfig.projectId !== "SEU_PROJECT_ID";

  if (!isConfigured) {
    console.warn("Firebase não está configurado. O login não funcionará.");
    // Opcional: Desabilitar botão ou avisar na UI
    document.getElementById("btn-login").addEventListener("click", () => {
      alert("O Firebase não está configurado. Abra o arquivo firebase-config.js e adicione suas credenciais.");
    });
  } else {
    try {
      firebase.initializeApp(window.firebaseConfig);
      firebaseAuth = firebase.auth();
      firebaseDb = firebase.firestore();
      document.querySelector(".auth-area").classList.remove("hidden");
      firebaseAuth.onAuthStateChanged(updateAuthUI);
      // Completar login por redirecionamento (usado no Safari/iOS)
      firebaseAuth.getRedirectResult().catch((err) => console.warn("Redirect result:", err));
      document.getElementById("btn-login").addEventListener("click", loginWithGoogle);
      document.getElementById("btn-logout").addEventListener("click", logout);
    } catch (e) {
      console.warn("Firebase init:", e);
    }
  }
}

function updateAuthUI(user) {
  const btnLogin = document.getElementById("btn-login");
  const userEmail = document.getElementById("user-email");
  const btnLogout = document.getElementById("btn-logout");

  if (user) {
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");

    // Verifica se já tem username salvo no Firestore
    if (firebaseDb) {
      firebaseDb.collection("users").doc(user.uid).get()
        .then((doc) => {
          if (doc.exists && doc.data().username) {
            userEmail.textContent = doc.data().username;
            userEmail.classList.remove("hidden");
          } else {
            // Se não tem username, mostra o modal para escolher
            document.getElementById("username-modal").classList.add("is-open");
            document.getElementById("username-modal").setAttribute("aria-hidden", "false");
            userEmail.classList.add("hidden");
          }
        })
        .catch((err) => {
          console.warn("Erro ao buscar perfil:", err);
          // Fallback para o nome do Google
          userEmail.textContent = user.displayName || user.email;
          userEmail.classList.remove("hidden");
        });
    } else {
      userEmail.textContent = user.displayName || user.email;
      userEmail.classList.remove("hidden");
    }

  } else {
    btnLogin.classList.remove("hidden");
    userEmail.classList.add("hidden");
    btnLogout.classList.add("hidden");
  }
}

function saveUsername() {
  const input = document.getElementById("username-input");
  const name = input.value.trim();
  if (!name) return alert("Por favor, digite um nome.");

  const user = firebaseAuth.currentUser;
  if (!user || !firebaseDb) return;

  firebaseDb.collection("users").doc(user.uid).set({
    username: name,
    email: user.email
  }, { merge: true })
    .then(() => {
      // Atualiza UI
      document.getElementById("user-email").textContent = name;
      document.getElementById("user-email").classList.remove("hidden");

      // Fecha modal
      document.getElementById("username-modal").classList.remove("is-open");
      document.getElementById("username-modal").setAttribute("aria-hidden", "true");
    })
    .catch((err) => {
      console.error("Erro ao salvar nome:", err);
      alert("Erro ao salvar o nome. Tente novamente.");
    });
}

function loginWithGoogle() {
  if (!firebaseAuth) return;
  const provider = new firebase.auth.GoogleAuthProvider();

  function showError(err) {
    console.warn("Login:", err.code, err.message);
    let msg = "Não foi possível entrar. Tente de novo.";
    if (window.location.protocol === "file:") {
      msg = "O login com Google não funciona quando aberto direto do arquivo (file://). Você precisa rodar em um servidor local (localhost).";
    } else if (err.code === "auth/unauthorized-domain") {
      msg = "Este endereço não está autorizado no Firebase. Adicione o domínio em: Authentication → Settings → Authorized domains (ex.: localhost ou seu domínio).";
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "Login com Google não está ativado. Ative em: Firebase Console → Authentication → Sign-in method.";
    } else if (err.code) {
      msg += " (" + err.code + ")";
    }
    alert(msg);
  }

  // PWA aberto pelo ícone na tela inicial (iOS): redirect não é suportado → usa popup
  const isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  if (isStandalone) {
    firebaseAuth.signInWithPopup(provider).catch(showError);
    return;
  }

  // No navegador normal: redirect (evita bloqueio de popup no Safari)
  firebaseAuth.signInWithRedirect(provider).catch((err) => {
    if (err.code === "auth/operation-not-supported-in-this-environment") {
      firebaseAuth.signInWithPopup(provider).catch(showError);
    } else {
      showError(err);
    }
  });
}

function logout() {
  if (firebaseAuth) firebaseAuth.signOut();
}

/**
 * Mostra a aba Timer ou Histórico.
 */
function showTab(tabName) {
  const timerPage = document.getElementById("timer-page");
  const historyPage = document.getElementById("history-page");
  document.querySelectorAll(".tab").forEach((btn) => {
    const isActive = btn.getAttribute("data-tab") === tabName;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-selected", isActive);
  });
  timerPage.classList.toggle("hidden", tabName !== "timer");
  historyPage.classList.toggle("hidden", tabName !== "history");
  if (tabName === "history") renderHistory();
}

/**
 * Retorna o histórico do localStorage (array de { tipo, dateTime }).
 */
function getHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    // Garante que todo item local tenha um ID (usamos dateTime se não tiver)
    return list.map(item => ({
      ...item,
      id: item.id || item.dateTime
    }));
  } catch {
    return [];
  }
}

/**
 * Retorna o histórico: da nuvem (Firestore) se estiver logado, senão do localStorage.
 */
async function getHistoryAsync() {
  const user = firebaseAuth && firebaseAuth.currentUser;
  if (user && firebaseDb) {
    try {
      const snap = await firebaseDb.collection(FIRESTORE_COLLECTION)
        .where("userId", "==", user.uid)
        .orderBy("dateTime", "desc")
        .limit(200)
        .get();
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id, // ID do Firestore
          tipo: data.tipo,
          dateTime: data.dateTime
        };
      });
    } catch (e) {
      console.warn("Firestore read:", e);
      return getHistory();
    }
  }
  return getHistory();
}

/**
 * Adiciona um uso ao histórico (localStorage e, se logado, Firestore).
 */
function addToHistory(tipo) {
  const dateTime = new Date().toISOString();
  const list = getHistory();
  list.push({ tipo, dateTime });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));

  const user = firebaseAuth && firebaseAuth.currentUser;
  if (user && firebaseDb) {
    firebaseDb.collection(FIRESTORE_COLLECTION).add({
      userId: user.uid,
      tipo,
      dateTime
    }).catch((e) => console.warn("Firestore write:", e));
  }
}

/**
 * Preenche a lista de histórico na tela (tipo, data e hora).
 */
async function renderHistory() {
  const container = document.getElementById("history-list");
  const emptyEl = document.getElementById("history-empty");
  container.innerHTML = "";
  emptyEl.classList.add("hidden");

  const list = await getHistoryAsync();
  const sorted = [...list].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  if (sorted.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  sorted.forEach((item) => {
    const li = document.createElement("li");
    const d = new Date(item.dateTime);
    const dataHora = d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    li.innerHTML = `
      <div class="history-content">
        <span class="history-tipo">${escapeHtml(item.tipo)}</span>
        <span class="history-datetime">${dataHora}</span>
      </div>
      <button class="btn-delete-history" onclick="deleteHistoryItem('${item.id}')" title="Excluir">
        🗑️
      </button>
    `;
    container.appendChild(li);
  });
}

async function deleteHistoryItem(id) {
  if (!confirm("Tem certeza que deseja excluir este item?")) return;

  const user = firebaseAuth && firebaseAuth.currentUser;

  // Tenta deletar do Firestore se estiver logado
  if (user && firebaseDb) {
    try {
      await firebaseDb.collection(FIRESTORE_COLLECTION).doc(id).delete();
      // Se der erro (ex: não existe no firestore), cai no catch e tenta local
    } catch (e) {
      console.warn("Erro ao deletar do Firestore ou item é local:", e);
    }
  }

  // Deleta do LocalStorage (sempre tenta, para garantir sincronia ou itens desconectados)
  const list = getHistory();
  const newList = list.filter(item => item.id !== id && item.dateTime !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newList));

  // Re-renderiza a lista
  renderHistory();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Background Support Functions ---

async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        // console.log("Wake Lock released");
      });
      // console.log("Wake Lock active");
    } catch (err) {
      console.warn("Wake Lock error:", err);
    }
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

function startBackgroundSupport() {
  // Toca áudio silencioso em loop para forçar o modo "media playback"
  if (!silentAudio) {
    silentAudio = new Audio(SILENT_MP3);
    silentAudio.loop = true;
  }
  silentAudio.play().catch(() => { });
}

function stopBackgroundSupport() {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio.currentTime = 0;
  }
}

// Re-solicita o Wake Lock se a página voltar a ficar visível e o timer estiver rodando
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await requestWakeLock();
  }
});

function startTimer(seconds, tipo) {
  if (tipo) addToHistory(tipo);

  // Ativa suporte a background
  requestWakeLock();
  startBackgroundSupport();

  if (!notificationPermissionAsked && "Notification" in window) {
    notificationPermissionAsked = true;
    Notification.requestPermission();
  }
  // iOS/Safari: áudio só toca se tiver sido "desbloqueado" por um gesto do usuário.
  // Criamos e damos play/pause aqui (no clique) para poder tocar depois quando o timer terminar.
  if (!preparedAlarm) {
    preparedAlarm = new Audio("assets/sounds/alarm.mp3");
    preparedAlarm.load();
    preparedAlarm.play().then(() => {
      preparedAlarm.pause();
      preparedAlarm.currentTime = 0;
    }).catch(() => { });
  }
  document.getElementById("egg-grid").classList.add("hidden");
  document.getElementById("cooking-view").classList.remove("hidden");
  clearInterval(countdown);
  // Marca o momento exato em que o timer deve terminar (assim não depende do setInterval rodar a cada 1s)
  endTime = Date.now() + seconds * 1000;

  // Calcula quantos segundos faltam com base no relógio do sistema (não no número de ticks)
  function getTimeLeft() {
    if (!endTime) return 0;
    return Math.ceil((endTime - Date.now()) / 1000);
  }

  function updateDisplay() {
    const timeLeft = getTimeLeft();
    const minutes = Math.max(0, Math.floor(timeLeft / 60));
    const secs = Math.max(0, timeLeft % 60);
    document.getElementById("timer").innerText =
      `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  updateDisplay();

  countdown = setInterval(() => {
    const timeLeft = getTimeLeft();
    if (timeLeft <= 0) {
      clearInterval(countdown);
      endTime = null;
      // Para o suporte a background (silêncio) antes do alarme
      releaseWakeLock();
      stopBackgroundSupport();
      triggerAlarm();
      return;
    }
    updateDisplay();
  }, 1000);
}

// Dispara o alarme e o modal (evita duplicar se visibilitychange e setInterval dispararem juntos)
function triggerAlarm() {
  if (currentAlarm) return; // já disparou
  // Usa o áudio já desbloqueado no gesto (iOS) ou cria um novo (outros navegadores)
  currentAlarm = preparedAlarm || new Audio("assets/sounds/alarm.mp3");
  preparedAlarm = null;
  currentAlarm.loop = true;
  currentAlarm.currentTime = 0;
  currentAlarm.play().catch(() => { });
  // Vibração repetida até o usuário fechar o modal (API de Vibração do navegador)
  if ("vibrate" in navigator) {
    navigator.vibrate(300);
    vibrationInterval = setInterval(() => {
      navigator.vibrate(300);
    }, 600);
  }
  document.getElementById("ready-modal").classList.add("is-open");
  document.getElementById("ready-modal").setAttribute("aria-hidden", "false");
  // Notificação no celular: toque para voltar à página do timer
  if ("Notification" in window && Notification.permission === "granted") {
    const n = new Notification("Egg Timer", {
      body: "Sua gema está pronta! Toque para voltar.",
      tag: "egg-timer-ready",
      icon: "assets/icons/icon-192.png"
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  }
}

// Quando o usuário volta para a aba, atualiza o display na hora (o navegador pode ter pausado o setInterval)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && endTime != null) {
    const timeLeft = Math.ceil((endTime - Date.now()) / 1000);
    if (timeLeft <= 0) {
      clearInterval(countdown);
      endTime = null;
      triggerAlarm();
    } else {
      const minutes = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.getElementById("timer").innerText =
        `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
  }
});

/**
 * Fecha o modal "Sua gema está pronta!" e para o som do alarme.
 */
function closeReadyModal() {
  document.getElementById("ready-modal").classList.remove("is-open");
  document.getElementById("ready-modal").setAttribute("aria-hidden", "true");
  if (currentAlarm) {
    currentAlarm.pause();
    currentAlarm.currentTime = 0;
    currentAlarm = null;
  }
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
    if ("vibrate" in navigator) navigator.vibrate(0); // cancela vibração em andamento
  }
  document.getElementById("egg-grid").classList.remove("hidden");
  document.getElementById("cooking-view").classList.add("hidden");
  releaseWakeLock();
  stopBackgroundSupport();
}

function stopTimer() {
  if (countdown) {
    clearInterval(countdown);
    countdown = null;
  }
  endTime = null;
  document.getElementById("egg-grid").classList.remove("hidden");
  document.getElementById("cooking-view").classList.add("hidden");
  releaseWakeLock();
  stopBackgroundSupport();
}
