document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("DOMContentLoaded", () => {

    const campos = document.querySelectorAll("input, textarea, select");

    campos.forEach((campo, indice) => {

        const chave = `planejamento_${window.location.pathname}_${indice}`;

        const valorSalvo = localStorage.getItem(chave);

        if (valorSalvo !== null) {
            if (campo.type === "checkbox") {
                campo.checked = valorSalvo === "true";
            } else {
                campo.value = valorSalvo;
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
});
