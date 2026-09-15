document.addEventListener("DOMContentLoaded", () => {

    const campo = document.querySelector("textarea");

    campo.addEventListener("input", () => {
        localStorage.setItem("prioridade_teste", campo.value);
    });

});
