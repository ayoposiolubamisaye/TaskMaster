// client/src/App.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";

function App() {
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTask, setNewTask] = useState("");
    const [newTaskStartTime, setNewTaskStartTime] = useState("00:00");
    const [newTaskEndTime, setNewTaskEndTime] = useState("00:00");
    const [newTaskPriority, setNewTaskPriority] = useState("medium");
    const [theme, setTheme] = useState("default"); // State for selected theme

    // Define color themes
    const themes = {
        default: {
            backgroundColor: "#f0f0f0",
            textColor: "#333",
            buttonColor: "#007bff",
        },
        dark: {
            backgroundColor: "#333",
            textColor: "#fff",
            buttonColor: "#6c757d",
        },
        pastel: {
            backgroundColor: "#f9f3f0",
            textColor: "#666",
            buttonColor: "#82c4c3",
        },
     
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5002/plan?date=${
                    selectedDate.toISOString().split("T")[0]
                }`
            );
            const tasksData = response.data;
            setTasks(tasksData);

            // Store tasks in local storage
            localStorage.setItem("tasks", JSON.stringify(tasksData));
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const handleAddTask = async () => {
        if (newTask) {
            const formattedDate = selectedDate.toISOString()
                                              .split("T")[0];
            const startTime = newTaskStartTime;
            const endTime = newTaskEndTime;
            const priority = newTaskPriority; // Include task priority

            try {
                // Add the new task
                await axios.post("http://localhost:5002/plan", {
                    date: formattedDate,
                    todo: newTask,
                    startTime,
                    endTime,
                    priority, // Include priority in the request
                });

                // Fetch tasks after adding the new task
                await fetchTasks();

                // Clear the input fields
                setNewTask("");
                setNewTaskStartTime("00:00");
                setNewTaskEndTime("00:00");
                setNewTaskPriority("medium"); // Reset priority
            } catch (error) {
                console.error("Error adding task:", error);
            }
        }
    };

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const handleDeleteTask = async (taskId) => {
        try {
            await axios.delete(`http://localhost:5002/plan/${taskId}`);

            // Update state by removing the deleted task
            setTasks((prevTasks) =>
                prevTasks.filter((task) => task._id !== taskId)
            );
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleCompleteTask = async (taskId, taskIndex) => {
        try {
            // Send a request to mark the task as completed on the server
            await axios.patch(`http://localhost:5002/plan/${taskId}`, {
                completed: true,
            });

            // Fetch the updated tasks from the server after completion
            await fetchTasks();

            setTasks((prevTasks) => {
                const updatedTasks = [...prevTasks];
                updatedTasks[taskIndex].completed = true;
                return updatedTasks;
            });
        } catch (error) {
            console.error("Error marking task as completed:", error);
        }
    };

    useEffect(() => {
        // Retrieve tasks from local storage on component mount
        const storedTasks = localStorage.getItem("tasks");
        if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
        } else {
            fetchTasks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }, [tasks]);

    const changeTheme = (selectedTheme) => {
        setTheme(selectedTheme);
    };

    return (
        <div className="App" style={{ backgroundColor: themes[theme].backgroundColor }}>
            <nav>
                <div className="logo">Daily Planner App</div>
                <div className="theme-selector">
                    <label>Select Theme: </label>
                    <select
                        value={theme}
                        onChange={(e) => changeTheme(e.target.value)}
                    >
                        {Object.keys(themes).map((theme) => (
                            <option key={theme} value={theme}>
                                {theme}
                            </option>
                        ))}
                    </select>
                </div>
            </nav>
            <div className="content" style={{ color: themes[theme].textColor }}>
                <div className="hero-section">
                    <div className="left-part">
                        <div className="calendar-container">
                            <Calendar
                                onChange={handleDateClick}
                                value={selectedDate}
                                onClickDay={() => { }}
                            />
                        </div>
                    </div>
                    <div className="right-part">
                        <div className="tasks">
                            <h2>Tasks for {selectedDate.toDateString()}</h2>
                            <ul>
                                {tasks
                                    .filter(
                                        (task) =>
                                            task.date ===
                                            selectedDate
                                                .toISOString()
                                                .split("T")[0]
                                    )
                                    .map((task, index) => (
                                        <li
                                            key={index}
                                            style={{
                                                backgroundColor: task.completed
                                                    ? "lightgreen"
                                                    : "inherit",
                                            }}
                                        >
                                            <div className="task-details">
                                                <span className="task-text">
                                                    {task.todo}
                                                </span>
                                                {task.startTime &&
                                                    task.endTime && (
                                                        <span className="time-range">
                                                            {task.startTime} -{" "}
                                                            {task.endTime}
                                                        </span>
                                                    )}
                                                <span className="priority">{task.priority}</span> {/* Display priority */}
                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDeleteTask(
                                                            task._id
                                                        )
                                                    }
                                                    style={{ backgroundColor: themes[theme].buttonColor }}
                                                >
                                                    X
                                                </button>
                                                {!task.completed && (
                                                    <button
                                                        className="complete-button"
                                                        onClick={() =>
                                                            handleCompleteTask(
                                                                task._id,
                                                                index
                                                            )
                                                        }
                                                        style={{ backgroundColor: themes[theme].buttonColor }}
                                                    >
                                                        &#10004;
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                            <div className="add-task">
                                <input
                                    type="text"
                                    placeholder="Add a new task"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                />
                                <div className="time-inputs">
                                    <input
                                        type="time"
                                        value={newTaskStartTime}
                                        onChange={(e) =>
                                            setNewTaskStartTime(e.target.value)
                                        }
                                    />
                                    <span>-</span>
                                    <input
                                        type="time"
                                        value={newTaskEndTime}
                                        onChange={(e) =>
                                            setNewTaskEndTime(e.target.value)
                                        }
                                    />
                                </div>
                                <select
                                    value={newTaskPriority}
                                    onChange={(e) => setNewTaskPriority(e.target.value)}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                <button onClick={handleAddTask}>
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;