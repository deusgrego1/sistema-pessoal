document.addEventListener("DOMContentLoaded", () => {

    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    const dataAtual = `${ano}-${mes}-${dia}`;

    const campos = document.querySelectorAll("input, textarea, select");

    campos.forEach((campo, indice) => {

        const chave = `planejamento_${dataAtual}_prioridades_${indice}`;

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

});
