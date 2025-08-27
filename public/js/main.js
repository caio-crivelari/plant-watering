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
    renderPlants();
    return;
  } else {
    alert("Erro ao inserir nova planta!");
  }
}

//função que calcula a proxima rega e adubagem, no momento da criação de uma nova planta
function nextDateCalculator(lastDate, frequency) {
  const convertedDate = unformatDate(lastDate);

  //adicionando os dias de frequencia à data e devolvendo a data formatada
  convertedDate.setDate(convertedDate.getDate() + Number(frequency));
  return dateFormatter(convertedDate);
}

function unformatDate(dateToFormat) {
  const day = parseInt(dateToFormat.slice(0, 2));
  const month = parseInt(dateToFormat.slice(3, 5));
  const year = parseInt(dateToFormat.slice(6));
  const convertedDate = new Date(year, month - 1, day);
  return convertedDate;
}

function dateFormatter(dateToFormat) {
  const formattedDay = String(dateToFormat.getDate()).padStart(2, "0");
  const formattedMonth = String(dateToFormat.getMonth() + 1).padStart(2, "0");
  const formattedYear = dateToFormat.getFullYear();

  return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}

function renderPlants() {
  const plantsContainer = document.querySelector(".plant-cards-container");

  fetch("/getPlants")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        plantsContainer.innerHTML = "";
        data.data.forEach((plant) => {
          plantsContainer.innerHTML += `
          <div class="plant-card" id="plant-id-${plant.id}">
            <div class="plant-data">
              <h3 class="main-title">${plant.plant_name}</h3>
              <p>Regar a cada <span id="plant-watering-frequency">${plant.watering_frequency}</span> dias</p>
              <p>Última rega: <span id="plant-last-watering">${plant.last_watering}</span></p>
              <p>Próxima rega: <span id="plant-next-watering">${plant.next_watering}</span></p>
              <p>Adubar a cada <span id="plant-fertilization-frequency">${plant.fertilization_frequency}/<span> dias</p>
              <p>Última Adubagem: <span id="plant-last-fertilization">${plant.last_fertilization}</span></p>
              <p>Próxima Adubagem: <span id="plant-next-fertilization">${plant.next_fertilization}</span></p>
            </div>
            <div class="plant-actions">
              <i id="${plant.id}" class="ph-fill ph-drop"></i>
            </div>
          </div>
          `;
        });
      }

      const waterPlantButtons = document.querySelectorAll(".ph-drop");
      waterPlantButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const plantId = button.getAttribute("id");
          let plantLastWatering = document.querySelector(
            `#plant-id-${plantId} #plant-last-watering`
          ).textContent;
          const plantWateringFrequency = document.querySelector(
            `#plant-id-${plantId} #plant-watering-frequency`
          ).textContent;

          const today = new Date();
          const todayFormatted = dateFormatter(today);

          if (plantLastWatering == todayFormatted) {
            alert("Planta já regada no dia de hoje!");
            return;
          } else {
            const nextWateringUpdated = nextDateCalculator(
              todayFormatted,
              plantWateringFrequency
            );

            try {
              const response = await fetch(`/plants/${plantId}/water`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  lastWatering: todayFormatted,
                  nextWatering: nextWateringUpdated,
                }),
              });
              if (!response.ok) throw new Error("Erro ao atualizar a rega");
              const progressBar = document.querySelector(".progress-bar");
              progressBar.style.display = "block";
              progressBar.innerHTML = `Planta regada com sucesso! <div class="progress-background"></div>`;
              setTimeout(() => {
                progressBar.style.display = "none";
              }, 3000);
              renderPlants();
            } catch (error) {
              console.error(error);
              alert("Erro ao atualizar a rega da planta no banco!");
            }
          }
        });
      });
    });
}

renderPlants();
