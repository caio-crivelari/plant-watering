//controle de modal
const openAddNewPlantModal = document.querySelector(
  "#open-add-new-plant-modal"
);
const closeModalBtn = document.querySelector("#close-modal-btn");

openAddNewPlantModal.addEventListener("click", () => {
  const newPlantModal = document.querySelector(".new-plant-modal");
  const main = document.querySelector("main");
  newPlantModal.classList.remove("hidden");
  main.classList.add("hidden");
});

closeModalBtn.addEventListener("click", () => {
  const newPlantForm = document.querySelector("#new-plant-form");
  const newPlantModal = document.querySelector(".new-plant-modal");
  const main = document.querySelector("main");
  newPlantForm.reset();
  newPlantModal.classList.add("hidden");
  main.classList.remove("hidden");
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
