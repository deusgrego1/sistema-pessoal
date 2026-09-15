document.addEventListener("DOMContentLoaded", () => {

    const campos = document.querySelectorAll("input, textarea, select");

    campos.forEach((campo, indice) => {

        const chave = "teste_campo_" + indice;

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
