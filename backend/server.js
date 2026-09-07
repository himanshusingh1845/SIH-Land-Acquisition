const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json());

// ========================================
// CONFIG
// ========================================

const PORT = process.env.PORT || 5000;

const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/national_land_system";

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "SIH_LAND_SYSTEM_SECRET_2026";

// ========================================
// USER MODEL
// ========================================

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            required: true,
            enum: [
                "ADMINISTRATOR",
                "LAND_OFFICER",
                "LEGAL_OFFICER"
            ]
        },

        designation: {
            type: String,
            required: true
        },

        access: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: "ACTIVE"
        }
    },
    {
        timestamps: true
    }
);

const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

// ========================================
// PROJECT MODEL
// ========================================

const projectSchema = new mongoose.Schema(
    {
        projectId: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },

        projectName: {
            type: String,
            default: ""
        },

        state: {
            type: String,
            default: ""
        },

        district: {
            type: String,
            default: ""
        },

        authority: {
            type: String,
            default: ""
        },

        projectType: {
            type: String,
            default: ""
        },

        startDate: {
            type: String,
            default: ""
        },

        expectedCompletion: {
            type: String,
            default: ""
        },

        landRequiredAcres: {
            type: Number,
            default: 0
        },

        landAcquiredAcres: {
            type: Number,
            default: 0
        },

        acquisitionProgressPct: {
            type: Number,
            default: 0
        },

        projectStatus: {
            type: String,
            default: "In Progress"
        },

        riskLevel: {
            type: String,
            default: "Medium"
        },

        createdBy: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true,
        strict: false
    }
);

const Project =
    mongoose.models.Project ||
    mongoose.model("Project", projectSchema);

// ========================================
// LAND / PARCEL MODEL
// ========================================

const landSchema = new mongoose.Schema(
    {
        parcelId: {
            type: String,
            required: true,
            unique: true
        },

        projectId: {
            type: String,
            default: ""
        },

        state: {
            type: String,
            default: "Uttar Pradesh"
        },

        district: {
            type: String,
            default: ""
        },

        village: {
            type: String,
            default: ""
        },

        landType: {
            type: String,
            default: "Agricultural"
        },

        areaAcres: {
            type: Number,
            default: 0
        },

        acquisitionStatus: {
            type: String,
            default: "Pending"
        },

        litigationFlag: {
            type: String,
            default: "No"
        },

        latitude: {
            type: Number
        },

        longitude: {
            type: Number
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
        strict: false
    }
);

const Land =
    mongoose.models.Land ||
    mongoose.model("Land", landSchema);

// ========================================
// COMPENSATION MODEL
// ========================================

const compensationSchema = new mongoose.Schema(
    {
        compensationId: {
            type: String,
            required: true,
            unique: true
        },

        projectId: {
            type: String,
            default: ""
        },

        parcelId: {
            type: String,
            default: ""
        },

        ownerName: {
            type: String,
            default: ""
        },

        awardedAmount: {
            type: Number,
            default: 0
        },

        paidAmount: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            default: "Pending"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
        strict: false
    }
);

const Compensation =
    mongoose.models.Compensation ||
    mongoose.model("Compensation", compensationSchema);

// ========================================
// LEGAL CASE MODEL
// ========================================

const caseSchema = new mongoose.Schema(
    {
        caseId: {
            type: String,
            required: true,
            unique: true
        },

        projectId: {
            type: String,
            default: ""
        },

        parcelId: {
            type: String,
            default: ""
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            default: "Pending"
        },

        priority: {
            type: String,
            default: "Medium"
        },

        objectionPending: {
            type: Boolean,
            default: false
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true,
        strict: false
    }
);

const LegalCase =
    mongoose.models.LegalCase ||
    mongoose.model("LegalCase", caseSchema);

// ========================================
// PROJECT NORMALIZER
// ========================================

function normalizeProject(project) {
    const obj =
        typeof project.toObject === "function"
            ? project.toObject()
            : project;

    const required = Number(
        obj.landRequiredAcres ??
        obj.landRequired ??
        obj.requiredAcres ??
        0
    );

    const acquired = Number(
        obj.landAcquiredAcres ??
        obj.landAcquired ??
        obj.acquiredAcres ??
        0
    );

    let progress = Number(
        obj.acquisitionProgressPct ??
        obj.progress ??
        0
    );

    if (!progress && required > 0) {
        progress = (acquired / required) * 100;
    }

    progress = Math.min(
        100,
        Math.max(0, progress)
    );

    return {
        ...obj,

        projectId:
            obj.projectId || "-",

        projectName:
            obj.projectName ||
            obj.name ||
            "-",

        state:
            obj.state || "-",

        district:
            obj.district || "-",

        authority:
            obj.authority || "-",

        projectType:
            obj.projectType || "-",

        startDate:
            obj.startDate || "",

        expectedCompletion:
            obj.expectedCompletion || "",

        // IMPORTANT
        // These are the fields frontend should receive
        landRequiredAcres: required,

        landAcquiredAcres: acquired,

        acquisitionProgressPct:
            Number(progress.toFixed(2)),

        projectStatus:
            obj.projectStatus ||
            obj.status ||
            "In Progress",

        riskLevel:
            obj.riskLevel ||
            "Medium"
    };
}

// ========================================
// CREATE DEFAULT USERS
// ========================================

async function createDefaultUsers() {

    try {

        const users = [
            {
                username: "admin",
                password: "Admin@123",
                role: "ADMINISTRATOR",
                designation: "Super Admin",
                access: "Full System"
            },

            {
                username: "land.officer",
                password: "Land@123",
                role: "LAND_OFFICER",
                designation: "Government Officer",
                access: "Land & Projects"
            },

            {
                username: "legal.officer",
                password: "Legal@123",
                role: "LEGAL_OFFICER",
                designation: "Legal Officer",
                access: "Legal & Cases"
            }
        ];

        for (const userData of users) {

            const existingUser =
                await User.findOne({
                    username:
                        userData.username
                });

            if (!existingUser) {

                const hashedPassword =
                    await bcrypt.hash(
                        userData.password,
                        10
                    );

                await User.create({
                    username:
                        userData.username,

                    password:
                        hashedPassword,

                    role:
                        userData.role,

                    designation:
                        userData.designation,

                    access:
                        userData.access,

                    status: "ACTIVE"
                });

                console.log(
                    "Created user:",
                    userData.username
                );
            }
        }

        console.log(
            "Default users checked."
        );

    } catch (error) {

        console.error(
            "User creation error:",
            error
        );
    }
}

// ========================================
// CREATE SAMPLE DATA
// ========================================

async function createSampleData() {

    try {

        // --------------------------------
        // DO NOT CREATE SAMPLE PROJECTS
        // IF GOVERNMENT PROJECTS EXIST
        // --------------------------------

        const projectCount =
            await Project.countDocuments();

        console.log(
            "Projects in database:",
            projectCount
        );

        // --------------------------------
        // LAND
        // --------------------------------

        const landCount =
            await Land.countDocuments();

        if (landCount === 0) {

            await Land.insertMany([
                {
                    parcelId: "LP-1001",
                    projectId: "PRJ-001",
                    state: "Uttar Pradesh",
                    district: "Bareilly",
                    village: "Bhojipura",
                    landType: "Agricultural",
                    areaAcres: 120,
                    acquisitionStatus: "Acquired",
                    litigationFlag: "No",
                    latitude: 28.3670,
                    longitude: 79.4304
                },

                {
                    parcelId: "LP-1002",
                    projectId: "PRJ-001",
                    state: "Uttar Pradesh",
                    district: "Bareilly",
                    village: "Faridpur",
                    landType: "Agricultural",
                    areaAcres: 85,
                    acquisitionStatus: "Pending",
                    litigationFlag: "Yes",
                    latitude: 28.2080,
                    longitude: 79.5400
                },

                {
                    parcelId: "LP-1003",
                    projectId: "PRJ-002",
                    state: "Uttar Pradesh",
                    district: "Noida",
                    village: "Jewar",
                    landType: "Commercial",
                    areaAcres: 200,
                    acquisitionStatus: "Acquired",
                    litigationFlag: "No",
                    latitude: 28.1220,
                    longitude: 77.5570
                },

                {
                    parcelId: "LP-1004",
                    projectId: "PRJ-003",
                    state: "Bihar",
                    district: "Patna",
                    village: "Bihta",
                    landType: "Agricultural",
                    areaAcres: 150,
                    acquisitionStatus: "Under Review",
                    litigationFlag: "Yes",
                    latitude: 25.5610,
                    longitude: 84.8710
                },

                {
                    parcelId: "LP-1005",
                    projectId: "PRJ-004",
                    state: "Delhi",
                    district: "New Delhi",
                    village: "Dwarka",
                    landType: "Government",
                    areaAcres: 75,
                    acquisitionStatus: "Acquired",
                    litigationFlag: "No",
                    latitude: 28.5921,
                    longitude: 77.0460
                },

                {
                    parcelId: "LP-1006",
                    projectId: "PRJ-005",
                    state: "Rajasthan",
                    district: "Jaipur",
                    village: "Chomu",
                    landType: "Agricultural",
                    areaAcres: 300,
                    acquisitionStatus: "Pending",
                    litigationFlag: "No",
                    latitude: 27.9680,
                    longitude: 75.9800
                }
            ]);

            console.log(
                "Sample land parcels created."
            );
        }

        // --------------------------------
        // COMPENSATION
        // --------------------------------
        // IMPORTANT:
        // Do NOT use countDocuments() === 0
        // because existing zero-value records
        // may already exist.
        // --------------------------------

        const demoCompensations = [

            {
                compensationId: "COMP-001",
                projectId: "LA-2024-00004",
                parcelId: "LP-1001",
                ownerName: "Ramesh Kumar",
                awardedAmount: 125000000,
                paidAmount: 90000000,
                status: "Partial"
            },

            {
                compensationId: "COMP-002",
                projectId: "LA-2024-00005",
                parcelId: "LP-1003",
                ownerName: "Suresh Singh",
                awardedAmount: 85000000,
                paidAmount: 85000000,
                status: "Paid"
            },

            {
                compensationId: "COMP-003",
                projectId: "LA-2026-00006",
                parcelId: "LP-1004",
                ownerName: "Anil Kumar",
                awardedAmount: 150000000,
                paidAmount: 60000000,
                status: "Partial"
            }
        ];

        for (const item of demoCompensations) {

            await Compensation.updateOne(
                {
                    compensationId:
                        item.compensationId
                },

                {
                    $setOnInsert: item
                },

                {
                    upsert: true
                }
            );
        }

        console.log(
            "Demo compensation records checked."
        );

        // --------------------------------
        // LEGAL CASES
        // --------------------------------

        const caseCount =
            await LegalCase.countDocuments();

        if (caseCount === 0) {

            await LegalCase.insertMany([
                {
                    caseId: "CASE-001",
                    projectId: "PRJ-001",
                    parcelId: "LP-1002",
                    title: "Land Ownership Dispute",
                    description:
                        "Ownership verification pending",
                    status: "Pending",
                    priority: "High",
                    objectionPending: true
                },

                {
                    caseId: "CASE-002",
                    projectId: "PRJ-003",
                    parcelId: "LP-1004",
                    title: "Compensation Dispute",
                    description:
                        "Compensation amount challenged",
                    status: "Under Review",
                    priority: "Critical",
                    objectionPending: true
                },

                {
                    caseId: "CASE-003",
                    projectId: "PRJ-005",
                    parcelId: "LP-1006",
                    title: "Environmental Clearance",
                    description:
                        "Clearance review in progress",
                    status: "Pending",
                    priority: "Medium",
                    objectionPending: false
                }
            ]);

            console.log(
                "Sample legal cases created."
            );
        }

        console.log(
            "Sample data checked."
        );

    } catch (error) {

        console.error(
            "Sample data error:",
            error
        );
    }
}

// ========================================
// AUTH MIDDLEWARE
// ========================================

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    const token =
        authHeader &&
        authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;

    if (!token) {

        return res
            .status(401)
            .json({
                success: false,
                message:
                    "Access token required"
            });
    }

    try {

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.user = decoded;

        next();

    } catch (error) {

        return res
            .status(403)
            .json({
                success: false,
                message:
                    "Invalid or expired token"
            });
    }
}

// ========================================
// ROLE AUTHORIZATION
// ========================================

function authorizeRoles(...allowedRoles) {

    return (req, res, next) => {

        if (
            !req.user ||
            !allowedRoles.includes(
                req.user.role
            )
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message:
                        "You do not have permission"
                });
        }

        next();
    };
}

// ========================================
// HEALTH CHECK
// ========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({
            success: true,
            message:
                "Backend is running",
            database:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected"
        });
    }
);

// ========================================
// LOGIN
// ========================================

app.post(
    "/api/auth/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            if (!username || !password) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Username and password are required"
                    });
            }

            const user =
                await User.findOne({
                    username:
                        username.trim()
                });

            if (!user) {

                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Invalid username or password"
                    });
            }

            if (user.status !== "ACTIVE") {

                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "Account is inactive"
                    });
            }

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {

                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Invalid username or password"
                    });
            }

            const token =
                jwt.sign(
                    {
                        id:
                            user._id.toString(),

                        username:
                            user.username,

                        role:
                            user.role
                    },

                    JWT_SECRET,

                    {
                        expiresIn: "8h"
                    }
                );

            res.json({
                success: true,

                message:
                    "Login successful",

                token,

                user: {
                    id: user._id,
                    username:
                        user.username,
                    role:
                        user.role,
                    designation:
                        user.designation,
                    access:
                        user.access,
                    status:
                        user.status
                }
            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Server error"
                });
        }
    }
);

// ========================================
// CURRENT USER
// ========================================

app.get(
    "/api/auth/me",
    authenticateToken,
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user.id
                ).select("-password");

            if (!user) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "User not found"
                    });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Server error"
                });
        }
    }
);

// ========================================
// DASHBOARD
// ========================================

app.get(
    "/api/dashboard",
    authenticateToken,
    async (req, res) => {

        try {

            const [
                rawProjects,
                parcels,
                cases,
                compensation,
                pendingObjections,
                projectStats
            ] = await Promise.all([

                Project.find().lean(),

                Land.find().lean(),

                LegalCase.find().lean(),

                Compensation.find().lean(),

                LegalCase.countDocuments({
                    objectionPending: true
                }),

                Project.aggregate([
                    {
                        $group: {

                            _id:
                                "$projectStatus",

                            count: {
                                $sum: 1
                            },

                            landRequiredAcres: {
                                $sum: {
                                    $ifNull: [
                                        "$landRequiredAcres",
                                        0
                                    ]
                                }
                            },

                            landAcquiredAcres: {
                                $sum: {
                                    $ifNull: [
                                        "$landAcquiredAcres",
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ])
            ]);

            const projects =
                rawProjects.map(
                    normalizeProject
                );

            // --------------------------------
            // LAND TOTALS
            // --------------------------------

            const totalLandRequired =
                projects.reduce(
                    (total, project) =>
                        total +
                        Number(
                            project.landRequiredAcres || 0
                        ),
                    0
                );

            const totalLandAcquired =
                projects.reduce(
                    (total, project) =>
                        total +
                        Number(
                            project.landAcquiredAcres || 0
                        ),
                    0
                );

            const acquisitionPercentage =
                totalLandRequired > 0
                    ? (
                        totalLandAcquired /
                        totalLandRequired
                    ) * 100
                    : 0;

            // --------------------------------
            // COMPENSATION TOTALS
            // --------------------------------

            const awarded =
                compensation.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.awardedAmount || 0
                        ),
                    0
                );

            const paid =
                compensation.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.paidAmount || 0
                        ),
                    0
                );

            const pending =
                Math.max(
                    awarded - paid,
                    0
                );

            // --------------------------------
            // RISK INDEX
            // --------------------------------

            const criticalProjects =
                projects.filter(
                    project =>
                        project.riskLevel ===
                        "Critical"
                ).length;

            const highRiskProjects =
                projects.filter(
                    project =>
                        project.riskLevel ===
                        "High"
                ).length;

            const riskIndex =
                Math.min(
                    100,
                    Math.round(
                        (pendingObjections * 10) +
                        (criticalProjects * 20) +
                        (highRiskProjects * 10)
                    )
                );

            res.json({

                success: true,

                totals: {

                    projects:
                        projects.length,

                    parcels:
                        parcels.length,

                    cases:
                        cases.length,

                    landRequired:
                        totalLandRequired,

                    landAcquired:
                        totalLandAcquired,

                    acquisitionPercentage:
                        Number(
                            acquisitionPercentage.toFixed(2)
                        ),

                    awarded:
                        awarded,

                    paid:
                        paid,

                    pending:
                        pending,

                    pendingObjections:
                        pendingObjections
                },

                projectStats,

                risk: {

                    index:
                        riskIndex,

                    legalRisk:
                        Math.min(
                            100,
                            pendingObjections * 25
                        ),

                    landRecordRisk:
                        43,

                    compensationRisk:
                        56,

                    delayProbability:
                        74
                }
            });

        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Error loading dashboard",
                    error:
                        error.message
                });
        }
    }
);

// ========================================
// GET PROJECTS
// ========================================

app.get(
    "/api/projects",
    authenticateToken,
    async (req, res) => {

        try {

            const requestedLimit =
                Number(req.query.limit);

            const limit =
                requestedLimit > 0
                    ? Math.min(
                        requestedLimit,
                        1000
                    )
                    : 500;

            const rawProjects =
                await Project.find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .lean();

            const projects =
                rawProjects.map(
                    normalizeProject
                );

            res.json({

                success: true,

                count:
                    projects.length,

                projects
            });

        } catch (error) {

            console.error(
                "Projects error:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Error fetching projects",
                    error:
                        error.message
                });
        }
    }
);

// ========================================
// CREATE PROJECT
// ========================================

app.post(
    "/api/projects",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LAND_OFFICER"
    ),
    async (req, res) => {

        try {

            const project =
                await Project.create({
                    ...req.body,
                    createdBy:
                        req.user.id
                });

            res
                .status(201)
                .json({
                    success: true,
                    message:
                        "Project created successfully",
                    project:
                        normalizeProject(project)
                });

        } catch (error) {

            console.error(
                "Create project error:",
                error
            );

            res
                .status(
                    error.code === 11000
                        ? 409
                        : 500
                )
                .json({
                    success: false,
                    message:
                        error.code === 11000
                            ? "Project ID already exists"
                            : error.message
                });
        }
    }
);

// ========================================
// UPDATE PROJECT
// ========================================

app.put(
    "/api/projects/:id",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LAND_OFFICER"
    ),
    async (req, res) => {

        try {

            const project =
                await Project.findByIdAndUpdate(
                    req.params.id,
                    req.body,
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!project) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Project not found"
                    });
            }

            res.json({
                success: true,
                project:
                    normalizeProject(project)
            });

        } catch (error) {

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        error.message
                });
        }
    }
);

// ========================================
// GET LAND
// ========================================

app.get(
    "/api/land",
    authenticateToken,
    async (req, res) => {

        try {

            const requestedLimit =
                Number(req.query.limit);

            const limit =
                requestedLimit > 0
                    ? Math.min(
                        requestedLimit,
                        1000
                    )
                    : 100;

            const parcels =
                await Land.find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .lean();

            res.json({

                success: true,

                count:
                    parcels.length,

                parcels,

                land:
                    parcels
            });

        } catch (error) {

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Error fetching land parcels"
                });
        }
    }
);

// ========================================
// CREATE LAND
// ========================================

app.post(
    "/api/land",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LAND_OFFICER"
    ),
    async (req, res) => {

        try {

            const parcel =
                await Land.create({
                    ...req.body,
                    createdBy:
                        req.user.id
                });

            res
                .status(201)
                .json({
                    success: true,
                    parcel
                });

        } catch (error) {

            res
                .status(
                    error.code === 11000
                        ? 409
                        : 500
                )
                .json({
                    success: false,
                    message:
                        error.code === 11000
                            ? "Parcel ID already exists"
                            : error.message
                });
        }
    }
);

// ========================================
// UPDATE LAND
// ========================================

app.put(
    "/api/land/:id",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LAND_OFFICER"
    ),
    async (req, res) => {

        try {

            const parcel =
                await Land.findByIdAndUpdate(
                    req.params.id,
                    req.body,
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!parcel) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Parcel not found"
                    });
            }

            res.json({
                success: true,
                parcel
            });

        } catch (error) {

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        error.message
                });
        }
    }
);

// ========================================
// GET COMPENSATION
// ========================================

app.get(
    "/api/compensation",
    authenticateToken,
    async (req, res) => {

        try {

            const requestedLimit =
                Number(req.query.limit);

            const limit =
                requestedLimit > 0
                    ? Math.min(
                        requestedLimit,
                        1000
                    )
                    : 100;

            const compensation =
                await Compensation.find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .lean();

            const totalAwarded =
                compensation.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.awardedAmount || 0
                        ),
                    0
                );

            const totalPaid =
                compensation.reduce(
                    (sum, item) =>
                        sum +
                        Number(
                            item.paidAmount || 0
                        ),
                    0
                );

            res.json({

                success: true,

                count:
                    compensation.length,

                compensation,

                payments:
                    compensation,

                totals: {

                    awarded:
                        totalAwarded,

                    paid:
                        totalPaid,

                    pending:
                        Math.max(
                            totalAwarded -
                            totalPaid,
                            0
                        )
                }
            });

        } catch (error) {

            console.error(
                "Compensation error:",
                error
            );

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Error fetching compensation"
                });
        }
    }
);

// ========================================
// CREATE COMPENSATION
// ========================================

app.post(
    "/api/compensation",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LAND_OFFICER"
    ),
    async (req, res) => {

        try {

            const item =
                await Compensation.create({
                    ...req.body,
                    createdBy:
                        req.user.id
                });

            res
                .status(201)
                .json({
                    success: true,
                    compensation:
                        item
                });

        } catch (error) {

            res
                .status(
                    error.code === 11000
                        ? 409
                        : 500
                )
                .json({
                    success: false,
                    message:
                        error.code === 11000
                            ? "Compensation ID already exists"
                            : error.message
                });
        }
    }
);

// ========================================
// GET LEGAL CASES
// ========================================

app.get(
    "/api/cases",
    authenticateToken,
    async (req, res) => {

        try {

            const requestedLimit =
                Number(req.query.limit);

            const limit =
                requestedLimit > 0
                    ? Math.min(
                        requestedLimit,
                        1000
                    )
                    : 100;

            const cases =
                await LegalCase.find()
                    .sort({
                        createdAt: -1
                    })
                    .limit(limit)
                    .lean();

            res.json({

                success: true,

                count:
                    cases.length,

                cases
            });

        } catch (error) {

            res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Error fetching cases"
                });
        }
    }
);

// ========================================
// CREATE LEGAL CASE
// ========================================

app.post(
    "/api/cases",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LEGAL_OFFICER"
    ),
    async (req, res) => {

        try {

            const legalCase =
                await LegalCase.create({
                    ...req.body,
                    createdBy:
                        req.user.id
                });

            res
                .status(201)
                .json({
                    success: true,
                    legalCase
                });

        } catch (error) {

            res
                .status(
                    error.code === 11000
                        ? 409
                        : 500
                )
                .json({
                    success: false,
                    message:
                        error.code === 11000
                            ? "Case ID already exists"
                            : error.message
                });
        }
    }
);

// ========================================
// ADMIN DASHBOARD
// ========================================

app.get(
    "/api/admin/dashboard",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR"
    ),
    (req, res) => {

        res.json({
            success: true,
            message:
                "Administrator access granted",
            access:
                "Full System"
        });
    }
);

// ========================================
// LAND OFFICER DASHBOARD
// ========================================

app.get(
    "/api/land/dashboard",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LAND_OFFICER"
    ),
    (req, res) => {

        res.json({
            success: true,
            message:
                "Land & Projects access granted"
        });
    }
);

// ========================================
// LEGAL OFFICER DASHBOARD
// ========================================

app.get(
    "/api/legal/dashboard",
    authenticateToken,
    authorizeRoles(
        "ADMINISTRATOR",
        "LEGAL_OFFICER"
    ),
    (req, res) => {

        res.json({
            success: true,
            message:
                "Legal access granted"
        });
    }
);

// ========================================
// ROOT
// ========================================

app.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            message:
                "SIH Land Management Backend Running",
            database:
                mongoose.connection.readyState === 1
                    ? "connected"
                    : "disconnected"
        });
    }
);

// ========================================
// 404
// ========================================

app.use(
    (req, res) => {

        res
            .status(404)
            .json({
                success: false,
                message:
                    "API route not found"
            });
    }
);

// ========================================
// START SERVER
// ========================================

async function startServer() {

    try {

        await mongoose.connect(
            MONGO_URI
        );

        console.log(
            "MongoDB connected"
        );

        await createDefaultUsers();

        await createSampleData();

        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on port ${PORT}`
                );

                console.log(
                    `API: http://localhost:${PORT}/api/health`
                );
            }
        );

    } catch (error) {

        console.error(
            "Server startup error:",
            error
        );

        process.exit(1);
    }
}

startServer();
