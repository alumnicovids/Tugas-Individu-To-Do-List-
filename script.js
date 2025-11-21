const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const error = document.getElementById("error-message");
const statTotal = document.getElementById("stat-total");
const statCompleted = document.getElementById("stat-completed");
const statActive = document.getElementById("stat-active");

function addTask(text) {
  const li = document.createElement("li");
  li.className = "todo-item";
  li.draggable = true;
  li.innerHTML = `
    <span class="todo-text">${text}</span>
    <div>
      <button class="btn-complete">Selesai</button>
      <button class="btn-edit">Edit</button>
      <button class="btn-delete">Hapus</button>
    </div>
  `;
  list.appendChild(li);
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
});

list.addEventListener("click", function (e) {
  const li = e.target.closest("li");

  if (e.target.classList.contains("btn-complete")) {
    li.classList.toggle("text-completed");
    e.target.textContent = li.classList.contains("text-completed")
      ? "Batal"
      : "Selesai";
    updateStats();
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
    }
  }

  if (e.target.classList.contains("btn-delete")) {
    li.remove();
    updateStats();
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
