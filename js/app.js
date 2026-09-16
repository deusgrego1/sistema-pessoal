document.addEventListener("DOMContentLoaded", () => {

    // Data atual
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataAtual = `${ano}-${mes}-${dia}`;

    // Descobre automaticamente qual página está aberta
    const pagina = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    // Todos os campos da página
    const campos = document.querySelectorAll("input, textarea, select");

    campos.forEach((campo, indice) => {

        const chave = `planejamento_${dataAtual}_${pagina}_${indice}`;

        // Carregar informação salva
        const salvo = localStorage.getItem(chave);

        if (salvo !== null) {

            if (campo.type === "checkbox") {
                campo.checked = salvo === "true";
            } else {
                campo.value = salvo;
            }

        }

        // Salvar enquanto digita
        campo.addEventListener("input", () => {

            const valor = campo.type === "checkbox"
                ? campo.checked
                : campo.value;

            localStorage.setItem(chave, valor);

        });

        // Salvar alterações
        campo.addEventListener("change", () => {

            const valor = campo.type === "checkbox"
                ? campo.checked
                : campo.value;

            localStorage.setItem(chave, valor);

        });

    });

});
