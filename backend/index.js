
// Dependencies
require("dotenv").config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); //Change

// App set up 
const port = 3000;
const app = express();

//Middlewarw set up 
app.use(express.json());
app.use(cors());

// --------------------- Mongo Setup ---------------//

(async () => {
    try{
       mongoose.set("autoIndex", false);

       // ------ Attempt to connect to cluster -----------//
       await mongoose.connect(process.env.MONGO_URI);
       console.log(" MongoDB connected!");

      await Task.syncIndexes();
     console.log("Indexes synced!");

       // App startup //
        app.listen(port, () =>{
        console.log(`To Do App Listening on port ${port}`);
      });

      // Sync indexes 
       await Task.syncIndexes();
       console.log(" MongoDB connected!");

    }

    catch (error) {
        console.error(`Startup error ${error}`);

    }
})();

// -------------- Define the task shema
const taskSchema = new mongoose.Schema({
    title: {type: String, required: true},
    completed: {type: Boolean, required: true, default: false},
    description: {type: String, required: true}, // Might need to be a type String
    dueDate: {type: Date, required: true},
    dateCreated: { type: Date, default: Date.now }
});

// define indexes for sorting 
taskSchema.index({ dueDate: 1 });
taskSchema.index({ dateCreated: 1});

const Task = mongoose.model("Task", taskSchema);


// ---------------- API routes ------------------------- //


// Get all tasks 

app.get('/api/tasks', async (req, res) => {
  try {
    const { sortBy } = req.query; // ?sortBy=dueDate or ?sortBy=dateCreated
    let sortOption = {};
    if (sortBy === 'dueDate') {
        sortOption = { dueDate: 1 }; // Ascending
    } else if (sortBy === 'dateCreated') {
        sortOption = { dateCreated: 1 };
    }
    const tasks = await Task.find({}).sort(sortOption);
    if (!tasks) {
      return res.status(404).json({ message: "Tasks not found!" });
    }
    res.json(tasks);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error grabbing tasks!" });
  }
});

// Create a new task and add it to the task array/list

app.post('/api/tasks/todo', async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const taskData = { title, description, dueDate };
    const createTask = new Task(taskData);
    const newTask = await createTask.save();
    res.json({ task: newTask, message: "New task created successfully!" });
     
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error creating the task!" });
  }
});

// To 'complete' the task and move columns ↓  
app.patch('/api/tasks/complete/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const taskId = req.params.id;
    const completedTask = await Task.findByIdAndUpdate(taskId, { completed }, { new: true });
    if (!completedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: completedTask, message: "Task set to 'Complete'" });
     
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error completing the task!" });
  }
});

// To make the task 'not complete' and move columns ↓
app.patch('/api/tasks/notComplete/:id', async (req, res) => {
  try {
    const { completed } = req.body;
    const taskId = req.params.id;
    const taskNotComplete = await Task.findByIdAndUpdate(taskId, { completed }, { new: true });
    if (!taskNotComplete) {
      return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: taskNotComplete, message: "Task set to 'Not Complete'" });
     
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error making the task NOT complete!" });
  }
});

// To delete the task  ↓
app.delete('/api/tasks/delete/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: deletedTask, message: "Task deleted successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error deleting the task!" });
  }
});

// To edit exisiting task and update
app.put('/api/tasks/update/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, dueDate } = req.body;  // Extract data from front end request
    const taskData = { title, description, dueDate };
    const updatedTask = await Task.findByIdAndUpdate(taskId, taskData, { new: true });
    if (!updatedTask) {
        return res.status(404).json({ message: "Task not found!" });
    }
    res.json({ task: updatedTask, message: "Task updated successfully!" });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: "Error updating the task!" });
  }
});


