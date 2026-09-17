document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // DATA ATUAL
    // ==================================================

    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataAtual = `${ano}-${mes}-${dia}`;


    // ==================================================
    // IDENTIFICA A PÁGINA
    // ==================================================

    const pagina = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");


    // ==================================================
    // SALVAMENTO NORMAL
    // ==================================================

    if (pagina !== "historico") {

        const campos = document.querySelectorAll(
            "input, textarea, select"
        );

        campos.forEach((campo, indice) => {

            const chave =
                `planejamento_${dataAtual}_${pagina}_${indice}`;

            const salvo = localStorage.getItem(chave);

            if (salvo !== null) {

                if (campo.type === "checkbox") {
                    campo.checked = salvo === "true";
                } else {
                    campo.value = salvo;
                }

            }

            const salvar = () => {

                const valor = campo.type === "checkbox"
                    ? campo.checked
                    : campo.value;

                localStorage.setItem(chave, valor);

            };

            campo.addEventListener("input", salvar);
            campo.addEventListener("change", salvar);

        });

    }


    // ==================================================
    // HISTÓRICO
    // ==================================================

    if (pagina === "historico") {

        const listaDatas =
            document.getElementById("listaDatas");

        const buscarData =
            document.getElementById("buscarData");


        // ------------------------------------------------
        // FORMATA DATA
        // ------------------------------------------------

        function formatarData(data) {

            const [ano, mes, dia] = data.split("-");

            return `${dia}/${mes}/${ano}`;

        }


        // ------------------------------------------------
        // ENCONTRA TODAS AS DATAS SALVAS
        // ------------------------------------------------

        function obterDatas() {

            const datas = new Set();

            Object.keys(localStorage).forEach(chave => {

                const resultado = chave.match(
                    /^planejamento_(\d{4}-\d{2}-\d{2})_/
                );

                if (resultado) {
                    datas.add(resultado[1]);
                }

            });

            return Array.from(datas)
                .sort()
                .reverse();

        }


        // ------------------------------------------------
        // MOSTRA LISTA DE DATAS
        // ------------------------------------------------

        function mostrarDatas(filtro = "") {

            listaDatas.innerHTML = "";

            const datas = obterDatas()
                .filter(data => data.includes(filtro));


            if (datas.length === 0) {

                listaDatas.innerHTML = `
                    <div class="module-card">
                        <div>
                            <h2>Nenhum planejamento encontrado</h2>
                            <p>
                                Ainda não existem dados salvos para essa data.
                            </p>
                        </div>
                    </div>
                `;

                return;

            }


            datas.forEach(data => {

                const card = document.createElement("a");

                card.className = "module-card";

                card.href =
                    `historico.html?data=${data}`;

                card.innerHTML = `
                    <span class="icon">📅</span>

                    <div>
                        <h2>${formatarData(data)}</h2>

                        <p>
                            Planejamento salvo
                        </p>
                    </div>

                    <span class="arrow">›</span>
                `;

                listaDatas.appendChild(card);

            });

        }


        // ------------------------------------------------
        // RENDERIZA UM MÓDULO
        // ------------------------------------------------

        function mostrarModulo(
            data,
            nomePagina,
            elemento,
            rotulos
        ) {

            const prefixo =
                `planejamento_${data}_${nomePagina}_`;

            const dados = [];

            Object.keys(localStorage).forEach(chave => {

                if (chave.startsWith(prefixo)) {

                    const indiceTexto =
                        chave.replace(prefixo, "");

                    const indice = Number(indiceTexto);

                    // Ignora chaves de controle (ex.: _blocos)
                    if (Number.isNaN(indice)) return;

                    dados.push({
                        indice: indice,
                        valor: localStorage.getItem(chave)
                    });

                }

            });


            dados.sort((a, b) =>
                a.indice - b.indice
            );


            if (dados.length === 0) {

                elemento.innerHTML = `
                    <p style="color:#777;">
                        Nenhum dado registrado.
                    </p>
                `;

                return;

            }


            elemento.innerHTML = "";


            dados.forEach(dado => {

                let valor = dado.valor;

                if (valor === "") return;


                const rotulo =
                    rotulos[dado.indice] ||
                    `Registro ${dado.indice + 1}`;


                if (valor === "true") {

                    valor = "☑ Concluída";

                } else if (valor === "false") {

                    valor = "☐ Não concluída";

                }


                const bloco =
                    document.createElement("div");

                bloco.style.marginBottom = "14px";

                bloco.innerHTML = `
                    <p style="color:#888; font-size:12px; margin-bottom:4px;">
                        ${rotulo}
                    </p>

                    <p style="white-space:pre-wrap;">
                        ${valor}
                    </p>
                `;

                elemento.appendChild(bloco);

            });

        }


        // ------------------------------------------------
        // ABRIR UM DIA ESPECÍFICO
        // ------------------------------------------------

        const parametros =
            new URLSearchParams(
                window.location.search
            );

        const dataSelecionada =
            parametros.get("data");


        if (dataSelecionada) {

            const listaHistorico =
                document.getElementById("listaHistorico");

            const visualizacaoDia =
                document.getElementById("visualizacaoDia");

            const tituloHistorico =
                document.getElementById("tituloHistorico");

            const subtituloHistorico =
                document.getElementById("subtituloHistorico");


            // Esconde lista
            listaHistorico.style.display = "none";


            // Mostra planejamento
            visualizacaoDia.style.display = "flex";


            // Atualiza título
            tituloHistorico.textContent =
                `📅 ${formatarData(dataSelecionada)}`;

            subtituloHistorico.textContent =
                "Planejamento registrado neste dia.";


            // --------------------------------------------
            // VISÃO DO DIA
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "visao",
                document.getElementById("visaoHistorico"),
                [
                    "Data",
                    "Como estou hoje?",
                    "Compromissos",
                    "Intenção do dia"
                ]
            );


            // --------------------------------------------
            // PRIORIDADES
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "prioridades",
                document.getElementById("prioridadesHistorico"),
                [
                    "Prioridade 1",
                    "Status da prioridade 1",
                    "Prioridade 2",
                    "Status da prioridade 2",
                    "Prioridade 3",
                    "Status da prioridade 3"
                ]
            );


            // --------------------------------------------
            // TRABALHO
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "trabalho",
                document.getElementById("trabalhoHistorico"),
                [
                    "Objetivo do trabalho",
                    "Tarefas",
                    "Próxima ação",
                    "Ideias / observações"
                ]
            );


            // --------------------------------------------
            // ESTUDO
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "estudo",
                document.getElementById("estudoHistorico"),
                [
                    "Tema",
                    "Objetivo do estudo",
                    "Fonte / material",
                    "Tempo"
                ]
            );


            // --------------------------------------------
            // O QUE APRENDI
            // --------------------------------------------

            const numBlocosAprendi =
                Number(localStorage.getItem(
                    `planejamento_${dataSelecionada}_o-que-aprendi_blocos`
                )) || 3;

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

            for (let i = 0; i < numBlocosAprendi; i++) {

                camposAprendi.forEach(campo => {

                    rotulosAprendi.push(
                        `Aprendizado ${i + 1} — ${campo}`
                    );

                });

            }

            mostrarModulo(
                dataSelecionada,
                "o-que-aprendi",
                document.getElementById("aprendiHistorico"),
                rotulosAprendi
            );


            // --------------------------------------------
            // CORPO
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "corpo",
                document.getElementById("corpoHistorico"),
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


            // --------------------------------------------
            // ESPIRITUALIDADE
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "espiritualidade",
                document.getElementById("espiritualidadeHistorico"),
                [
                    "Tempo com Deus",
                    "Leitura / Devocional",
                    "Reflexão",
                    "O que aprendi hoje"
                ]
            );


            // --------------------------------------------
            // NOTAS / IDEIAS
            // --------------------------------------------

            mostrarModulo(
                dataSelecionada,
                "notas",
                document.getElementById("notasHistorico"),
                [
                    "Ideias",
                    "Notas",
                    "Pesquisar depois"
                ]
            );

        } else {

            // Sem data selecionada:
            // mostra a lista normalmente.

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

});
