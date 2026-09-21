const express = require("express");
const router = express.Router();

const Project = require("../models/Project");

// Get all projects
router.get("/", async (req, res) => {
    try {
        const projects = await Project.find();

        res.json(projects);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching projects",
            error: error.message
        });
    }
});

// Add a new project
router.post("/", async (req, res) => {
    try {
        const project = new Project(req.body);

        const savedProject = await project.save();

        res.status(201).json(savedProject);
    } catch (error) {
        res.status(400).json({
            message: "Error creating project",
            error: error.message
        });
    }
});

module.exports = router;