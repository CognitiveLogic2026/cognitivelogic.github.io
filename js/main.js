async function askGemini(promptText) {
    // Se il file config.js (protetto) non è presente, lo chiediamo all'utente
    let apiKey = (typeof CONFIG !== 'undefined') ? CONFIG.API_KEY : null;
    
    if (!apiKey) {
        apiKey = prompt("Infrastruttura Protetta. Inserire API Key autorizzata:");
        if (!apiKey) return "Accesso negato.";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "Errore di connessione al nodo AI.";
    }
}
