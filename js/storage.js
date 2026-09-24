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
       Parte 1/20 — Helpers, chaves, IDs, persistência crua
       ============================================================ */
    const pratica = (function () {

        // -------- Chaves internas --------
        const K = {
            SKILLS:        "pratica_skills",
            SNAPSHOTS:     "pratica_snapshots_mensais",
            CONTEXTO_DIA:  "treinador_contexto_",   // + YYYY-MM-DD
            BLOCOS_PREFIX: "estudo_",               // estudo_<data>_pratica_blocos
            BLOCOS_SUFIX:  "_pratica_blocos"
        };

        // -------- Helpers de data --------
        // (usa o dataHoje do escopo externo — já definido no topo do IIFE)

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
        function lerJSONLocal(chave, fallback) {
            try {
                const raw = localStorage.getItem(chave);
                if (!raw) return fallback;
                return JSON.parse(raw);
            } catch (e) {
                console.warn("[Storage.pratica] falha ao ler", chave, e);
                return fallback;
            }
        }

        function salvarJSONLocal(chave, valor) {
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

        // -------- SKILLS (CRUD) --------
        function _lerTodasSkills() {
            return lerJSONLocal(K.SKILLS, []);
        }

        function _salvarTodasSkills(lista) {
            return salvarJSONLocal(K.SKILLS, lista);
        }

        function _idxSkill(lista, id) {
            return lista.findIndex(s => s.id === id);
        }

        const skills = {
            listar() {
                return _lerTodasSkills();
            },

            listarAtivas() {
                return _lerTodasSkills().filter(s => !s.arquivada);
            },

            ler(id) {
                return _lerTodasSkills().find(s => s.id === id) || null;
            },

            criar(dados = {}) {
                const lista = _lerTodasSkills();
                const nova = {
                    id: dados.id || gerarId("skill"),
                    nome: dados.nome || "",
                    icone: dados.icone || "🛠️",
                    area: dados.area || "estudo",
                    norte: {
                        objetivo_final: dados.norte?.objetivo_final || "",
                        frase: dados.norte?.frase || ""
                    },
                    frentes: dados.frentes || [],
                    marcos: dados.marcos || {},
                    midias: [],
                    pontos_de_virada: [],
                    feedback: [],
                    config: {
                        nivel: dados.config?.nivel || "aprendiz",
                        regra_nivel: dados.config?.regra_nivel || { artesao: 3, mestre: 8, lenda: 15 },
                        template_area_origem: dados.config?.template_area_origem || dados.area || "estudo"
                    },
                    arquivada: false,
                    criado_em: agoraISO(),
                    atualizado_em: agoraISO()
                };
                lista.push(nova);
                _salvarTodasSkills(lista);
                return nova;
            },

            atualizar(id, patch) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, id);
                if (i < 0) return null;
                lista[i] = { ...lista[i], ...patch, atualizado_em: agoraISO() };
                _salvarTodasSkills(lista);
                return lista[i];
            },

            remover(id) {
                const lista = _lerTodasSkills().filter(s => s.id !== id);
                _salvarTodasSkills(lista);
            },

            arquivar(id) {
                return this.atualizar(id, { arquivada: true });
            },

            desarquivar(id) {
                return this.atualizar(id, { arquivada: false });
            },

            // -------- Frentes --------
            adicionarFrente(skillId, dados = {}) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const nova = {
                    id: dados.id || gerarId("fr"),
                    nome: dados.nome || "",
                    icone: dados.icone || "🎯",
                    fase: dados.fase || "aprendendo",
                    modo_sessao: dados.modo_sessao || "tempo",
                    marco_ativo: dados.marco_ativo || null,
                    marcos: dados.marcos || [],
                    arquivada: false,
                    criado_em: agoraISO()
                };
                lista[i].frentes.push(nova);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return nova;
            },

            atualizarFrente(skillId, frenteId, patch) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const j = lista[i].frentes.findIndex(f => f.id === frenteId);
                if (j < 0) return null;
                lista[i].frentes[j] = { ...lista[i].frentes[j], ...patch };
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return lista[i].frentes[j];
            },

            removerFrente(skillId, frenteId) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return;
                lista[i].frentes = lista[i].frentes.filter(f => f.id !== frenteId);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
            },

            // -------- Marcos --------
            adicionarMarco(skillId, dados = {}) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const novo = {
                    id: dados.id || gerarId("mc"),
                    titulo: dados.titulo || "",
                    frente: dados.frente || null,
                    percentual: dados.percentual || 0,
                    peso: dados.peso || 3,
                    data_inicio: dados.data_inicio || dataHoje(),
                    data_fim: null,
                    prerequisito: dados.prerequisito || null,
                    entregavel: dados.entregavel || null
                };
                lista[i].marcos[novo.id] = novo;
                const j = lista[i].frentes.findIndex(f => f.id === novo.frente);
                if (j >= 0 && !lista[i].frentes[j].marcos.includes(novo.id)) {
                    lista[i].frentes[j].marcos.push(novo.id);
                    if (!lista[i].frentes[j].marco_ativo) {
                        lista[i].frentes[j].marco_ativo = novo.id;
                    }
                }
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return novo;
            },

            atualizarMarco(skillId, marcoId, patch) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0 || !lista[i].marcos[marcoId]) return null;
                lista[i].marcos[marcoId] = { ...lista[i].marcos[marcoId], ...patch };
                if (patch.percentual >= 100 && !lista[i].marcos[marcoId].data_fim) {
                    lista[i].marcos[marcoId].data_fim = dataHoje();
                }
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return lista[i].marcos[marcoId];
            },

            removerMarco(skillId, marcoId) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return;
                delete lista[i].marcos[marcoId];
                lista[i].frentes.forEach(f => {
                    f.marcos = f.marcos.filter(m => m !== marcoId);
                    if (f.marco_ativo === marcoId) {
                        f.marco_ativo = f.marcos[0] || null;
                    }
                });
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
            },

            definirMarcoAtivo(skillId, frenteId, marcoId) {
                return this.atualizarFrente(skillId, frenteId, { marco_ativo: marcoId });
            }
        };

        // -------- API pública básica --------
        return {
            K,
            dataHoje,          // herdado do escopo externo
            agoraISO,
            diasEntre,
            gerarId,
            lerJSON: lerJSONLocal,
            salvarJSON: salvarJSONLocal,
            suporta,
            skills,
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
        pratica,
        migrar,
        K,
    };
})();
