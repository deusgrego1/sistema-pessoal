// ==================================================
// storage.js — Módulo único de persistência
// ==================================================
(function () {
    "use strict";

    const PREFIX = "estudo";

    function pad(n) { return String(n).padStart(2, "0"); }

    function dataHoje() {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function escapeHTML(s) {
        return String(s ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function lerJSON(chave, fallback) {
        try {
            const raw = localStorage.getItem(chave);
            if (!raw) return fallback;
            const v = JSON.parse(raw);
            return v ?? fallback;
        } catch { return fallback; }
    }

    function salvarJSON(chave, valor) {
        try { localStorage.setItem(chave, JSON.stringify(valor)); }
        catch (e) { console.warn("storage cheio?", e); }
    }

    // ---------- chaves ----------
    const K = {
        blocos:     (tipo, data) => `${PREFIX}_${data}_${tipo}_blocos`,
        biblioteca: (tipo)       => `biblioteca_${tipo}`,
        aprendizados: ()         => `aprendizados`,
    };

    // ---------- blocos do dia ----------
    const blocos = {
        ler(tipo, data) {
            return lerJSON(K.blocos(tipo, data), []);
        },
        salvar(tipo, data, arr) {
            salvarJSON(K.blocos(tipo, data), arr);
        },
    };

    // ---------- biblioteca ----------
    const biblioteca = {
        listar(tipo) {
            return lerJSON(K.biblioteca(tipo), []);
        },
        adicionar(tipo, item) {
            const lista = this.listar(tipo);
            const id = item.id;
            const idx = lista.findIndex(x => x.id === id);
            if (idx >= 0) {
                lista[idx] = { ...lista[idx], ...item, atualizadoEm: Date.now() };
            } else {
                item.criadoEm = item.criadoEm || Date.now();
                item.atualizadoEm = Date.now();
                lista.push(item);
            }
            salvarJSON(K.biblioteca(tipo), lista);
            return item;
        },
        atualizar(tipo, id, patch) {
            const lista = this.listar(tipo);
            const idx = lista.findIndex(x => x.id === id);
            if (idx >= 0) {
                lista[idx] = { ...lista[idx], ...patch, atualizadoEm: Date.now() };
                salvarJSON(K.biblioteca(tipo), lista);
            }
        },
        remover(tipo, id) {
            const lista = this.listar(tipo).filter(x => x.id !== id);
            salvarJSON(K.biblioteca(tipo), lista);
        },
    };

    // ---------- aprendizados ----------
    const aprendizados = {
        listar() { return lerJSON(K.aprendizados(), []); },
        adicionar(a) {
            const lista = this.listar();
            a.id = a.id || `ap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            a.criadoEm = a.criadoEm || Date.now();
            lista.push(a);
            salvarJSON(K.aprendizados(), lista);
            return a;
        },
        atualizar(id, patch) {
            const lista = this.listar();
            const idx = lista.findIndex(x => x.id === id);
            if (idx >= 0) {
                lista[idx] = { ...lista[idx], ...patch, atualizadoEm: Date.now() };
                salvarJSON(K.aprendizados(), lista);
            }
        },
        remover(id) {
            const lista = this.listar().filter(x => x.id !== id);
            salvarJSON(K.aprendizados(), lista);
        },
    };

/* ============================================================
   Storage.pratica — Módulo Prática
   Base: helpers, chaves, data
   ============================================================ */
Storage.pratica = (function () {

    // -------- Chaves internas --------
    const K = {
        SKILLS:        "pratica_skills",
        SNAPSHOTS:     "pratica_snapshots_mensais",
        CONTEXTO_DIA:  "treinador_contexto_",   // + YYYY-MM-DD
        BLOCOS_PREFIX: "estudo_",               // estudo_<data>_pratica_blocos
        BLOCOS_SUFIX:  "_pratica_blocos"
    };

    // -------- Helpers de data --------
    function dataHoje() {
        // Reaproveita o helper global, se existir
        if (typeof Storage.dataHoje === "function") return Storage.dataHoje();
        const d = new Date();
        const p = n => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    function agoraISO() {
        return new Date().toISOString();
    }

    function diasEntre(dataA, dataB) {
        // dataA e dataB: YYYY-MM-DD ou ISO
        const a = new Date(dataA).getTime();
        const b = new Date(dataB).getTime();
        return Math.floor(Math.abs(b - a) / 86400000);
    }

    // -------- Geração de IDs --------
    function gerarId(prefixo) {
        const ts = Date.now().toString(36);
        const rand = Math.random().toString(36).slice(2, 8);
        return `${prefixo}_${ts}${rand}`;
    }

    // -------- Leitura/escrita crua --------
    function lerJSON(chave, fallback) {
        try {
            const raw = localStorage.getItem(chave);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            console.warn("[Storage.pratica] falha ao ler", chave, e);
            return fallback;
        }
    }

    function salvarJSON(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch (e) {
            console.warn("[Storage.pratica] falha ao salvar", chave, e);
            return false;
        }
    }

    // -------- Suporte --------
    function suporta() {
        try {
            localStorage.setItem("__teste_pratica__", "1");
            localStorage.removeItem("__teste_pratica__");
            return true;
        } catch (e) {
            return false;
        }
    }

    // -------- API pública básica --------
    return {
        K,
        dataHoje,
        agoraISO,
        diasEntre,
        gerarId,
        lerJSON,
        salvarJSON,
        suporta,
        _versao: "1.0.0"
    };

})();
    
    // ---------- migração formato antigo → novo ----------
    function migrar() {
        const marcador = "storage_migrado_v1";
        if (localStorage.getItem(marcador)) return;

        const regex = /^planejamento_(\d{4}-\d{2}-\d{2})_estudo_(\d+)$/;
        const porData = {};

        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            const m = chave.match(regex);
            if (!m) continue;
            const [, data, idx] = m;
            if (!porData[data]) porData[data] = {};
            porData[data][idx] = localStorage.getItem(chave) || "";
        }

        Object.keys(porData).forEach(data => {
            const campos = porData[data];
            const temAlgo = Object.values(campos).some(v => v && v.trim());
            if (!temAlgo) return;

            const blocosAtuais = blocos.ler("livro", data);
            if (blocosAtuais.length > 0) return;

            blocos.salvar("livro", data, [{
                id: `blk_migr_${data}`,
                tema: campos[0] || "",
                titulo: "",
                autor: "",
                paginaAtual: "",
                totalPaginas: "",
                capitulo: "",
                metaHoje: "",
                tempoPrevisto: campos[3] || "",
                oQueAprendi: campos[1] || "",
                comoAplicar: "",
                proximaAcao: "",
                link: "",
                koodoId: "",
                status: "",
                criadoEm: Date.now(),
            }]);
        });

        localStorage.setItem(marcador, "1");
    }

    window.Storage = {
        dataHoje,
        escapeHTML,
        blocos,
        biblioteca,
        aprendizados,
        migrar,
        K,
    };
})();
