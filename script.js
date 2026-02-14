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
    userEmail.textContent = user.email || user.displayName || "Conectado";
    userEmail.classList.remove("hidden");
    btnLogout.classList.remove("hidden");
  } else {
    btnLogin.classList.remove("hidden");
    userEmail.classList.add("hidden");
    btnLogout.classList.add("hidden");
  }
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
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
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
        return { tipo: data.tipo, dateTime: data.dateTime };
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
    li.innerHTML = `<span class="history-tipo">${escapeHtml(item.tipo)}</span><span class="history-datetime">${dataHora}</span>`;
    container.appendChild(li);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function startTimer(seconds, tipo) {
  if (tipo) addToHistory(tipo);
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
}

function stopTimer() {
  if (countdown) {
    clearInterval(countdown);
    countdown = null;
  }
  endTime = null;
  document.getElementById("egg-grid").classList.remove("hidden");
  document.getElementById("cooking-view").classList.add("hidden");
}
