// ------------------ ↓ GLOBAL VARIABLES (ALLOWED TO BE USED IN EVERY FUNCTION ONWARDS) ↓ ------------------
const taskForm = document.getElementById('taskForm');
const toDoList = document.getElementById('toDoList');
const completedList = document.getElementById('completedList');
const url = "http://localhost:3000";


// ------------------------------ ↓ GENERAL FUNCTIONS TO BE USED THROUGHOUT ↓ ------------------------------
function resetForm() {   // !! Create the displayTasks() function 1st before adding this !!
  taskForm.reset();
}


// ------------------------------- ↓ GENERAL EVENT LISTENERS (TRIGGERS) ↓ ----------------------------------
// Reset tasks to be sorted by default when the page loads
const sortButton = document.getElementById("sortSelect");
window.addEventListener("DOMContentLoaded", () => {
  sortButton.value = "default";
});
sortButton.addEventListener('change', () => {
  displayTasks();
});

window.addEventListener("DOMContentLoaded", () => {   // !! Create the displayTasks() function 1st before adding this !!
  displayTasks();
});


// ----------------------------- ↓ EVENT LISTENERS (TRIGGERS) FOR TASKS ↓ ---------------------------------
// to create a new task
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createNewTask();
});

// DONT DO THE OTHER EVENT LISTENERS YET UNTIL YOU DO THE APPROPRIATE FUNCTIONS FOR THEM FIRST ↓
[toDoList, completedList].forEach(list => {
  list.addEventListener('click', (event) => {
    if (event.target.classList.contains("done")) {                  // Completes the task when 'Done' button is clicked
      const taskId = event.target.getAttribute("data-id");
      completeTask(taskId);
    }
    else if (event.target.classList.contains("notDone")) {         // Marks the task as not completed when 'Not done' button is clicked
      const taskId = event.target.getAttribute("data-id");
      taskNotCompleted(taskId);
    }
   
    else if (event.target.classList.contains("delete")) {           // Deletes the task when 'Delete' button is clicked
      const taskId = event.target.getAttribute("data-id");
      deleteTask(taskId);
    }
    else if (event.target.classList.contains('edit')) { // Opens the edit task modal
      // Group task data
      const task = {
        id: event.target.getAttribute('data-id'),
        title: event.target.getAttribute('data-title'),
        description: event.target.getAttribute('data-description'),
        dueDate: new Date(event.target.getAttribute('data-due-date'))
      };
      // Group modal elements
      const modal = {
        titleInput: document.getElementById('editTaskName'),
        descriptionInput: document.getElementById('editTaskDescription'),
        dueDateInput: document.getElementById('editDueDate'),
        saveButton: document.getElementById('saveButton')
      };
      // Fill modal inputs
      modal.titleInput.value = task.title;
      modal.descriptionInput.value = task.description;
      modal.dueDateInput.value = task.dueDate.toISOString().split('T')[0];
      // Save changes
      modal.saveButton.addEventListener('click', async () => {
        await editTask(task.id);
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
      }, { once: true });
    }
  });
});


// --------------------------------------------- ↓ TASK FUNCTIONS ↓ ---------------------------------------------
// Retrieving tasks from api.js file (tasks array) ↓
async function displayTasks() {
  const sortSelect = document.getElementById('sortSelect');
  const sortBy = sortSelect.value; // 'dueDate', 'dateCreated', or 'default'
  let query = '';
  if (sortBy !== 'default') {
    query = `?sortBy=${sortBy}`;
  }
  try {
    const response = await fetch(`${url}/api/tasks${query}`);
    if (!response.ok) {
      throw new Error(`Failed to get tasks: ${response.status}`);
    }
    const data = await response.json();
   
    function formatTask(task) {
      const li = document.createElement("li");
      li.classList.add("card", "p-3", "shadow-sm", "mt-2");
      const done = task.completed ? "text-decoration-line-through opacity-50" : "";  // Class list if task is completed or not
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <h4 class="${done} col-11">${task.title}</h4>
          <button data-id="${task._id}" type="button" class="btn-close delete" aria-label="Close"></button>
        </div>
        <p class="${done}">${task.description}</p>
        <p class="${done}"><strong>Due: </strong>${new Date(task.dueDate).toLocaleDateString()}</p>
        <div class="d-flex justify-content-between align-items-end">
          <div>
            ${
              task.completed ?
              `<button data-id="${task._id}" class="btn btn-primary shadow-sm notDone" type="button">Not done</button>`
              :
              `
                <button data-bs-toggle="modal" data-bs-target="#editModal" data-title="${task.title}" data-description="${task.description}" data-due-date="${task.dueDate}" data-id="${task._id}" class="btn btn-primary shadow-sm edit" type="button">Edit</button>
                <button data-id="${task._id}" class="btn btn-primary shadow-sm done" type="button">Done</button>
              `
            }
          </div>
          <p class="m-0 ${done}"><strong>Created on: </strong>${new Date(task.dateCreated).toLocaleDateString()}</p>
        </div>
      `;
      return li;
    }
    toDoList.innerHTML = "";
    completedList.innerHTML = "";
    const tasks = data;
    tasks.forEach(task => {
      const formattedTask = formatTask(task);
      task.completed ? completedList.appendChild(formattedTask) : toDoList.appendChild(formattedTask);
    });
    resetForm();
  } catch (error) {
    console.error("Error: ", error);
  }
}




// Creating new temporary tasks in index.js file ↓
async function createNewTask() {
   
  const taskDetails = {
    title: taskForm.taskName.value.trim(),
    description: taskForm.taskDescription.value.trim(),
    dueDate: taskForm.dueDate.value
  }
  if (!taskDetails.title || !taskDetails.description || !taskDetails.dueDate) {
    return alert("All fields required!");
  }
  try {
    const response = await fetch(`${url}/api/tasks/todo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskDetails)
    });
    if (!response.ok) {
      throw new Error(`Failed to post task: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    displayTasks();
  } catch (error) {
    console.error("Error:", error);
  }
}




// marks task as completed ↓
async function completeTask(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/complete/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ completed: true })
    });
    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.status}`);
    }
    const data = await response.json();
    console.log("Task completed:", data);
    displayTasks();
  }
  catch (error) {
    console.error("Error:", error);
  }
};




// marks task as not complete ↓
async function taskNotCompleted(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/notComplete/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ completed: false })
    });
    if (!response.ok) {
      throw new Error(`Failed to make task incomplete: ${response.status}`);
    }
    const data = await response.json();
    console.log("Task not complete:", data);
    displayTasks();
     
  } catch (error) {
    console.error("Error:", error);
  }
};




// delete task ↓
async function deleteTask(taskId) {
  try {
    const response = await fetch(`${url}/api/tasks/delete/${taskId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.status}`);
    }
    const data = await response.json();
    console.log({ message: "Deleted Task:", task: data });
    displayTasks();
   
  } catch (error) {
    console.error("Error:", error);
  }
};


// enables editing of the task ↓
async function editTask(taskId) {
  const updatedDetails = {    
    title: document.getElementById('editTaskName').value.trim(),
    description: document.getElementById('editTaskDescription').value.trim(),
    dueDate: document.getElementById('editDueDate').value
  };
  if (!updatedDetails.title || !updatedDetails.description || !updatedDetails.dueDate) {
    return alert("All fields required!");
  }
 
  try {
    const response = await fetch(`${url}/api/tasks/update/${taskId}`, {    
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedDetails)
    });
    if (!response.ok) {
      throw new Error(`Failed to edit task: ${response.status}`);
    }
    const data = await response.json();        
    console.log("Edited Task:", data);  
    displayTasks();
  } catch (error) {
    console.error("Error:", error);
  }
};