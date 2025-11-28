const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const error = document.getElementById("error-message");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statActive = document.getElementById("stat-active");
const filter = document.getElementById("todo-filters");
const body = document.body;
const searchInput = document.getElementById("search-input");
const dueDateInput = document.getElementById("due-date-input");
const sortButton = document.getElementById("sort-by-due-date");
const themeButton = document.getElementById("theme-cycle-button");
const THEMES = ["latte", "night", "aqua", "forest", "cyberpunk", "pink"];

const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editTaskInput = document.getElementById("edit-task-input");
const editDateInput = document.getElementById("edit-date-input");
const cancelEditButton = document.getElementById("cancel-edit-btn");
let currentEditLi = null;

function applyTheme(theme) {
  body.className = theme;
  localStorage.setItem("theme", theme);

  if (themeButton) {
    const themeName =
      theme.charAt(0).toUpperCase() + theme.slice(1).replace("-", " ");
    themeButton.textContent = "Tema: " + themeName;
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "latte";

  if (!THEMES.includes(savedTheme)) {
    applyTheme("latte");
  } else {
    applyTheme(savedTheme);
  }
}

if (themeButton) {
  themeButton.addEventListener("click", function () {
    const currentTheme = body.className;
    const currentIndex = THEMES.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const newTheme = THEMES[nextIndex];

    applyTheme(newTheme);
  });
}

function loadTasks() {
  const savedTasks = localStorage.getItem("tasks");
  if (!savedTasks) return;

  try {
    const tasks = JSON.parse(savedTasks);
    list.innerHTML = "";

    tasks.forEach((task) => {
      addTask(task.text, task.completed, task.dueDate || "", false);
    });

    updateStats();
    filterTasks();
  } catch (e) {
    console.error("Gagal memuat tugas dari localStorage:", e);
    localStorage.removeItem("tasks");
  }
}

function addTask(text, isCompleted = false, dueDate = "", isNewTask = true) {
  const li = document.createElement("li");
  li.className = "todo-item";

  li.setAttribute("data-duedate", dueDate);

  if (isCompleted) {
    li.classList.add("text-completed");
  }

  reRenderTaskContent(li, text, dueDate, isCompleted);

  list.appendChild(li);

  if (isNewTask) {
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
    (item) =>
      item.querySelector(".todo-text").textContent.toLowerCase() ===
      text.toLowerCase()
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
  filterTasks();
});

list.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li) return;
  if (e.target.classList.contains("btn-complete")) {
    li.classList.toggle("text-completed");
    const isCompleted = li.classList.contains("text-completed");
    const completeButton = e.target;
    completeButton.textContent = isCompleted ? "Batal" : "Selesai";
    const currentText = li.querySelector(".todo-text").textContent;
    const currentDueDate = li.getAttribute("data-duedate") || "";

    reRenderTaskContent(li, currentText, currentDueDate, isCompleted);

    updateStats();
    saveTasks();
    filterTasks();
    return;
  }

  if (e.target.classList.contains("btn-edit")) {
    currentEditLi = li;
    const originalText = li.querySelector(".todo-text").textContent;
    const originalDate = li.getAttribute("data-duedate") || "";

    editTaskInput.value = originalText;
    editDateInput.value = originalDate;

    editModal.classList.add("open");
    editModal.style.display = "flex";
    editTaskInput.focus();
    return;
  }

  if (e.target.classList.contains("btn-delete")) {
    const confirmDelete = confirm(
      "Apakah Anda yakin ingin menghapus tugas ini?"
    );
    if (!confirmDelete) return;
    li.remove();
    updateStats();
    saveTasks();
    filterTasks();
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

function sortTasks(preventToggle = false) {
  const items = Array.from(list.querySelectorAll(".todo-item"));
  let currentOrder = sortButton.getAttribute("data-sort-order");

  if (!preventToggle) {
    if (!sortButton.classList.contains("active")) {
      sortButton.classList.add("active");
      currentOrder = "asc";
    } else {
      if (currentOrder === "asc") {
        currentOrder = "desc";
      } else {
        sortButton.classList.remove("active");
        sortButton.setAttribute("data-sort-order", "asc");
        sortButton.textContent = "Urutkan Tenggat";

        loadTasks();
        filterTasks();
        return;
      }
    }
  }

  if (!sortButton.classList.contains("active")) {
    filterTasks();
    return;
  }

  const sortedItems = items.sort((a, b) => {
    const dateA = a.getAttribute("data-duedate");
    const dateB = b.getAttribute("data-duedate");

    const timeA = dateA ? new Date(dateA).getTime() : Infinity;
    const timeB = dateB ? new Date(dateB).getTime() : Infinity;

    const aIsHidden = a.style.display === "none";
    const bIsHidden = b.style.display === "none";

    if (aIsHidden && bIsHidden) return 0;
    if (aIsHidden) return 1;
    if (bIsHidden) return -1;

    if (currentOrder === "asc") {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });

  list.innerHTML = "";
  sortedItems.forEach((item) => list.appendChild(item));

  sortButton.setAttribute("data-sort-order", currentOrder);
  sortButton.textContent =
    currentOrder === "asc" ? "Tenggat Terdekat ⬇️" : "Tenggat Terjauh ⬆️";
}

function filterTasks() {
  const searchText = searchInput.value.trim().toLowerCase();
  const activeStatusBtn = filter.querySelector("button[data-filters].active");
  const filterType = activeStatusBtn ? activeStatusBtn.dataset.filters : "all";
  const items = list.querySelectorAll(".todo-item");

  items.forEach((item) => {
    const itemText = item.querySelector(".todo-text").textContent.toLowerCase();
    const isCompleted = item.classList.contains("text-completed");
    const itemDueDate = item.getAttribute("data-duedate");

    let matchesSearch = false;

    if (searchText === "") {
      matchesSearch = true;
    } else {
      if (itemText.includes(searchText)) {
        matchesSearch = true;
      }
      if (itemDueDate && itemDueDate.includes(searchText)) {
        matchesSearch = true;
      }
      if (itemDueDate) {
        const parts = itemDueDate.split("-");
        if (parts.length === 3) {
          const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          if (formattedDate.includes(searchText)) {
            matchesSearch = true;
          }
        }
      }
    }

    let matchesStatus = true;
    if (filterType === "active") matchesStatus = !isCompleted;
    if (filterType === "completed") matchesStatus = isCompleted;

    if (matchesSearch && matchesStatus) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });

  if (sortButton.classList.contains("active")) {
    sortTasks(true);
  }
}

searchInput.addEventListener("input", filterTasks);

filter.addEventListener("click", function (e) {
  const clickedButton = e.target;
  if (clickedButton.id === "sort-by-due-date") {
    sortTasks();
    saveTasks();
    return;
  }
  if (!clickedButton.dataset.filters) return;

  const isActive = clickedButton.classList.contains("active");
  const buttons = filter.querySelectorAll("button[data-filters]");
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

  const buttonDiv = li.querySelector("div:last-child");
  li.innerHTML = `
    <div class="todo-item-details">
        <span class="todo-text">${text}</span>
        <span class="todo-deadline ${isExpired ? "expired" : ""}">
            Tenggat: ${formattedDate}
        </span>
    </div>
  `;

  if (!buttonDiv) {
    const newButtonDiv = document.createElement("div");
    newButtonDiv.innerHTML = `
      <button class="btn-complete">${isCompleted ? "Batal" : "Selesai"}</button>
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Hapus</button>
    `;
    li.appendChild(newButtonDiv);
  } else {
    const completeButton = buttonDiv.querySelector(".btn-complete");
    if (completeButton) {
      completeButton.textContent = isCompleted ? "Batal" : "Selesai";
    }
    li.appendChild(buttonDiv);
  }
}

function closeModal() {
  editModal.classList.remove("open");
  setTimeout(() => {
    editModal.style.display = "none";
  }, 300);
  currentEditLi = null;
}

editForm.addEventListener("submit", function (e) {
  e.preventDefault();

  if (!currentEditLi) return;

  const newText = editTaskInput.value.trim();
  const newDate = editDateInput.value.trim();
  const isCompleted = currentEditLi.classList.contains("text-completed");

  if (newText === "") {
    alert("Nama tugas tidak boleh kosong.");
    editTaskInput.focus();
    return;
  }

  const isDuplicate = [...list.children].some((item) => {
    const existingText = item.querySelector(".todo-text").textContent;

    return (
      existingText.toLowerCase() === newText.toLowerCase() &&
      item !== currentEditLi
    );
  });

  if (isDuplicate) {
    alert("Tugas dengan nama tersebut sudah ada.");
    editTaskInput.focus();
    return;
  }

  currentEditLi.setAttribute("data-duedate", newDate);
  reRenderTaskContent(currentEditLi, newText, newDate, isCompleted);

  saveTasks();
  filterTasks();
  closeModal();
});

cancelEditButton.addEventListener("click", closeModal);

editModal.addEventListener("click", function (e) {
  if (e.target === editModal) {
    closeModal();
  }
});

loadTheme();
loadTasks();
