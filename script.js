// Guarda a referência do intervalo do cronômetro (para poder parar ao iniciar outro)
let countdown;
// Referência do áudio do alarme (para poder parar quando o usuário fechar o modal)
let currentAlarm = null;

/**
 * Inicia o cronômetro com o tempo em segundos.
 * Atualiza o display a cada segundo e toca o alarme quando chegar a zero.
 */
function startTimer(seconds) {
  // Para qualquer cronômetro que já esteja rodando
  clearInterval(countdown);
  let timeLeft = seconds;

  // Atualiza o texto na tela no formato MM:SS
  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    document.getElementById("timer").innerText =
      `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Mostra o tempo imediatamente ao clicar (sem esperar 1 segundo)
  updateDisplay();

  // A cada 1 segundo: decrementa o tempo, atualiza o display ou encerra e toca o alarme
  countdown = setInterval(() => {
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(countdown);
      // Toca o som de alarme
      currentAlarm = new Audio("assets/sounds/alarm.mp3");
      currentAlarm.loop = true; // toca em loop até o usuário clicar em Fechar
      currentAlarm.play();
      // Mostra o modal com o GIF e a mensagem "Sua gema está pronta!"
      document.getElementById("ready-modal").classList.add("is-open");
      document.getElementById("ready-modal").setAttribute("aria-hidden", "false");
      return;
    }
    updateDisplay();
  }, 1000);
}

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
}
