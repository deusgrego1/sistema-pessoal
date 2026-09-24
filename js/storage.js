localStorage.removeItem("pratica_skills");
localStorage.removeItem("pratica_snapshots_mensais");

// setup
const s = Storage.pratica.skills.criar({ nome: "Violão", area: "corpo" });
const f = Storage.pratica.skills.adicionarFrente(s.id, { nome: "técnica" });
const m = Storage.pratica.skills.adicionarMarco(s.id, { titulo: "Blackbird limpa", frente: f.id });
Storage.pratica.skills.atualizarMarco(s.id, m.id, { percentual: 62 });

// blocos fake (hoje e ontem)
const hoje = Storage.pratica.dataHoje();
const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
const ontemStr = ontem.toISOString().slice(0, 10);

Storage.blocos.salvar("pratica", hoje, [{ id:"b1", skillId:s.id, frenteId:f.id, tempo_real_min:25, qualidade:0.8 }]);
Storage.blocos.salvar("pratica", ontemStr, [{ id:"b2", skillId:s.id, frenteId:f.id, tempo_real_min:30, qualidade:0.7 }]);

// verificações
const v = Storage.pratica.derivados.visaoCompleta(s.id);
console.log("Gap médio:",        v._derivados.gap_medio);          // 38
console.log("Temperatura:",      v._derivados.temperatura_geral);  // 🔥
console.log("Streak atual:",     v._derivados.streak_atual);       // 2
console.log("Sessões:",          v._derivados.sessoes_total);      // 2
console.log("Tempo total (min):",v._derivados.tempo_total_min);    // 55
console.log("Nível:",            v._derivados.nivel);              // aprendiz

// snapshot
const snap = Storage.pratica.snapshots.tirar();
console.log("Snapshot:", snap.mes, "| skills:", Object.keys(snap.skills).length);

// limpar
localStorage.removeItem("pratica_skills");
localStorage.removeItem("pratica_snapshots_mensais");
localStorage.removeItem(`estudo_${hoje}_pratica_blocos`);
localStorage.removeItem(`estudo_${ontemStr}_pratica_blocos`);
console.log("Limpo:", Storage.pratica.skills.listar().length);     // 0
