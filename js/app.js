document.addEventListener("DOMContentLoaded", () => {

    const campo = document.querySelector("textarea");

    campo.addEventListener("input", () => {
        alert("INPUT FUNCIONOU!");
    });

});
