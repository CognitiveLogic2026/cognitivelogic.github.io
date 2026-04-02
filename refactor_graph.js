const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'graph.json');

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    const bolognaDistricts = [
      'Quadrilatero', 'Strada Maggiore', 'San Vitale', 'Saragozza', 
      'Murri', 'Corticella', 'Bolognina', 'Porto', 'Santo Stefano', 
      'Navile', 'San Donato', 'Reno', 'Savena', 'San Francesco', 'Mazzini', 'Pratello'
    ];

    data.nodes = data.nodes.map(node => {
      const isBolognaRelated = 
        node.type === 'PilotShop' || 
        (node.district && bolognaDistricts.includes(node.district)) ||
        (node.id && node.id.includes('bologna')) ||
        (node.id && node.id.includes('unesco')) ||
        (node.city && node.city === 'Bologna');

      if (isBolognaRelated) {
        node.locale = "it-IT";
        node.region = "Bologna";
        node.scope = "territorial";
      } else {
        node.locale = "global";
        node.region = "universal";
        node.scope = "core";
      }
      return node;
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("--------------------------------------------------");
    console.log("✅ REFACTORING SUCCESSFUL (Node v20.20.1)");
    console.log(`📍 File: ${filePath}`);
    console.log(`🌐 Global Nodes: ${data.nodes.filter(n => n.locale === 'global').length}`);
    console.log(`🇮🇹 Bologna Nodes: ${data.nodes.filter(n => n.locale === 'it-IT').length}`);
    console.log("--------------------------------------------------");
} catch (error) {
    console.error("❌ ERROR:", error.message);
}
