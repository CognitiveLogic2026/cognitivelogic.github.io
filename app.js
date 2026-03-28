async function sendMessage() {
  const input = document.getElementById("chat-input");
  const output = document.getElementById("chat-output");
  const statusText = document.getElementById("status-text");

  const text = input.value.trim();

  if (!text) {
    output.className = "output-placeholder";
    output.innerHTML = "Inserisci una descrizione del sistema AI.";
    statusText.textContent = "Manca la descrizione del sistema.";
    return;
  }

  statusText.textContent = "Analisi in corso...";
  output.className = "output-placeholder";
  output.innerHTML = "Sto analizzando il sistema...";

  const payload = {
    system: text,
    context: "EU"
  };

  try {
    const response = await fetch("https://api.cognitivelogic.it/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Errore API");
    }

    const data = await response.json();

    const riskLevel = data.risk_level || "UNKNOWN";
    const riskScore = data.risk_score ?? data.qen_score ?? "-";
    const summary = data.summary || "Nessuna sintesi disponibile.";
    const gaps = Array.isArray(data.gaps) ? data.gaps : [];
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

    let decision = "";
    if (riskLevel === "HIGH") {
      decision = "🔴 BLOCK — intervento immediato richiesto";
    } else if (riskLevel === "MEDIUM") {
      decision = "🟠 ACTION REQUIRED — implementare controlli mancanti";
    } else if (riskLevel === "LOW") {
      decision = "🟢 MONITOR — sistema gestibile con controlli base";
    } else {
      decision = "⚪ REVIEW — classificazione da verificare";
    }

    output.className = "output-result";
    output.innerHTML = `
      <div class="result-top">
        <div class="result-risk">${riskLevel}</div>
        <div class="result-score">Risk score: ${riskScore}</div>
      </div>

      <div class="result-section">
        <h4>Sintesi</h4>
        <p>${summary}</p>
      </div>

      <div class="result-section">
        <h4>Decisione operativa</h4>
        <p>${decision}</p>
      </div>

      <div class="result-section">
        <h4>Gap rilevati</h4>
        ${
          gaps.length
            ? `<ul>${gaps.map(item => `<li>${item}</li>`).join("")}</ul>`
            : `<p>Nessun gap rilevato.</p>`
        }
      </div>

      <div class="result-section">
        <h4>Raccomandazioni</h4>
        ${
          recommendations.length
            ? `<ul>${recommendations.map(item => `<li>${item}</li>`).join("")}</ul>`
            : `<p>Nessuna raccomandazione disponibile.</p>`
        }
      </div>
    `;

    statusText.textContent = "Analisi completata.";
  } catch (error) {
    output.className = "output-placeholder";
    output.innerHTML = `Errore durante l’analisi: ${error.message}`;
    statusText.textContent = "Errore di connessione o risposta non valida.";
  }
}

document.getElementById('analyze-btn').addEventListener('click', sendMessage);
