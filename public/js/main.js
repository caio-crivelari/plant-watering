//controle de modal
const openAddNewPlantModal = document.querySelector(
  "#open-add-new-plant-modal"
);
const closeModalBtn = document.querySelector("#close-modal-btn");
const newPlantModal = document.querySelector(".new-plant-modal");

openAddNewPlantModal.addEventListener("click", () => {
  newPlantModal.classList.remove("hidden");
  setTimeout(() => newPlantModal.classList.add("show"), 10);
});

closeModalBtn.addEventListener("click", () => {
  const newPlantForm = document.querySelector("#new-plant-form");
  newPlantModal.classList.remove("show");
  newPlantForm.reset();
  newPlantModal.addEventListener(
    "transitionend",
    () => {
      newPlantModal.classList.add("hidden"); // esconde de vez após animação
    },
    { once: true }
  );
});

//aplicando máscara de data dd/mm/aaaa aos inputs necessários
const dateTimeInputs = document.querySelectorAll(".date-input");

dateTimeInputs.forEach((input) => {
  input.addEventListener("input", (evt) => {
    let value = evt.target.value.replace(/\D/g, "");

    if (value.length > 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }

    if (value.length > 5) {
      value = value.slice(0, 5) + "/" + value.slice(5, 9);
    }
    evt.target.value = value;
  });
});
