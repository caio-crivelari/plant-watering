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

const newPlantForm = document.querySelector("#new-plant-form");
newPlantForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  insertNewPlant();
});

async function insertNewPlant() {
  const plantName = document.querySelector("#plant-name").value;
  const wateringFrequency = document.querySelector("#watering-frequency").value;
  const lastWatering = document.querySelector("#last-watering-date").value;
  const lastFertilization = document.querySelector("#last-fertilization").value;
  const fertilizationFrequency = document.querySelector(
    "#fertilization-frequency"
  ).value;
  const nextWatering = nextDateCalculator(lastWatering, wateringFrequency);
  const nextFertilization = nextDateCalculator(
    lastFertilization,
    fertilizationFrequency
  );

  const response = await fetch("/insertNewPlant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plantName,
      lastWatering,
      wateringFrequency,
      nextWatering,
      lastFertilization,
      fertilizationFrequency,
      nextFertilization,
    }),
  });

  const result = await response.json();
  if (result.success) {
    const progressBar = document.querySelector(".progress-bar");
    progressBar.style.display = "block";
    progressBar.innerHTML = `Planta ${plantName} cadastrada com sucesso! <div class="progress-background"></div>`;
    setTimeout(() => {
      progressBar.style.display = "none";
    }, 3000);
    document.querySelector("#new-plant-form").reset();
    return;
  } else {
    alert("Erro ao inserir nova planta!");
  }
}

function nextDateCalculator(lastDate, frequency) {
  //pegando os dados separadamente pois a data vem como dd/mm/aaaa
  const day = parseInt(lastDate.slice(0, 2));
  const month = parseInt(lastDate.slice(3, 5));
  const year = parseInt(lastDate.slice(6));

  //juntando todos para poder usar o new Date e calcular
  const convertedDate = new Date(year, month - 1, day);

  //adicionando os dias de frequencia a data e devolvendo a data formatada
  convertedDate.setDate(convertedDate.getDate() + Number(frequency));
  const newDay = String(convertedDate.getDate()).padStart(2, "0");
  const newMonth = String(convertedDate.getMonth() + 1).padStart(2, "0");
  const newYear = convertedDate.getFullYear();

  const formattedDate = `${newDay}/${newMonth}/${newYear}`;

  return formattedDate;
}

function renderPlants() {
  const plantsContainer = document.querySelector(".plant-cards-container");

  fetch("/getPlants")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        data.data.forEach((plant) => {
          plantsContainer.innerHTML += `
          <div class="plant-card">
            <div class="plant-data">
              <h3 class="main-title">${plant.plant_name}</h3>
              <p>Regar a cada ${plant.watering_frequency} dias</p>
              <p>Última rega: ${plant.last_watering}</p>
              <p>Próxima rega: ${plant.next_watering}</p>
              <p>Adubar a cada ${plant.fertilization_frequency} dias</p>
              <p>Última Adubagem: ${plant.last_fertilization}</p>
              <p>Próxima Adubagem: ${plant.next_fertilization}</p>
            </div>
            <div class="plant-actions">
              <i class="ph-fill ph-drop"></i>
            </div>
          </div>
          `;
        });
      }
    });
}

renderPlants();
