const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    projectId: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    state: {
        type: String,
        required: true
    },

    district: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    projectType: {
        type: String,
        required: true
    },

    landRequired: {
        type: Number,
        required: true
    },

    landAcquired: {
        type: Number,
        required: true
    },

    progress: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Project", projectSchema);