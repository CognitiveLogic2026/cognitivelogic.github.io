const API_URL = "https://api.cognitivelogic.it/analyze";

const inputEl = document.getElementById("chat-input");
const analyzeBtn = document.getElementById("analyze-btn");
const clearBtn = document.getElementById("clear-btn");
const statusLine = document.getElementById("status-line");

const decisionBox = document.getElementById("decision-box");
const riskLevelEl = document.getElementById("risk-level");
const riskScoreEl = document.getElementById("risk-score");
const summaryEl = document.getElementById("summary");
const gapsListEl = document.getElementById("gaps-list");
const recommendationsListEl = document.getElementById("recommendations-list");
const rawOutputEl = document.getElementById("raw-output");

function setList(element, items) {
  if (!Array.isArray(items) || items.length === 0) {
    element.innerHTML = "<li>Nessun elemento rilevato.</li>";
    return;
  }

  element.innerHTML = items.map(item => `<li>${escapeHtml(String(item))}</li>`).join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDecisionText(riskLevel) {
  const level = String(riskLevel || "").toUpperCase();

  if (level === "HIGH") {
    return "🔴 CRITICAL — intervento immediato richiesto";
  }

  if (level === "MEDIUM") {
    return "🟠 ACTION REQUIRED — implementare controlli mancanti";
  }

  if (level === "LOW") {
    return "🟢 MONITOR — sistema gestibile con controlli base";
  }

  return "Valutazione disponibile, ma livello non classificato";
}

function resetOutput() {
  decisionBox.textContent = "In attesa di analisi";
  riskLevelEl.textContent = "—";
  riskScoreEl.textContent = "—";
  summaryEl.textContent = "Nessuna analisi ancora eseguita.";
  gapsListEl.innerHTML = "<li>—</li>";
  recommendationsListEl.innerHTML = "<li>—</li>";
  rawOutputEl.textContent = "In attesa di risposta backend.";
  statusLine.textContent = "Scrivi una descrizione e avvia l’analisi.";
}

async function sendMessage() {
  const text = inputEl.value.trim();

  if (!text) {
    statusLine.textContent = "Inserisci una descrizione del sistema AI.";
    inputEl.focus();
    return;
  }

  analyzeBtn.disabled = true;
  clearBtn.disabled = true;

  statusLine.textContent = "Analisi in corso...";
  decisionBox.textContent = "Elaborazione...";
  riskLevelEl.textContent = "...";
  riskScoreEl.textContent = "...";
  summaryEl.textContent = "Il backend sta elaborando la richiesta.";
  gapsListEl.innerHTML = "<li>Analisi in corso...</li>";
  recommendationsListEl.innerHTML = "<li>Analisi in corso...</li>";
  rawOutputEl.textContent = "Richiesta inviata a " + API_URL;

  const payload = {
    system: text,
    context: "EU"
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "Errore backend");
    }

    const riskLevel = data.risk_level || data.level || "UNKNOWN";
    const riskScore =
      data.risk_score ??
      data.qen_score ??
      data.score ??
      "N/A";

    const summary =
      data.summary ||
      data.reasoning ||
      data.message ||
      "Analisi completata.";

    const gaps = Array.isArray(data.gaps)
      ? data.gaps
      : Array.isArray(data.missing_controls)
      ? data.missing_controls
      : [];

    const recommendations = Array.isArray(data.recommendations)
      ? data.recommendations
      : Array.isArray(data.actions)
      ? data.actions
      : [];

    decisionBox.textContent = getDecisionText(riskLevel);
    riskLevelEl.textContent = String(riskLevel).toUpperCase();
    riskScoreEl.textContent = String(riskScore);
    summaryEl.textContent = summary;

    setList(gapsListEl, gaps);
    setList(recommendationsListEl, recommendations);

    rawOutputEl.textContent = JSON.stringify(data, null, 2);
    statusLine.textContent = "Analisi completata.";
  } catch (error) {
    decisionBox.textContent = "Errore durante l’analisi";
    riskLevelEl.textContent = "ERROR";
    riskScoreEl.textContent = "—";
    summaryEl.textContent =
      "Non è stato possibile ottenere una risposta valida dal backend.";
    gapsListEl.innerHTML = "<li>Controlla endpoint, CORS o risposta API.</li>";
    recommendationsListEl.innerHTML =
      "<li>Verifica che /analyze sia attivo e raggiungibile.</li>";

    rawOutputEl.textContent = String(error);
    statusLine.textContent = "Errore: " + error.message;
  } finally {
    analyzeBtn.disabled = false;
    clearBtn.disabled = false;
  }
}

analyzeBtn.addEventListener("click", sendMessage);

clearBtn.addEventListener("click", () => {
  inputEl.value = "";
  resetOutput();
  inputEl.focus();
});

inputEl.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    sendMessage();
  }
});

resetOutput();
