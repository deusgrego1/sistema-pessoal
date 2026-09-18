```javascript
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

        const prefixoOntem = `planejamento_${dataOntem}_${paginaAlvo}_`;
        const prefixoHoje  = `planejamento_${dataRef}_${paginaAlvo}_`;

        let copiados = 0;

        Object.keys(localStorage).forEach(chave => {

            if (chave.startsWith(prefixoOntem)) {

                const sufixo = chave.replace(prefixoOntem, "");

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
    // BARRA DE NAVEGAÇÃO DE DATAS
    // ==================================================

    if (
        (pathname.includes("/modulos/planejamento/") ||
         pathname.includes("/modulos/revisao/")) &&
        pagina !== "historico"
    ) {
        inserirBarraDatas(dataAtual, dataHoje);
    }


    function inserirBarraDatas(dataAtual, dataHoje) {

        const container = document.querySelector("main.container");
        const header = container ? container.querySelector(".header") : null;

        if (!container || !header) return;

        const [a, m, d] = dataAtual.split("-").map(Number);
        const dataObj = new Date(a, m - 1, d);

        const fmtISO = (dt) => {

            const yy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, "0");
            const dd = String(dt.getDate()).padStart(2, "0");

            return `${yy}-${mm}-${dd}`;
        };

        const diaAnterior = new Date(dataObj);
        diaAnterior.setDate(diaAnterior.getDate() - 1);

        const diaSeguinte = new Date(dataObj);
        diaSeguinte.setDate(diaSeguinte.getDate() + 1);

        const anterior = fmtISO(diaAnterior);
        const seguinte = fmtISO(diaSeguinte);

        const fmtBR = (iso) => {

            const [y, mo, dy] = iso.split("-");

            return `${dy}/${mo}/${y}`;
        };

        const label = (iso) => {

            if (iso === dataHoje) return "Hoje";

            return fmtBR(iso);
        };

        const baseURL = window.location.pathname;

        const urlComData = (dataIso) => {

            if (dataIso === dataHoje) return baseURL;

            return `${baseURL}?data=${dataIso}`;
        };

        const barra = document.createElement("div");

        barra.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 18px;
            padding: 10px 12px;
            border: 1px solid #252529;
            border-radius: 10px;
            background: #17171a;
            font-size: 14px;
        `;

        const linkStyle =
            "text-decoration:none; color:#e0e0e0; padding:6px 10px; border-radius:6px;";

        barra.innerHTML = `
            <a href="${urlComData(anterior)}" style="${linkStyle}">
                ← ${label(anterior)}
            </a>

            <div style="text-align:center;">

                <div style="font-weight:600; color:#f5f5f5;">
                    ${label(dataAtual)}
                </div>

                ${
                    dataAtual !== dataHoje
                        ? `<a href="${baseURL}" style="font-size:11px; color:#c98a8a; text-decoration:none;">
                               voltar para hoje
                           </a>`
                        : ""
                }

            </div>

            <a href="${urlComData(seguinte)}" style="${linkStyle}">
                ${label(seguinte)} →
            </a>
        `;

        container.insertBefore(barra, header);
    }


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


        // ==================================================
        // COMPROMISSOS — SALVAMENTO ESPECIAL
        // ==================================================

        if (pagina === "visao") {

            const listaCompromissos =
                document.getElementById("listaCompromissos");

            const btnAdicionar =
                document.getElementById("btnAdicionarCompromisso");

            const chaveCompromissos =
                `planejamento_${dataAtual}_visao_compromissos`;


            // --------------------------------------------------
            // LER COMPROMISSOS
            // --------------------------------------------------

            function obterCompromissos() {

                const salvo =
                    localStorage.getItem(chaveCompromissos);

                if (!salvo) return [];

                try {
                    const dados = JSON.parse(salvo);

                    return Array.isArray(dados) ? dados : [];

                } catch {
                    return [];
                }
            }


            // --------------------------------------------------
            // SALVAR COMPROMISSOS
            // --------------------------------------------------

            function salvarCompromissos() {

                if (!listaCompromissos) return;

                const blocos =
```
