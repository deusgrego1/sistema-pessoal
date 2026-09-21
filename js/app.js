document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // DATA (com suporte a navegação via ?data=YYYY-MM-DD)
    // ==================================================

    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataHoje = `${ano}-${mes}-${dia}`;

    const paramsURL = new URLSearchParams(window.location.search);
    const dataParam = paramsURL.get("data");

    const dataAtual =
        (dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam))
            ? dataParam
            : dataHoje;


    // ==================================================
    // IDENTIFICA A PÁGINA
    // ==================================================

    const pathname = window.location.pathname;

    const pagina = pathname
        .split("/")
        .pop()
        .replace(".html", "");


    // ==================================================
    // HELPER GLOBAL: COPIAR DO DIA ANTERIOR
    // ==================================================

    window.copiarDoDiaAnterior = function(paginaAlvo, dataRef) {

        const [a, m, d] = dataRef.split("-").map(Number);

        const dataObj = new Date(a, m - 1, d);

        dataObj.setDate(dataObj.getDate() - 1);

        const yAno = dataObj.getFullYear();
        const yMes = String(dataObj.getMonth() + 1).padStart(2, "0");
        const yDia = String(dataObj.getDate()).padStart(2, "0");

        const dataOntem = `${yAno}-${yMes}-${yDia}`;

        const prefixoOntem =
            `planejamento_${dataOntem}_${paginaAlvo}_`;

        const prefixoHoje =
            `planejamento_${dataRef}_${paginaAlvo}_`;

        let copiados = 0;

        Object.keys(localStorage).forEach(chave => {

            if (chave.startsWith(prefixoOntem)) {

                const sufixo =
                    chave.replace(prefixoOntem, "");

                localStorage.setItem(
                    prefixoHoje + sufixo,
                    localStorage.getItem(chave)
                );

                copiados++;
            }

        });

        return copiados;
    };


    // ==================================================
    // SALVAMENTO NORMAL
    // ==================================================

    if (pagina !== "historico") {

        const campos =
            document.querySelectorAll(
                "input, textarea, select"
            );


        campos.forEach((campo, indice) => {

            const chave =
                `planejamento_${dataAtual}_${pagina}_${indice}`;


            const salvo =
                localStorage.getItem(chave);


            if (salvo !== null) {

                if (campo.type === "checkbox") {

                    campo.checked =
                        salvo === "true";

                } else {

                    campo.value =
                        salvo;
                }
            }


            const salvar = () => {

                const valor =
                    campo.type === "checkbox"
                        ? campo.checked
                        : campo.value;


                localStorage.setItem(
                    chave,
                    valor
                );
            };


            campo.addEventListener(
                "input",
                salvar
            );


            campo.addEventListener(
                "change",
                salvar
            );

        });


        // ==================================================
        // COMPROMISSOS
        // ==================================================

        if (pagina === "visao") {

            const listaCompromissos =
                document.getElementById(
                    "listaCompromissos"
                );


            const btnAdicionar =
                document.getElementById(
                    "btnAdicionarCompromisso"
                );


            const chaveCompromissos =
                `planejamento_${dataAtual}_visao_compromissos`;


            // --------------------------------------------------
            // LER COMPROMISSOS SALVOS
            // --------------------------------------------------

            function obterCompromissos() {

                const salvo =
                    localStorage.getItem(
                        chaveCompromissos
                    );


                if (!salvo) {
                    return [];
                }


                try {

                    const dados =
                        JSON.parse(salvo);


                    if (Array.isArray(dados)) {
                        return dados;
                    }


                    return [];

                } catch {

                    return [];
                }
            }


            // --------------------------------------------------
            // SALVAR COMPROMISSOS
            // --------------------------------------------------

            function salvarCompromissos() {

                if (!listaCompromissos) {
                    return;
                }


                const blocos =
                    listaCompromissos.children;


                const compromissos = [];


                Array.from(blocos).forEach(bloco => {

                    const campos =
                        bloco.querySelectorAll(
                            "input, textarea"
                        );


                    if (campos.length < 5) {
                        return;
                    }


                    compromissos.push({

                        horario:
                            campos[0].value,

                        compromisso:
                            campos[1].value,

                        duracao:
                            campos[2].value,

                        local:
                            campos[3].value,

                        observacao:
                            campos[4].value

                    });

                });


                localStorage.setItem(
                    chaveCompromissos,
                    JSON.stringify(
                        compromissos
                    )
                );
            }


            // --------------------------------------------------
            // CARREGAR COMPROMISSOS
            // --------------------------------------------------

            function carregarCompromissos() {

                if (
                    !listaCompromissos ||
                    !btnAdicionar
                ) {
                    return;
                }


                const compromissos =
                    obterCompromissos();


                compromissos.forEach(dado => {

                    // Cria o bloco
                    btnAdicionar.click();


                    const blocos =
                        listaCompromissos.children;


                    const bloco =
                        blocos[
                            blocos.length - 1
                        ];


                    if (!bloco) {
                        return;
                    }


                    const campos =
                        bloco.querySelectorAll(
                            "input, textarea"
                        );


                    if (campos.length < 5) {
                        return;
                    }


                    campos[0].value =
                        dado.horario || "";


                    campos[1].value =
                        dado.compromisso || "";


                    campos[2].value =
                        dado.duracao || "";


                    campos[3].value =
                        dado.local || "";


                    campos[4].value =
                        dado.observacao || "";

                });

            }


            // --------------------------------------------------
            // SALVAR QUANDO DIGITAR
            // --------------------------------------------------

            if (listaCompromissos) {

                listaCompromissos.addEventListener(
                    "input",
                    salvarCompromissos
                );


                listaCompromissos.addEventListener(
                    "change",
                    salvarCompromissos
                );


                // Detecta adicionar/remover compromisso
                const observer =
                    new MutationObserver(() => {

                        setTimeout(
                            salvarCompromissos,
                            0
                        );

                    });


                observer.observe(
                    listaCompromissos,
                    {
                        childList: true
                    }
                );
            }


            // --------------------------------------------------
            // CARREGAR DADOS EXISTENTES
            // --------------------------------------------------

            carregarCompromissos();

        }

    }


    // ==================================================
    // HISTÓRICO
    // ==================================================

    if (pagina === "historico") {

        const listaDatas =
            document.getElementById(
                "listaDatas"
            );


        const buscarData =
            document.getElementById(
                "buscarData"
            );


        // ==================================================
        // FORMATAR DATA
        // ==================================================

        function formatarData(data) {

            const [ano, mes, dia] =
                data.split("-");

            return `${dia}/${mes}/${ano}`;
        }


        // ==================================================
        // OBTER DATAS SALVAS
        // ==================================================

        function obterDatas() {

            const datas =
                new Set();


            Object.keys(localStorage)
                .forEach(chave => {

                    const resultado =
                        chave.match(
                            /^planejamento_(\d{4}-\d{2}-\d{2})_/
                        );


                    if (resultado) {

                        datas.add(
                            resultado[1]
                        );
                    }

                });


            return Array.from(datas)
                .sort()
                .reverse();
        }


        // ==================================================
        // MOSTRAR DATAS
        // ==================================================

        function mostrarDatas(filtro = "") {

            listaDatas.innerHTML = "";


            const datas =
                obterDatas()
                    .filter(data =>
                        data.includes(filtro)
                    );


            if (datas.length === 0) {

                listaDatas.innerHTML = `

                    <div class="module-card">

                        <div>

                            <h2>
                                Nenhum planejamento encontrado
                            </h2>

                            <p>
                                Ainda não existem dados salvos para essa data.
                            </p>

                        </div>

                    </div>

                `;


                return;
            }


            datas.forEach(data => {

                const card =
                    document.createElement("a");


                card.className =
                    "module-card";


                card.href =
                    `historico.html?data=${data}`;


                card.innerHTML = `

                    <span class="icon">
                        📅
                    </span>


                    <div>

                        <h2>
                            ${formatarData(data)}
                        </h2>


                        <p>
                            Planejamento salvo
                        </p>

                    </div>


                    <span class="arrow">
                        ›
                    </span>

                `;


                listaDatas.appendChild(card);

            });

        }


        // ==================================================
        // MOSTRAR MÓDULO NORMAL
        // ==================================================

        function mostrarModulo(
            data,
            nomePagina,
            elemento,
            rotulos
        ) {

            const prefixo =
                `planejamento_${data}_${nomePagina}_`;


            const dados = [];


            Object.keys(localStorage)
                .forEach(chave => {

                    if (
                        chave.startsWith(
                            prefixo
                        )
                    ) {

                        const indiceTexto =
                            chave.replace(
                                prefixo,
                                ""
                            );


                        const indice =
                            Number(
                                indiceTexto
                            );


                        if (
                            Number.isNaN(indice)
                        ) {
                            return;
                        }


                        dados.push({

                            indice:
                                indice,

                            valor:
                                localStorage.getItem(
                                    chave
                                )

                        });

                    }

                });


            dados.sort(
                (a, b) =>
                    a.indice - b.indice
            );


            if (dados.length === 0) {

                elemento.innerHTML = `

                    <p
                        style="color:#777;"
                    >
                        Nenhum dado registrado.
                    </p>

                `;


                return;
            }


            elemento.innerHTML = "";


            dados.forEach(dado => {

                let valor =
                    dado.valor;


                if (valor === "") {
                    return;
                }


                const rotulo =
                    rotulos[dado.indice] ||
                    `Registro ${dado.indice + 1}`;


                if (valor === "true") {

                    valor =
                        "☑ Concluída";

                } else if (valor === "false") {

                    valor =
                        "☐ Não concluída";
                }


                const bloco =
                    document.createElement(
                        "div"
                    );


                bloco.style.marginBottom =
                    "14px";


                bloco.innerHTML = `

                    <p
                        style="
                            color:#888;
                            font-size:12px;
                            margin-bottom:4px;
                        "
                    >
                        ${rotulo}
                    </p>


                    <p
                        style="
                            white-space:pre-wrap;
                        "
                    >
                        ${valor}
                    </p>

                `;


                elemento.appendChild(
                    bloco
                );

            });

        }


        // ==================================================
        // MOSTRAR COMPROMISSOS NO HISTÓRICO
        // ==================================================

        function mostrarCompromissosHistorico(
            data,
            elemento
        ) {

            const chave =
                `planejamento_${data}_visao_compromissos`;


            const salvo =
                localStorage.getItem(
                    chave
                );


            if (!salvo) {
                return;
            }


            let compromissos;


            try {

                compromissos =
                    JSON.parse(salvo);

            } catch {

                return;
            }


            if (
                !Array.isArray(compromissos) ||
                compromissos.length === 0
            ) {
                return;
            }


            const titulo =
                document.createElement("div");


            titulo.style.marginBottom =
                "18px";


            titulo.innerHTML = `

                <p
                    style="
                        color:#888;
                        font-size:12px;
                        margin-bottom:8px;
                    "
                >
                    📌 Compromissos
                </p>

            `;


            elemento.appendChild(
                titulo
            );


            compromissos.forEach(
                compromisso => {

                    const bloco =
                        document.createElement(
                            "div"
                        );


                    bloco.style.cssText = `

                        margin-bottom:18px;
                        padding:12px;
                        border:1px solid #252529;
                        border-radius:8px;

                    `;


                    bloco.innerHTML = `

                        <p
                            style="
                                font-weight:600;
                                margin-bottom:8px;
                            "
                        >

                            ${
                                compromisso.horario
                                    || "Sem horário"
                            }

                            ${
                                compromisso.compromisso
                                    ? ` — ${compromisso.compromisso}`
                                    : ""
                            }

                        </p>


                        ${
                            compromisso.duracao
                                ? `
                                    <p
                                        style="
                                            margin:4px 0;
                                        "
                                    >
                                        ⏱️
                                        ${compromisso.duracao}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            compromisso.local
                                ? `
                                    <p
                                        style="
                                            margin:4px 0;
                                        "
                                    >
                                        📍
                                        ${compromisso.local}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            compromisso.observacao
                                ? `
                                    <p
                                        style="
                                            margin:8px 0 0;
                                            white-space:pre-wrap;
                                        "
                                    >
                                        📝
                                        ${compromisso.observacao}
                                    </p>
                                `
                                : ""
                        }

                    `;


                    elemento.appendChild(
                        bloco
                    );

                }
            );

        }


        // ==================================================
        // DATA SELECIONADA NO HISTÓRICO
        // ==================================================

        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const dataSelecionada =
            parametros.get("data");


        if (dataSelecionada) {

            const listaHistorico =
                document.getElementById(
                    "listaHistorico"
                );


            const visualizacaoDia =
                document.getElementById(
                    "visualizacaoDia"
                );


            const tituloHistorico =
                document.getElementById(
                    "tituloHistorico"
                );


            const subtituloHistorico =
                document.getElementById(
                    "subtituloHistorico"
                );


            listaHistorico.style.display =
                "none";


            visualizacaoDia.style.display =
                "flex";


            tituloHistorico.textContent =
                `📅 ${formatarData(dataSelecionada)}`;


            subtituloHistorico.textContent =
                "Planejamento registrado neste dia.";


            // ==================================================
            // VISÃO DO DIA
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "visao",
                document.getElementById(
                    "visaoHistorico"
                ),
                [
                    "🌅 Como estou hoje?",
                    "Por quê?",
                    "🎯 Como quero conduzir meu dia?"
                ]
            );


            mostrarCompromissosHistorico(
                dataSelecionada,
                document.getElementById(
                    "visaoHistorico"
                )
            );


            // ==================================================
            // PRIORIDADES
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "prioridades",
                document.getElementById(
                    "prioridadesHistorico"
                ),
                [
                    "Prioridade 1",
                    "Status da prioridade 1",
                    "Prioridade 2",
                    "Status da prioridade 2",
                    "Prioridade 3",
                    "Status da prioridade 3"
                ]
            );


            // ==================================================
            // TRABALHO
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "trabalho",
                document.getElementById(
                    "trabalhoHistorico"
                ),
                [
                    "Objetivo do trabalho",
                    "Tarefas",
                    "Próxima ação",
                    "Ideias / observações"
                ]
            );


            // ==================================================
            // ESTUDO
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "estudo",
                document.getElementById(
                    "estudoHistorico"
                ),
                [
                    "Tema",
                    "Objetivo do estudo",
                    "Fonte / material",
                    "Tempo"
                ]
            );


            // ==================================================
            // O QUE APRENDI
            // ==================================================

            const numBlocosAprendi =
                Number(
                    localStorage.getItem(
                        `planejamento_${dataSelecionada}_o-que-aprendi_blocos`
                    )
                ) || 3;


            const camposAprendi = [

                "📌 Assunto",

                "💡 O que aprendi",

                "⭐ Principal insight",

                "🔗 Conexão",

                "🛠️ Aplicação",

                "❓ Dúvida",

                "🎯 Próxima ação"

            ];


            const rotulosAprendi = [];


            for (
                let i = 0;
                i < numBlocosAprendi;
                i++
            ) {

                camposAprendi.forEach(
                    campo => {

                        rotulosAprendi.push(
                            `Aprendizado ${i + 1} — ${campo}`
                        );

                    }
                );

            }


            mostrarModulo(
                dataSelecionada,
                "o-que-aprendi",
                document.getElementById(
                    "aprendiHistorico"
                ),
                rotulosAprendi
            );


            // ==================================================
            // CORPO
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "corpo",
                document.getElementById(
                    "corpoHistorico"
                ),
                [
                    "Tipo de cardio",
                    "Distância",
                    "Tempo previsto",
                    "Intensidade",
                    "Objetivo do cardio",
                    "Objetivo alimentar",
                    "Refeições",
                    "Atenção alimentar",
                    "Jejum planejado",
                    "Água planejada",
                    "Sono anterior"
                ]
            );


            // ==================================================
            // ESPIRITUALIDADE
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "espiritualidade",
                document.getElementById(
                    "espiritualidadeHistorico"
                ),
                [
                    "Tempo com Deus",
                    "Leitura / Devocional",
                    "Reflexão",
                    "O que aprendi hoje"
                ]
            );


            // ==================================================
            // NOTAS
            // ==================================================

            mostrarModulo(
                dataSelecionada,
                "notas",
                document.getElementById(
                    "notasHistorico"
                ),
                [
                    "Ideias",
                    "Notas",
                    "Pesquisar depois"
                ]
            );


        } else {

            // ==================================================
            // LISTA DO HISTÓRICO
            // ==================================================

            mostrarDatas();


            buscarData.addEventListener(
                "change",
                () => {

                    if (buscarData.value) {

                        mostrarDatas(
                            buscarData.value
                        );

                    } else {

                        mostrarDatas();

                    }

                }
            );

        }

    }

    // ==================================================
    // BOTÃO FLUTUANTE — FOCO
    // ==================================================

    if (
        pathname.includes("/modulos/planejamento/") &&
        pagina !== "historico"
    ) {

        const botaoFoco = document.createElement("a");

            botaoFoco.href = pagina === "trabalho"
        ? "../foco/foco.html?origem=trabalho"
        : "../foco/foco.html";
        botaoFoco.className = "botao-foco-flutuante";
        botaoFoco.setAttribute(
            "aria-label",
            "Ir para Foco"
        );

        botaoFoco.innerHTML = `
            <span class="icone-foco">🎯</span>
            <span class="texto-foco">Foco</span>
        `;

        botaoFoco.style.cssText = `
            position: fixed;
            right: 24px;
            bottom: 24px;
            z-index: 9999;

            display: flex;
            align-items: center;

            width: 44px;
            height: 44px;

            overflow: hidden;
            white-space: nowrap;

            text-decoration: none;

            background: #17171a;
            color: #f5f5f5;

            border: 1px solid #2d2d32;
            border-radius: 22px;

            box-shadow: 0 4px 14px rgba(0,0,0,0.25);

            transition:
                width 0.2s ease,
                background 0.2s ease,
                border-color 0.2s ease;
        `;

        const icone =
            botaoFoco.querySelector(".icone-foco");

        const texto =
            botaoFoco.querySelector(".texto-foco");

        icone.style.cssText = `
            min-width: 44px;
            text-align: center;
            font-size: 18px;
        `;

        texto.style.cssText = `
            font-size: 13px;
            opacity: 0;
            transition: opacity 0.15s ease;
        `;

        botaoFoco.addEventListener(
            "mouseenter",
            () => {

                botaoFoco.style.width = "88px";
                botaoFoco.style.background = "#202024";
                botaoFoco.style.borderColor = "#44444a";

                texto.style.opacity = "1";
            }
        );

        botaoFoco.addEventListener(
            "mouseleave",
            () => {

                botaoFoco.style.width = "44px";
                botaoFoco.style.background = "#17171a";
                botaoFoco.style.borderColor = "#2d2d32";

                texto.style.opacity = "0";
            }
        );

        document.body.appendChild(
            botaoFoco
        );
    }    

   // ==================================================
// PAINEL GLOBAL — TAREFAS DO TRABALHO
// ==================================================

if (
    !pathname.includes("/modulos/proximo-passo/") &&
    pagina !== "trabalho" &&
    pagina !== "historico"
) {

    const containerTarefas =
        document.querySelector("main.container") ||
        document.querySelector("main") ||
        document.body;


    function escapeHTMLTarefa(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    }


    function obterTarefasTrabalho() {
    const raw = localStorage.getItem(
        `planejamento_${dataAtual}_trabalho_tarefas`
    );
    if (!raw) return [];

    try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr
            .filter(t => t && t.texto && t.texto.trim())
            .map(t => ({
                texto: t.texto.trim(),
                prioridade: t.prioridade || "",
                concluida: !!t.concluida
            }));
    } catch {
        return [];
    }
}


    function criarPainelTarefas() {

        const tarefas = obterTarefasTrabalho();

        if (tarefas.length === 0) {
            return;
        }

        if (
            document.querySelector(
                ".painel-tarefas-trabalho"
            )
        ) {
            return;
        }


        const painel =
            document.createElement("aside");

        painel.className =
            "painel-tarefas-trabalho";


        painel.innerHTML = `

            <div class="tarefas-cabecalho">

                <div class="tarefas-icone">
                    💼
                </div>

                <div>
                    <div class="tarefas-titulo">
                        Trabalho
                    </div>

                    <div class="tarefas-subtitulo">
                        Tarefas do dia
                    </div>
                </div>

            </div>


                        <div class="tarefas-lista">

                ${
                    tarefas
                        .map(t => {

                            const prioIcone =
                                t.prioridade === "alta"  ? "🔴" :
                                t.prioridade === "media" ? "🟡" :
                                t.prioridade === "baixa" ? "🟢" : "○";

                            return `
                                <div class="tarefa-item" ${t.concluida ? 'style="opacity:.55"' : ""}>
                                    <div class="tarefa-marcador">
                                        ${t.concluida ? "✓" : prioIcone}
                                    </div>
                                    <div class="tarefa-texto">
                                        ${escapeHTMLTarefa(t.texto)}
                                    </div>
                                </div>
                            `;
                        })
                        .join("")
                }

            </div>


            <div class="tarefas-rodape">

                ${
                    tarefas.length === 1
                        ? "1 tarefa"
                        : `${tarefas.length} tarefas`
                }

            </div>

        `;


        document.body.appendChild(painel);

        posicionarPainelTarefas(painel);


        window.addEventListener(
            "resize",
            () => {
                posicionarPainelTarefas(painel);
            }
        );

    }


    function posicionarPainelTarefas(painel) {

        const larguraTela =
            window.innerWidth;

        if (larguraTela < 1250) {
            painel.style.display = "none";
            return;
        }


        const rect =
            containerTarefas.getBoundingClientRect();

        const larguraPainel = 220;
        const distancia     = 28;


        // Aqui é o espelho do painel de prioridades:
        // em vez de "left - painel", usamos "right + painel"
        const esquerda =
            rect.right + distancia;


        if (
            esquerda + larguraPainel >
            larguraTela - 12
        ) {
            painel.style.display = "none";
            return;
        }


        painel.style.display = "block";
        painel.style.left = `${esquerda}px`;

    }


    // ==================================================
    // ESTILO (espelho do painel de prioridades)
    // ==================================================

    const estiloTarefas =
        document.createElement("style");

    estiloTarefas.textContent = `

        .painel-tarefas-trabalho {

            position: fixed;
            top: 50%;
            transform: translateY(-50%);

            width: 220px;
            box-sizing: border-box;
            padding: 18px;

            background: rgba(23, 23, 26, 0.97);
            border: 1px solid #29292e;
            border-radius: 14px;

            box-shadow:
                0 14px 40px rgba(0, 0, 0, 0.28);

            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);

            z-index: 9999;
            color: #f5f5f5;

            animation:
                tarefasEntrada 0.35s ease;

        }


        .tarefas-cabecalho {

            display: flex;
            align-items: center;
            gap: 11px;

            padding-bottom: 15px;

            border-bottom: 1px solid #29292e;

        }


        .tarefas-icone {

            width: 32px;
            height: 32px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 9px;

            background: #202024;
            border: 1px solid #303036;

            font-size: 15px;

        }


        .tarefas-titulo {

            font-size: 13px;
            font-weight: 600;
            color: #f5f5f5;

        }


        .tarefas-subtitulo {

            margin-top: 2px;
            font-size: 11px;
            color: #77777f;

        }


        .tarefas-lista {

            display: flex;
            flex-direction: column;
            gap: 14px;

            padding: 17px 0 15px;

        }


        .tarefa-item {

            display: grid;
            grid-template-columns: 15px 1fr;
            gap: 9px;
            align-items: start;

        }


        .tarefa-marcador {

            padding-top: 1px;
            font-size: 10px;
            color: #77777f;

        }


        .tarefa-texto {

            font-size: 12.5px;
            line-height: 1.55;
            color: #d8d8dc;

            overflow-wrap: anywhere;
            white-space: pre-wrap;

        }


        .tarefa-item:hover .tarefa-texto {
            color: #ffffff;
        }


        .tarefas-rodape {

            padding-top: 12px;
            border-top: 1px solid #29292e;

            font-size: 10px;
            color: #66666e;

        }


        @keyframes tarefasEntrada {

            from {
                opacity: 0;
                transform: translate(8px, -50%);
            }

            to {
                opacity: 1;
                transform: translate(0, -50%);
            }

        }


        @media (max-width: 1249px) {

            .painel-tarefas-trabalho {
                display: none;
            }

        }

    `;

    document.head.appendChild(estiloTarefas);


    // ==================================================
    // INICIAR
    // ==================================================

    criarPainelTarefas();

}
    
});
