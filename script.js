// Guarda a referência do intervalo do cronômetro (para poder parar ao iniciar outro)
let countdown;
// Timestamp (ms) em que o cronômetro termina — usamos para calcular o tempo restante mesmo com a aba em segundo plano
let endTime = null;
// Referência do áudio do alarme (para poder parar quando o usuário fechar o modal)
let currentAlarm = null;
// Intervalo da vibração (para poder parar quando o usuário fechar o modal)
let vibrationInterval = null;
// Se já pedimos permissão de notificação (para não pedir de novo a cada timer)
let notificationPermissionAsked = false;

/**
 * Inicia o cronômetro com o tempo em segundos.
 * Usa hora de término (endTime) para continuar correto quando a aba fica em segundo plano.
 */
const HISTORY_KEY = "eggTimerHistory";

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
 * Retorna o histórico salvo (array de { tipo, dateTime }).
 */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Adiciona um uso ao histórico e salva no localStorage.
 */
function addToHistory(tipo) {
  const list = getHistory();
  list.push({ tipo, dateTime: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

/**
 * Preenche a lista de histórico na tela (tipo, data e hora).
 */
function renderHistory() {
  const list = getHistory();
  const container = document.getElementById("history-list");
  const emptyEl = document.getElementById("history-empty");
  container.innerHTML = "";
  const sorted = [...list].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  if (sorted.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");
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
  currentAlarm = new Audio("assets/sounds/alarm.mp3");
  currentAlarm.loop = true;
  currentAlarm.play();
  // Vibração repetida até o usuário fechar o modal (API de Vibração do navegador)
  if ("vibrate" in navigator) {
    navigator.vibrate(300);
    vibrationInterval = setInterval(() => {
      navigator.vibrate(300);
    }, 600);
  }
  // Reinicia o GIF para ele animar ao abrir o modal (quando fica em display:none, o GIF não anima)
  const modalGif = document.querySelector("#ready-modal .modal-gif");
  if (modalGif) {
    const baseSrc = (modalGif.getAttribute("src") || "gif-final.gif").split("?")[0];
    modalGif.src = baseSrc + "?t=" + Date.now();
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
