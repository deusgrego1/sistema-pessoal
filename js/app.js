document.addEventListener("DOMContentLoaded", () => {

    const campos = document.querySelectorAll("input, textarea, select");

    campos.forEach((campo, indice) => {

        const chave = "prioridade_" + indice;

        const salvo = localStorage.getItem(chave);

        if (salvo !== null) {
            if (campo.type === "checkbox") {
                campo.checked = salvo === "true";
            } else {
                campo.value = salvo;
            }
        }

        campo.addEventListener("input", () => {
            if (campo.type === "checkbox") {
                localStorage.setItem(chave, campo.checked);
            } else {
                localStorage.setItem(chave, campo.value);
            }
        });

        campo.addEventListener("change", () => {
            if (campo.type === "checkbox") {
                localStorage.setItem(chave, campo.checked);
            } else {
                localStorage.setItem(chave, campo.value);
            }
        });

    });

});
