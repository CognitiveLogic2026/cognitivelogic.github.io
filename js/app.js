const API_URL = "https://api.cognitivelogic.it/analyze";
const PDF_URL = "https://api.cognitivelogic.it/export-pdf";

const inputEl = document.getElementById("chat-input");
const analyzeBtn = document.getElementById("analyze-btn");
const clearBtn = document.getElementById("clear-btn");
const pdfBtn = document.getElementById("pdf-btn");
const statusLine = document.getElementById("status-line");

const decisionBox = document.getElementById("decision-box");
const riskLevelEl = document.getElementById("risk-level");
const riskScoreEl = document.getElementById("risk-score");
const whyEl = document.getElementById("why");
const impactEl = document.getElementById("impact");
const summaryEl = document.getElementById("summary");
const euClassificationEl = document.getElementById("eu-classification");
const gapsListEl = document.getElementById("gaps-list");
const recommendationsListEl = document.getElementById("recommendations-list");
const rawOutputEl = document.getElementById("raw-output");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setList(element, items) {
  if (!Array.isArray(items) || items.length === 0) {
    element.innerHTML = "<li>Nessun elemento rilevato.</li>";
    return;
  }

  element.innerHTML = items
    .map(item => `<li>${escapeHtml(String(item))}</li>`)
    .join("");
}

function setDecisionUI(level, fallbackText = "") {
  decisionBox.classList.remove("decision-high", "decision-medium", "decision-low");

  if (level === "HIGH") {
    decisionBox.classList.add("decision-high");
    decisionBox.innerText = fallbackText || "🔴 CRITICAL — intervento immediato richiesto";
  } else if (level === "MEDIUM") {
    decisionBox.classList.add("decision-medium");
    decisionBox.innerText = fallbackText || "🟠 ACTION REQUIRED — controlli mancanti";
  } else {
    decisionBox.classList.add("decision-low");
    decisionBox.innerText = fallbackText || "🟢 MONITOR — rischio contenuto";
  }
}

function resetOutput() {
  setDecisionUI("LOW", "In attesa di analisi");
  riskLevelEl.textContent = "—";
  riskScoreEl.textContent = "—";
  whyEl.textContent = "—";
  impactEl.textContent = "—";
  summaryEl.textContent = "Nessuna analisi ancora eseguita.";
  euClassificationEl.textContent = "—";

  gapsListEl.innerHTML = "<li>—</li>";
  recommendationsListEl.innerHTML = "<li>—</li>";

  const euObligations = document.getElementById("eu-obligations");
  const euControls = document.getElementById("eu-controls");
  const euRegulatoryObligations = document.getElementById("eu-regulatory-obligations");
  const euArticles = document.getElementById("eu-articles");

  if (euObligations) euObligations.innerHTML = "<li>—</li>";
  if (euControls) euControls.innerHTML = "<li>—</li>";
  if (euRegulatoryObligations) euRegulatoryObligations.innerHTML = "<li>—</li>";
  if (euArticles) euArticles.innerHTML = "—";

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
  pdfBtn.disabled = true;

  statusLine.textContent = "Analisi in corso...";
  decisionBox.textContent = "Elaborazione...";
  riskLevelEl.textContent = "...";
  riskScoreEl.textContent = "...";
  whyEl.textContent = "Il backend sta elaborando i segnali rilevati.";
  impactEl.textContent = "Valutazione impatto in corso.";
  summaryEl.textContent = "Il backend sta elaborando la richiesta.";
  euClassificationEl.textContent = "N/A";
  gapsListEl.innerHTML = "<li>Analisi in corso...</li>";
  recommendationsListEl.innerHTML = "<li>Analisi in corso...</li>";
  rawOutputEl.textContent = "Richiesta inviata a " + API_URL;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system: text,
        context: "EU"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "Errore backend");
    }

    const riskLevel = data.risk_level || "LOW";
    const riskScore = data.risk_score ?? "—";
    const summary = data.summary || "Analisi completata.";
    const gaps = Array.isArray(data.gaps) ? data.gaps : [];
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

    let why = data.why;
    if (!why) {
      if (gaps.length > 0) {
        why = "Il sistema presenta segnali di rischio legati ai controlli o ai dati indicati.";
      } else {
        why = "Non sono emersi gap significativi nella descrizione fornita.";
      }
    }

    let impact = data.impact;
    if (!impact) {
      if (riskLevel === "HIGH") {
        impact = "Il sistema richiede interventi rapidi prima di essere presentato come iniziativa conforme.";
      } else if (riskLevel === "MEDIUM") {
        impact = "Il sistema può evolvere con controlli aggiuntivi e maggiore tracciabilità.";
      } else {
        impact = "Il sistema appare gestibile, con monitoraggio e controlli di base.";
      }
    }

    let decision = data.decision;
    if (!decision) {
      if (riskLevel === "HIGH") {
        decision = "🔴 CRITICAL — intervento immediato richiesto";
      } else if (riskLevel === "MEDIUM") {
        decision = "🟠 ACTION REQUIRED — controlli mancanti";
      } else {
        decision = "🟢 MONITOR — rischio contenuto";
      }
    }

    setDecisionUI(riskLevel, decision);
    riskLevelEl.textContent = String(riskLevel).toUpperCase();
    riskScoreEl.textContent = String(riskScore);
    whyEl.textContent = why;
    impactEl.textContent = impact;
    summaryEl.textContent = summary;
    euClassificationEl.textContent = data.eu_classification || "Non disponibile";

    setList(gapsListEl, gaps);
    setList(recommendationsListEl, recommendations);

    rawOutputEl.textContent = JSON.stringify(data, null, 2);
    statusLine.textContent = "Analisi completata.";
  } catch (error) {
    setDecisionUI("HIGH", "Errore durante l’analisi");
    riskLevelEl.textContent = "ERROR";
    riskScoreEl.textContent = "—";
    whyEl.textContent = "Non è stato possibile interpretare correttamente la richiesta.";
    impactEl.textContent = "Analisi interrotta per errore backend o di rete.";
    summaryEl.textContent = "Non è stato possibile ottenere una risposta valida dal backend.";
    euClassificationEl.textContent = "—";
    gapsListEl.innerHTML = "<li>Controlla endpoint, CORS o risposta API.</li>";
    recommendationsListEl.innerHTML = "<li>Verifica che /analyze sia attivo e raggiungibile.</li>";
    rawOutputEl.textContent = String(error);
    statusLine.textContent = "Errore: " + error.message;
  } finally {
    analyzeBtn.disabled = false;
    clearBtn.disabled = false;
    pdfBtn.disabled = false;
  }
}

async function exportPdf() {
  const text = inputEl.value.trim();

  if (!text) {
    statusLine.textContent = "Inserisci una descrizione prima di esportare il PDF.";
    inputEl.focus();
    return;
  }

  pdfBtn.disabled = true;
  analyzeBtn.disabled = true;
  clearBtn.disabled = true;
  statusLine.textContent = "Generazione PDF executive in corso...";

  try {
    const response = await fetch(PDF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system: text,
        context: "EU"
      })
    });

    if (!response.ok) {
      throw new Error("Errore nella generazione del PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "cognitive-logic-executive-report.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
    statusLine.textContent = "PDF executive generato correttamente.";
  } catch (error) {
    statusLine.textContent = "Errore PDF: " + error.message;
  } finally {
    pdfBtn.disabled = false;
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

pdfBtn.addEventListener("click", exportPdf);

inputEl.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    sendMessage();
  }
});

resetOutput();
window.sendMessage = sendMessage;
