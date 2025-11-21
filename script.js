const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const error = document.getElementById("error-message");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statActive = document.getElementById("stat-active");
const filter = document.getElementById("todo-filters");
const themeSwitch = document.getElementById("theme-switch");
const body = document.body;

function applyTheme(theme) {
  body.className = theme;
  localStorage.setItem("theme", theme);
  themeSwitch.checked = theme === "night";
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "latte";
  applyTheme(savedTheme);
}

themeSwitch.addEventListener("change", function () {
  const newTheme = this.checked ? "night" : "latte";
  applyTheme(newTheme);
});

function saveTasks() {
  const items = list.querySelectorAll(".todo-item");
  const tasks = [];

  items.forEach((item) => {
    tasks.push({
      text: item.querySelector(".todo-text").textContent,
      completed: item.classList.contains("text-completed"),
    });
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem("tasks");
  if (!savedTasks) return;

  try {
    const tasks = JSON.parse(savedTasks);
    list.innerHTML = "";

    tasks.forEach((task) => {
      addTask(task.text, task.completed);
    });

    updateStats();
  } catch (e) {
    console.error("Gagal memuat tugas dari localStorage:", e);
    localStorage.removeItem("tasks");
  }
}

function addTask(text, isCompleted = false) {
  const li = document.createElement("li");
  li.className = "todo-item";
  if (isCompleted) {
    li.classList.add("text-completed");
  }

  li.draggable = true;
  li.innerHTML = `
    <span class="todo-text">${text}</span>
    <div>
      <button class="btn-complete">${isCompleted ? "Batal" : "Selesai"}</button>
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Hapus</button>
    </div>
  `;
  list.appendChild(li);

  if (!isCompleted) {
    saveTasks();
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (text === "") {
    error.textContent = "Tugas tidak boleh kosong.";
    return;
  }

  const duplicate = [...list.children].some(
    (item) => item.querySelector(".todo-text").textContent === text
  );

  if (duplicate) {
    error.textContent = "Tugas sudah ada.";
    return;
  }

  error.textContent = "";
  addTask(text);
  input.value = "";
  updateStats();
  saveTasks();
});

list.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li) return;

  if (e.target.classList.contains("btn-complete")) {
    li.classList.toggle("text-completed");
    e.target.textContent = li.classList.contains("text-completed")
      ? "Batal"
      : "Selesai";
    updateStats();
    saveTasks();
  }

  if (e.target.classList.contains("btn-edit")) {
    const span = li.querySelector(".todo-text");
    const originalText = span.textContent;
    const newText = prompt("Edit tugas:", originalText);

    if (newText && newText.trim() !== "") {
      const trimmed = newText.trim();
      const isDuplicate = [...list.children].some((item) => {
        const text = item.querySelector(".todo-text").textContent;
        return text === trimmed && item !== li;
      });

      if (isDuplicate) {
        alert("Tugas dengan nama tersebut sudah ada.");
        return;
      }

      span.textContent = trimmed;
      saveTasks();
    }
  }

  if (e.target.classList.contains("btn-delete")) {
    li.remove();
    updateStats();
    saveTasks();
  }
});

function updateStats() {
  const items = list.querySelectorAll(".todo-item");
  const total = items.length;
  const completed = [...items].filter((item) =>
    item.classList.contains("text-completed")
  ).length;
  const active = total - completed;

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statActive.textContent = active;
}

filter.addEventListener("click", function (e) {
  if (!e.target.dataset.filters) return;

  const clickedButton = e.target;
  const isActive = clickedButton.classList.contains("active");

  const buttons = filter.querySelectorAll("button");
  buttons.forEach((btn) => btn.classList.remove("active"));

  const items = list.querySelectorAll(".todo-item");

  if (isActive) {
    items.forEach((item) => (item.style.display = "flex"));
    return;
  }

  clickedButton.classList.add("active");

  const filterType = clickedButton.dataset.filters;

  items.forEach((item) => {
    const isCompleted = item.classList.contains("text-completed");

    if (filterType === "active") {
      item.style.display = isCompleted ? "none" : "flex";
    } else if (filterType === "completed") {
      item.style.display = isCompleted ? "flex" : "none";
    }
  });
});

loadTheme();
loadTasks();
