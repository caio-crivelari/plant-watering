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
    /* createCalendarEvent(plantName, nextWatering); */
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

//FUNÇÃO QUE ALTERNA O FORMATO DA DATA DE DD/MM/AAAA PARA AAAA-MM-DD PARA REALIZAR CÁCULOS
function unformatDate(dateToFormat) {
  const day = parseInt(dateToFormat.slice(0, 2));
  const month = parseInt(dateToFormat.slice(3, 5));
  const year = parseInt(dateToFormat.slice(6));
  const convertedDate = new Date(year, month - 1, day);
  return convertedDate;
}

//FUNÇÃO QUE FORMATA A DATA PARA DD/MM/AAAA
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
              <p>Adubar a cada <span id="plant-fertilization-frequency">${plant.fertilization_frequency}</span> dias</p>
              <p>Última Adubagem: <span id="plant-last-fertilization">${plant.last_fertilization}</span></p>
              <p>Próxima Adubagem: <span id="plant-next-fertilization">${plant.next_fertilization}</span></p>
            </div>
            <div class="plant-actions">
              <i data-plant-id="${plant.id}" data-plant-name="${plant.plant_name}" class="action-icon fa-solid fa-droplet water-plant"></i>
              <i data-plant-id="${plant.id}" data-plant-name="${plant.plant_name}" class="action-icon fa-solid fa-seedling fertilize-plant"></i>
              <i data-plant-id="${plant.id}" data-plant-name="${plant.plant_name}" class="action-icon fa-solid fa-trash delete-plant"></i>
            </div>
          </div>
          `;
        });
      }

      checkWateringDate();
      checkFertilizationDate();

      const wateringPlantButtons = document.querySelectorAll(".water-plant");
      wateringPlantButtons.forEach((button) => {
        button.addEventListener("click", waterPlant);
      });

      const fertilizePlantButtons =
        document.querySelectorAll(".fertilize-plant");
      fertilizePlantButtons.forEach((button) => {
        button.addEventListener("click", fertilizePlant);
      });

      const deletePlantButtons = document.querySelectorAll(".delete-plant");
      deletePlantButtons.forEach((button) => {
        button.addEventListener("click", deletePlant);
      });
    });
}

async function waterPlant(evt) {
  const plantId = evt.currentTarget.getAttribute("data-plant-id");
  const plantName = evt.currentTarget.getAttribute("data-plant-name");
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
      createCalendarEvent(plantName, nextWateringUpdated);
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
}

async function fertilizePlant(evt) {
  const plantId = evt.currentTarget.getAttribute("data-plant-id");
  let plantLastFertilization = document.querySelector(
    `#plant-id-${plantId} #plant-last-fertilization`
  ).textContent;
  const plantFertilizationFrequency = document.querySelector(
    `#plant-id-${plantId} #plant-fertilization-frequency`
  ).textContent;

  const today = new Date();
  const todayFormatted = dateFormatter(today);

  if (plantLastFertilization == todayFormatted) {
    alert("Planta já fertilizada no dia de hoje!");
    return;
  } else {
    const nextFertilizationUpdated = nextDateCalculator(
      todayFormatted,
      plantFertilizationFrequency
    );

    try {
      const response = await fetch(`/plants/${plantId}/fertilize`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastFertilization: todayFormatted,
          nextFertilization: nextFertilizationUpdated,
        }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar a adubagem");
      const progressBar = document.querySelector(".progress-bar");
      progressBar.style.display = "block";
      progressBar.innerHTML = `Planta adubada com sucesso! <div class="progress-background"></div>`;
      setTimeout(() => {
        progressBar.style.display = "none";
      }, 3000);
      renderPlants();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar a rega da planta no banco!");
    }
  }
}

async function deletePlant(evt) {
  const deleteModal = document.querySelector(".delete-plant-modal");
  deleteModal.classList.remove("hidden");
  setTimeout(() => deleteModal.classList.add("show"), 3);

  const closeDeleteModalBtn = document.querySelector(".close-delete-modal");
  closeDeleteModalBtn.addEventListener("click", () => {
    deleteModal.classList.remove("show");
    deleteModal.addEventListener(
      "transitionend",
      () => {
        deleteModal.classList.add("hidden");
      },
      { once: true }
    );
  });
  const plantId = evt.currentTarget.getAttribute("data-plant-id");
  const plantName = evt.currentTarget.getAttribute("data-plant-name");
  const plantToDelete = document.querySelector("#delete-plant-name");
  plantToDelete.innerHTML = "";
  plantToDelete.innerHTML = plantName;

  const confirmDeleteButton = document.querySelector("#confirm-delete");

  confirmDeleteButton.addEventListener(
    "click",
    async () => {
      try {
        const response = await fetch(`/plants/${plantId}/delete`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Erro ao deletar a planta");
        const progressBar = document.querySelector(".progress-bar");
        progressBar.style.display = "block";
        progressBar.innerHTML = `Planta deletada com sucesso! <div class="progress-background"></div>`;
        setTimeout(() => {
          progressBar.style.display = "none";
        }, 3000);
        deleteModal.classList.add("hidden");
        renderPlants();
      } catch (error) {
        console.error(error);
        alert("Erro ao deletar a planta no banco!");
      }
    },
    { once: true }
  );
}

async function createCalendarEvent(plantName, date) {
  try {
    const response = await fetch("/createCalendarEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantName, date }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Evento criado no Calendar:", result.link);
    } else {
      console.error("Erro ao criar evento:", result.message);
    }
  } catch (error) {
    console.error("Erro ao chamar backend:", error);
  }
}

function checkWateringDate() {
  const renderedNextWateringDate = document.querySelector("#plant-next-watering").textContent
  const nextWateringDateSpan = document.querySelector('#plant-next-watering')
  const lastWateringDate = unformatDate(renderedNextWateringDate)
  const today = new Date();
  const nextWateringDay = String(lastWateringDate.getDate()).padStart(2, "0")
  const todayDay = String(today.getDate()).padStart(2, "0");

 if(todayDay >= nextWateringDay) {
  nextWateringDateSpan.classList.add("alert-date");
 }
}

function checkFertilizationDate() {
  const renderedNextFertilizationDate = document.querySelector("#plant-next-fertilization").textContent
  const nextFertilizationDateSpan = document.querySelector('#plant-next-fertilization')
  const lastFertilizationDate = unformatDate(renderedNextFertilizationDate)
  const today = new Date();
  const nextFertilizationDay = String(lastFertilizationDate.getDate()).padStart(2, "0")
  const todayDay = String(today.getDate()).padStart(2, "0");

 if(todayDay >= nextFertilizationDay) {
  nextFertilizationDateSpan.classList.add("alert-date");
 }
}

renderPlants();
