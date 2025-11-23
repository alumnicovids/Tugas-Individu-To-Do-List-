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
const searchInput = document.getElementById("search-input");
const dueDateInput = document.getElementById("due-date-input");

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
    const deadlineElement = item.querySelector(".todo-deadline");
    const fullText = deadlineElement.textContent;
    const dateAttribute = item.getAttribute("data-duedate") || "";

    tasks.push({
      text: item.querySelector(".todo-text").textContent,
      completed: item.classList.contains("text-completed"),
      dueDate: dateAttribute,
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
      addTask(task.text, task.completed, task.dueDate || "");
    });

    updateStats();
  } catch (e) {
    console.error("Gagal memuat tugas dari localStorage:", e);
    localStorage.removeItem("tasks");
  }
}

function addTask(text, isCompleted = false, dueDate = "") {
  const li = document.createElement("li");
  li.className = "todo-item";

  li.setAttribute("data-duedate", dueDate);

  if (isCompleted) {
    li.classList.add("text-completed");
  }

  reRenderTaskContent(li, text, dueDate, isCompleted);

  list.appendChild(li);

  if (!isCompleted) {
    saveTasks();
  }
}

function saveTasks() {
  const items = list.querySelectorAll(".todo-item");
  const tasks = [];

  items.forEach((item) => {
    tasks.push({
      text: item.querySelector(".todo-text").textContent,
      completed: item.classList.contains("text-completed"),
      dueDate: item.getAttribute("data-duedate") || "",
    });
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const text = input.value.trim();
  const dueDate = dueDateInput.value;

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
  addTask(text, false, dueDate);
  input.value = "";
  dueDateInput.value = "";
  updateStats();
  saveTasks();
});

list.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li) return;

  if (e.target.classList.contains("btn-complete")) {
    li.classList.toggle("text-completed");

    const currentText = li.querySelector(".todo-text").textContent;
    const currentDueDate = li.getAttribute("data-duedate") || "";
    const isCompleted = li.classList.contains("text-completed");

    reRenderTaskContent(li, currentText, currentDueDate, isCompleted);

    updateStats();
    saveTasks();
  }

  if (e.target.classList.contains("btn-edit")) {
    const originalText = li.querySelector(".todo-text").textContent;
    const originalDate = li.getAttribute("data-duedate") || "";
    const isCompleted = li.classList.contains("text-completed");

    const newText = prompt("Edit nama tugas:", originalText);

    if (newText === null) return;

    const trimmedText = newText.trim();
    if (trimmedText === "") {
      alert("Nama tugas tidak boleh kosong.");
      return;
    }

    const isDuplicate = [...list.children].some((item) => {
      const text = item.querySelector(".todo-text").textContent;
      return text === trimmedText && item !== li;
    });

    if (isDuplicate) {
      alert("Tugas dengan nama tersebut sudah ada.");
      return;
    }

    let newDate = prompt(
      "Edit tenggat waktu (YYYY-MM-DD, kosongkan jika tidak ada):",
      originalDate
    );

    if (newDate === null) {
      newDate = originalDate;
    }

    newDate = newDate.trim();

    li.setAttribute("data-duedate", newDate);

    reRenderTaskContent(li, trimmedText, newDate, isCompleted);

    saveTasks();
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

function filterTasks() {
  const searchText = searchInput.value.trim().toLowerCase();

  const activeStatusBtn = filter.querySelector("button[data-filters].active");
  const filterType = activeStatusBtn ? activeStatusBtn.dataset.filters : "all";

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isDateSearch = dateRegex.test(searchText);

  const items = list.querySelectorAll(".todo-item");

  items.forEach((item) => {
    const itemText = item.querySelector(".todo-text").textContent.toLowerCase();
    const isCompleted = item.classList.contains("text-completed");
    const itemDueDate = item.getAttribute("data-duedate");

    let matchesSearchOrDate = true;

    if (searchText !== "") {
      if (isDateSearch) {
        matchesSearchOrDate = itemDueDate === searchText;
      } else {
        matchesSearchOrDate = itemText.includes(searchText);
      }
    }

    let matchesStatus = true;
    if (filterType === "active") matchesStatus = !isCompleted;
    if (filterType === "completed") matchesStatus = isCompleted;

    if (matchesSearchOrDate && matchesStatus) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

searchInput.addEventListener("input", filterTasks);

filter.addEventListener("click", function (e) {
  if (!e.target.dataset.filters) return;

  const clickedButton = e.target;
  const isActive = clickedButton.classList.contains("active");

  const buttons = filter.querySelectorAll("button");
  buttons.forEach((btn) => btn.classList.remove("active"));

  if (!isActive) {
    clickedButton.classList.add("active");
  }

  filterTasks();
});

function reRenderTaskContent(li, text, dueDate, isCompleted) {
  const today = new Date().setHours(0, 0, 0, 0);
  const deadlineDate = dueDate ? new Date(dueDate).setHours(0, 0, 0, 0) : null;
  const isExpired = deadlineDate && deadlineDate < today && !isCompleted;

  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Tidak ada tenggat";

  li.innerHTML = `
    <div class="todo-item-details">
        <span class="todo-text">${text}</span>
        <span class="todo-deadline ${isExpired ? "expired" : ""}">
            Tenggat: ${formattedDate}
        </span>
    </div>
    <div>
      <button class="btn-complete">${isCompleted ? "Batal" : "Selesai"}</button>
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Hapus</button>
    </div>
  `;
}

loadTheme();
loadTasks();
