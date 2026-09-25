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
       Parte 1–4/20 — Helpers, Skills, Frentes, Marcos, Mídias,
                     Pontos de Virada, Feedback, Derivados, Snapshots
       ============================================================ */
    const pratica = (function () {

        // -------- Chaves internas --------
        const K = {
            SKILLS:        "pratica_skills",
            SNAPSHOTS:     "pratica_snapshots_mensais",
            CONTEXTO_DIA:  "treinador_contexto_",
            BLOCOS_PREFIX: "estudo_",
            BLOCOS_SUFIX:  "_pratica_blocos"
        };

        // -------- Helpers de data --------
        function agoraISO() {
            return new Date().toISOString();
        }

        function diasEntre(dataA, dataB) {
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

        // ============================================================
        // SKILLS (CRUD)
        // ============================================================
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
                    fase: dados.fase || "treinando",
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
            },

            // -------- Mídias --------
            adicionarMidia(skillId, dados = {}) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const nova = {
                    id: dados.id || gerarId("md"),
                    tipo: dados.tipo || "video",
                    origem: dados.origem || "manual",
                    url: dados.url || "",
                    fileId: dados.fileId || "",
                    nome: dados.nome || "",
                    nota: dados.nota || "",
                    data: dados.data || dataHoje(),
                    frente: dados.frente || null,
                    contexto: dados.contexto || "geral"
                };
                lista[i].midias = lista[i].midias || [];
                lista[i].midias.push(nova);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return nova;
            },

            atualizarMidia(skillId, midiaId, patch) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const j = (lista[i].midias || []).findIndex(m => m.id === midiaId);
                if (j < 0) return null;
                lista[i].midias[j] = { ...lista[i].midias[j], ...patch };
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return lista[i].midias[j];
            },

            removerMidia(skillId, midiaId) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return;
                lista[i].midias = (lista[i].midias || []).filter(m => m.id !== midiaId);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
            },

            listarMidias(skillId, filtro = {}) {
                const skill = this.ler(skillId);
                if (!skill) return [];
                let arr = skill.midias || [];
                if (filtro.contexto) arr = arr.filter(m => m.contexto === filtro.contexto);
                if (filtro.frente)   arr = arr.filter(m => m.frente === filtro.frente);
                if (filtro.tipo)     arr = arr.filter(m => m.tipo === filtro.tipo);
                return arr.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
            },

            definirAntesDepois(skillId, antesId, depoisId) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return;
                (lista[i].midias || []).forEach(m => {
                    if (m.id === antesId)  m.contexto = "antes";
                    if (m.id === depoisId) m.contexto = "depois";
                });
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
            },

            // -------- Pontos de virada --------
            adicionarPontoVirada(skillId, dados = {}) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const novo = {
                    id: dados.id || gerarId("pv"),
                    data: dados.data || dataHoje(),
                    frente: dados.frente || null,
                    texto: dados.texto || "",
                    sessao_id: dados.sessao_id || null,
                    criado_em: agoraISO()
                };
                lista[i].pontos_de_virada = lista[i].pontos_de_virada || [];
                lista[i].pontos_de_virada.push(novo);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return novo;
            },

            atualizarPontoVirada(skillId, pvId, patch) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const j = (lista[i].pontos_de_virada || []).findIndex(p => p.id === pvId);
                if (j < 0) return null;
                lista[i].pontos_de_virada[j] = { ...lista[i].pontos_de_virada[j], ...patch };
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return lista[i].pontos_de_virada[j];
            },

            removerPontoVirada(skillId, pvId) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return;
                lista[i].pontos_de_virada = (lista[i].pontos_de_virada || []).filter(p => p.id !== pvId);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
            },

            listarPontosVirada(skillId) {
                const skill = this.ler(skillId);
                if (!skill) return [];
                return (skill.pontos_de_virada || [])
                    .slice()
                    .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
            },

            // -------- Feedback --------
            adicionarFeedback(skillId, dados = {}) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const novo = {
                    id: dados.id || gerarId("fb"),
                    data: dados.data || dataHoje(),
                    fonte: dados.fonte || "auto",
                    nota: dados.nota || "amarelo",
                    texto: dados.texto || "",
                    frente: dados.frente || null,
                    criado_em: agoraISO()
                };
                lista[i].feedback = lista[i].feedback || [];
                lista[i].feedback.push(novo);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return novo;
            },

            atualizarFeedback(skillId, fbId, patch) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return null;
                const j = (lista[i].feedback || []).findIndex(f => f.id === fbId);
                if (j < 0) return null;
                lista[i].feedback[j] = { ...lista[i].feedback[j], ...patch };
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
                return lista[i].feedback[j];
            },

            removerFeedback(skillId, fbId) {
                const lista = _lerTodasSkills();
                const i = _idxSkill(lista, skillId);
                if (i < 0) return;
                lista[i].feedback = (lista[i].feedback || []).filter(f => f.id !== fbId);
                lista[i].atualizado_em = agoraISO();
                _salvarTodasSkills(lista);
            },

            listarFeedback(skillId, filtro = {}) {
                const skill = this.ler(skillId);
                if (!skill) return [];
                let arr = (skill.feedback || []).slice();
                if (filtro.fonte) arr = arr.filter(f => f.fonte === filtro.fonte);
                return arr.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
            }
        };

        // ============================================================
        // DERIVADOS — nunca salvos, calculados na hora
        // ============================================================

        function _lerBlocosPratica(data) {
            return lerJSONLocal(`${K.BLOCOS_PREFIX}${data}${K.BLOCOS_SUFIX}`, []);
        }

        function _listarTodosBlocosPratica() {
            const out = [];
            const prefixo = `${K.BLOCOS_PREFIX}`;
            const sufixo = `${K.BLOCOS_SUFIX}`;
            for (let i = 0; i < localStorage.length; i++) {
                const chave = localStorage.key(i);
                if (!chave.startsWith(prefixo) || !chave.endsWith(sufixo)) continue;
                const data = chave.slice(prefixo.length, chave.length - sufixo.length);
                const blocosArr = lerJSONLocal(chave, []);
                blocosArr.forEach(b => out.push({ ...b, data }));
            }
            return out;
        }

        function _temperaturaPorFrente(skill, frenteId) {
            const blocosArr = _listarTodosBlocosPratica().filter(b =>
                b.skillId === skill.id && b.frenteId === frenteId
            );
            if (!blocosArr.length) return { emoji: "🆕", label: "nova", dias: null };

            const ultima = blocosArr
                .map(b => b.data)
                .sort()
                .reverse()[0];

            const dias = diasEntre(ultima, dataHoje());

            let emoji, label;
            if (dias <= 3)       { emoji = "🔥"; label = "quente"; }
            else if (dias <= 14) { emoji = "🌤"; label = "morna"; }
            else if (dias <= 30) { emoji = "❄️"; label = "fria"; }
            else                 { emoji = "🧊"; label = "congelada"; }

            return { emoji, label, dias, ultima };
        }

        function _temperaturaGeral(skill) {
            if (!skill.frentes.length) return { emoji: "🆕", label: "nova", dias: null };
            const temps = skill.frentes.map(f => _temperaturaPorFrente(skill, f.id));
            return temps
                .filter(t => t.dias !== null)
                .sort((a, b) => a.dias - b.dias)[0]
                || { emoji: "🆕", label: "nova", dias: null };
        }

        function _gapPorFrente(skill, frente) {
            const marcoId = frente.marco_ativo;
            if (!marcoId || !skill.marcos[marcoId]) return null;
            const pct = Number(skill.marcos[marcoId].percentual) || 0;
            return Math.max(0, 100 - pct);
        }

        function _gapGeral(skill) {
            const gaps = skill.frentes
                .map(f => _gapPorFrente(skill, f))
                .filter(g => g !== null);
            if (!gaps.length) return null;
            return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        }

        function _streak(skill) {
            const datas = [...new Set(
                _listarTodosBlocosPratica()
                    .filter(b => b.skillId === skill.id)
                    .map(b => b.data)
            )].sort().reverse();

            if (!datas.length) return { atual: 0, recorde: 0, ultima: null };

            const hoje = dataHoje();
            const ontem = (() => {
                const d = new Date(); d.setDate(d.getDate() - 1);
                return d.toISOString().slice(0, 10);
            })();

            let atual = 0;
            if (datas[0] === hoje || datas[0] === ontem) {
                atual = 1;
                for (let i = 1; i < datas.length; i++) {
                    const diff = diasEntre(datas[i], datas[i - 1]);
                    if (diff === 1) atual++;
                    else break;
                }
            }

            let recorde = 0, seq = 1;
            for (let i = 1; i < datas.length; i++) {
                const diff = diasEntre(datas[i], datas[i - 1]);
                if (diff === 1) seq++;
                else { recorde = Math.max(recorde, seq); seq = 1; }
            }
            recorde = Math.max(recorde, seq, atual);

            return { atual, recorde, ultima: datas[0] };
        }

        function _qualidadeMedia(skill, opts = {}) {
            let blocosArr = _listarTodosBlocosPratica().filter(b => b.skillId === skill.id);
            if (opts.frenteId) blocosArr = blocosArr.filter(b => b.frenteId === opts.frenteId);
            if (opts.ultimosDias) {
                const corte = new Date();
                corte.setDate(corte.getDate() - opts.ultimosDias);
                const corteStr = corte.toISOString().slice(0, 10);
                blocosArr = blocosArr.filter(b => b.data >= corteStr);
            }
            const comQ = blocosArr.filter(b => typeof b.qualidade === "number");
            if (!comQ.length) return null;
            return Math.round((comQ.reduce((a, b) => a + b.qualidade, 0) / comQ.length) * 100) / 100;
        }

        function _totais(skill) {
            const blocosArr = _listarTodosBlocosPratica().filter(b => b.skillId === skill.id);
            const tempo = blocosArr.reduce((a, b) => a + (Number(b.tempo_real_min) || 0), 0);
            return {
                sessoes: blocosArr.length,
                tempo_total_min: tempo,
                marcos_fechados: Object.values(skill.marcos || {}).filter(m => m.percentual >= 100).length,
                pontos_virada: (skill.pontos_de_virada || []).length,
                feedbacks_externos: (skill.feedback || []).filter(f => f.fonte !== "auto").length
            };
        }

        function _nivelPorFrente(skill, frente) {
            const marcosFrente = (frente.marcos || [])
                .map(id => skill.marcos[id])
                .filter(Boolean);
            const fechados = marcosFrente.filter(m => m.percentual >= 100).length;
            const regra = skill.config?.regra_nivel || { artesao: 3, mestre: 8, lenda: 15 };

            if (fechados >= regra.lenda)   return "lenda";
            if (fechados >= regra.mestre)  return "mestre";
            if (fechados >= regra.artesao) return "artesao";
            return "aprendiz";
        }

        function _nivelGeral(skill) {
            const niveis = skill.frentes.map(f => _nivelPorFrente(skill, f));
            const ordem = { aprendiz: 0, artesao: 1, mestre: 2, lenda: 3 };
            const melhor = niveis.sort((a, b) => ordem[b] - ordem[a])[0] || "aprendiz";
            return { nivel: melhor };
        }

        function _snapshotSkill(skill) {
            const frentes = {};
            skill.frentes.forEach(f => {
                frentes[f.id] = {
                    nome: f.nome,
                    gap: _gapPorFrente(skill, f),
                    temperatura: _temperaturaPorFrente(skill, f),
                    nivel: _nivelPorFrente(skill, f)
                };
            });

            const t = _totais(skill);
            const s = _streak(skill);

            return {
                nivel: _nivelGeral(skill).nivel,
                frentes_gap: Object.fromEntries(
                    Object.entries(frentes).map(([id, f]) => [f.nome, f.gap])
                ),
                marcos_fechados_total: t.marcos_fechados,
                pontos_virada_total: t.pontos_virada,
                feedbacks_externos: t.feedbacks_externos,
                streak_atual: s.atual,
                streak_recorde: s.recorde,
                tempo_total_min: t.tempo_total_min,
                sessoes_total: t.sessoes,
                qualidade_media: _qualidadeMedia(skill),
                temperatura_geral: _temperaturaGeral(skill).emoji,
                gap_medio: _gapGeral(skill)
            };
        }

        const derivados = {
            temperaturaPorFrente: _temperaturaPorFrente,
            temperaturaGeral:     _temperaturaGeral,
            gapPorFrente:         _gapPorFrente,
            gapGeral:             _gapGeral,
            streak:               _streak,
            qualidadeMedia:       _qualidadeMedia,
            totais:               _totais,
            nivelPorFrente:       _nivelPorFrente,
            nivelGeral:           _nivelGeral,
            snapshotSkill:        _snapshotSkill,

            visaoCompleta(skillId) {
                const skill = skills.ler(skillId);
                if (!skill) return null;
                return {
                    ...skill,
                    _derivados: _snapshotSkill(skill)
                };
            },

            listarComDerivados() {
                return skills.listar().map(s => ({
                    ...s,
                    _derivados: _snapshotSkill(s)
                }));
            }
        };

        // ============================================================
        // SNAPSHOTS MENSAIS
        // ============================================================
        const snapshots = {
            listar() {
                return lerJSONLocal(K.SNAPSHOTS, []);
            },

            ler(mes) {
                return this.listar().find(s => s.mes === mes) || null;
            },

            tirar(mes = null) {
                const alvo = mes || dataHoje().slice(0, 7);
                const lista = this.listar();
                if (lista.some(s => s.mes === alvo)) {
                    return lista.find(s => s.mes === alvo);
                }

                const todasSkills = skills.listar();
                const skillsSnap = {};
                todasSkills.forEach(s => {
                    skillsSnap[s.id] = _snapshotSkill(s);
                });

                const totalGlobal = {
                    sessoes: 0,
                    tempo_min: 0,
                    marcos_fechados: 0,
                    pontos_virada: 0,
                    skills_ativas: 0,
                    skills_congeladas: 0
                };

                Object.values(skillsSnap).forEach(sn => {
                    totalGlobal.sessoes        += sn.sessoes_total;
                    totalGlobal.tempo_min      += sn.tempo_total_min;
                    totalGlobal.marcos_fechados += sn.marcos_fechados_total;
                    totalGlobal.pontos_virada  += sn.pontos_virada_total;
                    if (sn.temperatura_geral === "🧊") totalGlobal.skills_congeladas++;
                    else                                totalGlobal.skills_ativas++;
                });

                const novo = {
                    mes: alvo,
                    skills: skillsSnap,
                    total_global: totalGlobal,
                    criado_em: agoraISO()
                };
                lista.push(novo);
                salvarJSONLocal(K.SNAPSHOTS, lista);
                return novo;
            },

            remover(mes) {
                const lista = this.listar().filter(s => s.mes !== mes);
                salvarJSONLocal(K.SNAPSHOTS, lista);
            }
        };

        // -------- API pública básica --------
        return {
            K,
            dataHoje,
            agoraISO,
            diasEntre,
            gerarId,
            lerJSON: lerJSONLocal,
            salvarJSON: salvarJSONLocal,
            suporta,
            skills,
            derivados,
            snapshots,
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
