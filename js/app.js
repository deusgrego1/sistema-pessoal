document.addEventListener("DOMContentLoaded", () => {

    // Data atual
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataAtual = `${ano}-${mes}-${dia}`;

    // Identifica a página atual
    const pagina = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    // ==================================================
    // SALVAMENTO NORMAL DAS PÁGINAS
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

            campo.addEventListener("input", () => {

                const valor = campo.type === "checkbox"
                    ? campo.checked
                    : campo.value;

                localStorage.setItem(chave, valor);

            });

            campo.addEventListener("change", () => {

                const valor = campo.type === "checkbox"
                    ? campo.checked
                    : campo.value;

                localStorage.setItem(chave, valor);

            });

        });

    }

    // ==================================================
    // HISTÓRICO
    // ==================================================

    if (pagina === "historico") {

        const listaDatas = document.getElementById("listaDatas");
        const buscarData = document.getElementById("buscarData");

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

            return Array.from(datas).sort().reverse();
        }

        function formatarData(data) {

            const [ano, mes, dia] = data.split("-");

            return `${dia}/${mes}/${ano}`;
        }

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

                const card = document.createElement("div");

                card.className = "module-card";

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

                card.style.cursor = "pointer";

                card.addEventListener("click", () => {

                    window.location.href =
                        `historico.html?data=${data}`;

                });

                listaDatas.appendChild(card);

            });

        }

        mostrarDatas();

        buscarData.addEventListener("change", () => {

            if (buscarData.value) {
                mostrarDatas(buscarData.value);
            } else {
                mostrarDatas();
            }

        });

    }

});
