const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;

const MONGO_URI =
process.env.MONGO_URI ||
"mongodb://127.0.0.1:27017/national_land_system";

const JWT_SECRET =
process.env.JWT_SECRET ||
"SIH_LAND_SYSTEM_SECRET_2026";

const NODE_ENV =
process.env.NODE_ENV || "development";

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
"http://localhost:5173",
"http://localhost:5174",
"http://127.0.0.1:5173",
"http://127.0.0.1:5174",

"https://sih-land-acquisition-eight.vercel.app",

process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
origin: function (origin, callback) {

if (!origin) {
return callback(null, true);
}

if (allowedOrigins.includes(origin)) {
return callback(null, true);
}

console.warn("CORS blocked origin:", origin);

return callback(
new Error("CORS origin not allowed")
);
},

methods: [
"GET",
"POST",
"PUT",
"PATCH",
"DELETE",
"OPTIONS",
],

allowedHeaders: [
"Content-Type",
"Authorization",
],

credentials: true,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

/* =========================================================
   SECURITY
========================================================= */

app.use(
helmet({
crossOriginResourcePolicy: {
policy: "cross-origin",
},
})
);

const apiLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 1000,
standardHeaders: true,
legacyHeaders: false,
});

app.use("/api/", apiLimiter);

/* =========================================================
   BODY PARSING
========================================================= */

app.use(
express.json({
limit: "10mb",
})
);

app.use(
express.urlencoded({
extended: true,
limit: "10mb",
})
);

/* =========================================================
   UPLOADS
========================================================= */

const uploadDirectory = path.join(
__dirname,
"uploads"
);

if (!fs.existsSync(uploadDirectory)) {
fs.mkdirSync(uploadDirectory, {
recursive: true,
});
}

app.use(
"/uploads",
express.static(uploadDirectory)
);

/* =========================================================
   SOCKET.IO
========================================================= */

const io = new Server(server, {
cors: {
origin: allowedOrigins,
methods: [
"GET",
"POST",
],
credentials: true,
},

transports: [
"websocket",
"polling",
],
});

/* =========================================================
   SOCKET AUTH
========================================================= */

io.use((socket, next) => {
try {

const token =
socket.handshake.auth?.token;

if (!token) {
return next(
new Error(
"Authentication token required"
)
);
}

const decoded =
jwt.verify(
token,
JWT_SECRET
);

socket.user = decoded;

next();

} catch (error) {

next(
new Error(
"Invalid socket authentication"
)
);

}
});

/* =========================================================
   SOCKET CONNECTION
========================================================= */

io.on(
"connection",
(socket) => {

console.log(
"Socket connected:",
socket.id
);

const user = socket.user;

if (user?.id) {

socket.join(
`user:${user.id}`
);

}

if (user?.role) {

socket.join(
`role:${user.role}`
);

}

socket.emit(
"connection:ready",
{
success: true,
message:
"NLAMS real-time connection established",
}
);

socket.on(
"disconnect",
(reason) => {

console.log(
"Socket disconnected:",
socket.id,
reason
);

}
);

}
);

/* =========================================================
   USER SCHEMA
========================================================= */

const userSchema =
new mongoose.Schema(
{
username: {
type: String,
required: true,
unique: true,
trim: true,
},

password: {
type: String,
required: true,
},

role: {
type: String,
required: true,

enum: [
"ADMINISTRATOR",
"LAND_OFFICER",
"LEGAL_OFFICER",
],
},

designation: {
type: String,
default: "",
},

access: {
type: String,
default: "",
},

status: {
type: String,
default: "ACTIVE",
},
},

{
timestamps: true,
}
);

const User =
mongoose.models.User ||
mongoose.model(
"User",
userSchema
);

/* =========================================================
   PROJECT SCHEMA
========================================================= */

const projectSchema =
new mongoose.Schema(
{
projectId: {
type: String,
required: true,
unique: true,
trim: true,
},

projectName: {
type: String,
default: "",
},

state: {
type: String,
default: "",
},

district: {
type: String,
default: "",
},

authority: {
type: String,
default: "",
},

projectType: {
type: String,
default: "",
},

startDate: {
type: String,
default: "",
},

expectedCompletion: {
type: String,
default: "",
},

landRequiredAcres: {
type: Number,
default: 0,
},

landAcquiredAcres: {
type: Number,
default: 0,
},

acquisitionProgressPct: {
type: Number,
default: 0,
},

projectStatus: {
type: String,
default: "In Progress",
},

riskLevel: {
type: String,
default: "Medium",
},

createdBy: {
type: String,
default: "",
},
},

{
timestamps: true,
strict: false,
}
);

const Project =
mongoose.models.Project ||
mongoose.model(
"Project",
projectSchema
);

/* =========================================================
   LAND / PARCEL SCHEMA
========================================================= */

const landSchema =
new mongoose.Schema(
{
parcelId: {
type: String,
required: true,
unique: true,
},

projectId: {
type: String,
default: "",
},

state: {
type: String,
default: "",
},

district: {
type: String,
default: "",
},

village: {
type: String,
default: "",
},

landType: {
type: String,
default: "",
},

areaAcres: {
type: Number,
default: 0,
},

acquisitionStatus: {
type: String,
default: "Pending",
},

litigationFlag: {
type: String,
default: "No",
},

latitude: {
type: Number,
default: null,
},

longitude: {
type: Number,
default: null,
},
},

{
timestamps: true,
strict: false,
}
);

const Land =
mongoose.models.Land ||
mongoose.model(
"Land",
landSchema,
"landparcels"
);

/* =========================================================
   COMPENSATION SCHEMA
========================================================= */

const compensationSchema =
new mongoose.Schema(
{
compensationId: {
type: String,
required: true,
unique: true,
},

projectId: {
type: String,
default: "",
},

parcelId: {
type: String,
default: "",
},

ownerName: {
type: String,
default: "",
},

awardedAmount: {
type: Number,
default: 0,
},

paidAmount: {
type: Number,
default: 0,
},

status: {
type: String,
default: "Pending",
},

createdBy: {
type: String,
default: "",
},
},

{
timestamps: true,
strict: false,
}
);

const Compensation =
mongoose.models.Compensation ||
mongoose.model(
"Compensation",
compensationSchema
);

/* =========================================================
   LEGAL CASE SCHEMA
========================================================= */

const legalCaseSchema =
new mongoose.Schema(
{
caseId: {
type: String,
required: true,
unique: true,
},

projectId: {
type: String,
default: "",
},

parcelId: {
type: String,
default: "",
},

title: {
type: String,
default: "",
},

description: {
type: String,
default: "",
},

status: {
type: String,
default: "Pending",
},

priority: {
type: String,
default: "Medium",
},

objectionPending: {
type: Boolean,
default: false,
},

createdBy: {
type: String,
default: "",
},
},

{
timestamps: true,
strict: false,
}
);

const LegalCase =
mongoose.models.LegalCase ||
mongoose.model(
"LegalCase",
legalCaseSchema
);

/* =========================================================
   DOCUMENT SCHEMA
========================================================= */

const documentSchema =
new mongoose.Schema(
{
documentId: {
type: String,
unique: true,
sparse: true,
},

name: {
type: String,
default: "",
},

originalName: {
type: String,
default: "",
},

fileName: {
type: String,
default: "",
},

mimeType: {
type: String,
default: "",
},

size: {
type: Number,
default: 0,
},

url: {
type: String,
default: "",
},

projectId: {
type: String,
default: "",
},

parcelId: {
type: String,
default: "",
},

uploadedBy: {
type: String,
default: "",
},

uploadedByRole: {
type: String,
default: "",
},

status: {
type: String,
default: "UPLOADED",
},
},

{
timestamps: true,
strict: false,
}
);

const Document =
mongoose.models.Document ||
mongoose.model(
"Document",
documentSchema
);

/* =========================================================
   NOTIFICATION SCHEMA
========================================================= */

const notificationSchema =
new mongoose.Schema(
{
title: {
type: String,
required: true,
},

message: {
type: String,
default: "",
},

type: {
type: String,
default: "info",
},

targetRole: {
type: String,
default: "",
},

targetUserId: {
type: String,
default: "",
},

read: {
type: Boolean,
default: false,
},

createdBy: {
type: String,
default: "",
},
},

{
timestamps: true,
}
);

const Notification =
mongoose.models.Notification ||
mongoose.model(
"Notification",
notificationSchema
);

/* =========================================================
   AUDIT SCHEMA
========================================================= */

const auditSchema =
new mongoose.Schema(
{
action: {
type: String,
default: "",
},

event: {
type: String,
default: "",
},

username: {
type: String,
default: "",
},

role: {
type: String,
default: "",
},

userId: {
type: String,
default: "",
},

details: {
type: mongoose.Schema.Types.Mixed,
default: {},
},

ip: {
type: String,
default: "",
},
},

{
timestamps: true,
}
);

const Audit =
mongoose.models.Audit ||
mongoose.model(
"Audit",
auditSchema
);

/* =========================================================
   DEFAULT USERS
========================================================= */

async function createDefaultUsers() {

const users = [

{
username: "admin",
password: "Admin@123",
role: "ADMINISTRATOR",
designation: "Super Admin",
access: "Full System",
},

{
username: "land.officer",
password: "Land@123",
role: "LAND_OFFICER",
designation: "Government Land Officer",
access: "Land & Projects",
},

{
username: "legal.officer",
password: "Legal@123",
role: "LEGAL_OFFICER",
designation: "Legal Officer",
access: "Legal & Cases",
},

];

for (const item of users) {

const existing =
await User.findOne({
username:
item.username,
});

if (!existing) {

const hashedPassword =
await bcrypt.hash(
item.password,
10
);

await User.create({
username:
item.username,

password:
hashedPassword,

role:
item.role,

designation:
item.designation,

access:
item.access,

status:
"ACTIVE",
});

console.log(
`Created default user: ${item.username}`
);

}

}

console.log(
"Default users checked."
);

}

/* =========================================================
   AUDIT HELPER
========================================================= */

async function createAudit({
req,
action,
event,
user,
details = {},
}) {

try {

await Audit.create({

action,

event:
event || action,

username:
user?.username ||
req?.user?.username ||
"",

role:
user?.role ||
req?.user?.role ||
"",

userId:
user?.id ||
req?.user?.id ||
"",

details,

ip:
req?.ip ||
"",

});

} catch (error) {

console.error(
"Audit error:",
error.message
);

}

}

/* =========================================================
   NOTIFICATION HELPER
========================================================= */

async function createNotification({
title,
message,
type = "info",
targetRole = "",
targetUserId = "",
createdBy = "",
}) {

try {

const notification =
await Notification.create({

title,
message,
type,
targetRole,
targetUserId,
createdBy,

});

if (targetUserId) {

io.to(
`user:${targetUserId}`
).emit(
"notification",
notification
);

}

if (targetRole) {

io.to(
`role:${targetRole}`
).emit(
"notification",
notification
);

}

if (
!targetRole &&
!targetUserId
) {

io.emit(
"notification",
notification
);

}

return notification;

} catch (error) {

console.error(
"Notification error:",
error.message
);

return null;

}

}

/* =========================================================
   JWT MIDDLEWARE
========================================================= */

function authenticateToken(
req,
res,
next
) {

const authHeader =
req.headers.authorization;

const token =
authHeader &&
authHeader.startsWith(
"Bearer "
)
? authHeader.substring(
7
)
: null;

if (!token) {

return res
.status(401)
.json({

success: false,

message:
"Authentication required.",

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
"Invalid or expired token.",

});

}

}

/* =========================================================
   ROLE MIDDLEWARE
========================================================= */

function authorizeRoles(
...allowedRoles
) {

return (
req,
res,
next
) => {

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
"You do not have permission to access this resource.",

});

}

next();

};

}

/* =========================================================
   PROJECT NORMALIZER
========================================================= */

function normalizeProject(
project
) {

if (!project) {
return project;
}

const landRequired =
Number(
project.landRequiredAcres ||
0
);

const landAcquired =
Number(
project.landAcquiredAcres ||
0
);

let progress =
Number(
project.acquisitionProgressPct
);

if (
!Number.isFinite(
progress
)
) {

progress =
landRequired > 0
? (landAcquired /
landRequired) *
100
: 0;

}

progress = Math.max(
0,
Math.min(
100,
progress
)
);

return {

...project,

id:
project._id?.toString?.() ||
project.id,

landRequiredAcres:
landRequired,

landAcquiredAcres:
landAcquired,

acquisitionProgressPct:
Number(
progress.toFixed(2)
),

projectStatus:
project.projectStatus ||
project.status ||
"In Progress",

};

}

/* =========================================================
   HEALTH
========================================================= */

app.get(
"/api/health",
(req, res) => {

res.json({

success: true,

service: "NLAMS",

status: "online",

database:
mongoose.connection.readyState ===
1
? "connected"
: "disconnected",

time:
new Date().toISOString(),

});

}
);

/* =========================================================
   ROOT
========================================================= */

app.get(
"/",
(req, res) => {

res.json({

success: true,

message:
"SIH Land Management Backend Running",

database:
mongoose.connection.readyState ===
1
? "connected"
: "disconnected",

environment:
NODE_ENV,

});

}
);

/* =========================================================
   LOGIN
========================================================= */

app.post(
"/api/auth/login",
async (req, res) => {

try {

const {
username,
password,
} = req.body;

if (
!username ||
!password
) {

return res
.status(400)
.json({

success: false,

message:
"Username and password are required.",

});

}

const user =
await User.findOne({

username:
String(
username
).trim(),

});

if (!user) {

return res
.status(401)
.json({

success: false,

message:
"Invalid username or password.",

});

}

if (
user.status !==
"ACTIVE"
) {

return res
.status(403)
.json({

success: false,

message:
"Account is inactive.",

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
"Invalid username or password.",

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
user.role,

},

JWT_SECRET,

{
expiresIn:
"8h",
}

);

await createAudit({

req,

action:
"LOGIN",

event:
"USER_LOGIN",

user: {

id:
user._id.toString(),

username:
user.username,

role:
user.role,

},

});

res.json({

success: true,

message:
"Login successful.",

token,

user: {

id:
user._id.toString(),

username:
user.username,

role:
user.role,

designation:
user.designation,

access:
user.access,

status:
user.status,

},

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
"Login failed.",

});

}

}
);

/* =========================================================
   CURRENT USER
========================================================= */

app.get(
"/api/auth/me",
authenticateToken,
async (
req,
res
) => {

try {

const user =
await User.findById(
req.user.id
).select(
"-password"
);

if (!user) {

return res
.status(404)
.json({

success: false,

message:
"User not found.",

});

}

res.json({

success: true,

user: {

id:
user._id.toString(),

username:
user.username,

role:
user.role,

designation:
user.designation,

access:
user.access,

status:
user.status,

},

});

} catch (error) {

res
.status(500)
.json({

success: false,

message:
"Unable to validate session.",

});

}

}
);

/* =========================================================
   DASHBOARD
========================================================= */

app.get(
"/api/dashboard",
authenticateToken,
async (
req,
res
) => {

try {

const [
projects,
parcels,
cases,
compensation,
] =
await Promise.all([

Project.find()
.lean(),

Land.find()
.lean(),

LegalCase.find()
.lean(),

Compensation.find()
.lean(),

]);

const totalLandRequired =
projects.reduce(
(
sum,
item
) =>
sum +
Number(
item.landRequiredAcres ||
0
),
0
);

const totalLandAcquired =
projects.reduce(
(
sum,
item
) =>
sum +
Number(
item.landAcquiredAcres ||
0
),
0
);

const acquisitionPercentage =
totalLandRequired >
0
? (totalLandAcquired /
totalLandRequired) *
100
: 0;

const awarded =
compensation.reduce(
(
sum,
item
) =>
sum +
Number(
item.awardedAmount ||
0
),
0
);

const paid =
compensation.reduce(
(
sum,
item
) =>
sum +
Number(
item.paidAmount ||
0
),
0
);

const pending =
Math.max(
awarded -
paid,
0
);

const pendingObjections =
cases.filter(
(item) =>
item.objectionPending ===
true ||
item.status ===
"Pending"
).length;

const statusMap =
{};

for (const project of projects) {

const status =
project.projectStatus ||
"In Progress";

statusMap[
status
] =
(statusMap[
status
] || 0) + 1;

}

const projectStats =
Object.entries(
statusMap
).map(
([
status,
count,
]) => ({

status,
count,

})
);

const criticalProjects =
projects.filter(
(project) =>
project.riskLevel ===
"Critical"
).length;

const highRiskProjects =
projects.filter(
(project) =>
project.riskLevel ===
"High"
).length;

const riskIndex =
Math.min(
100,

Math.round(

pendingObjections *
10 +

criticalProjects *
20 +

highRiskProjects *
10

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
acquisitionPercentage.toFixed(
2
)
),

awarded,

paid,

pending,

pendingObjections,

},

projectStats,

risk: {

index:
riskIndex,

legalRisk:
Math.min(
100,
pendingObjections *
25
),

landRecordRisk:
43,

compensationRisk:
56,

delayProbability:
74,

},

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
"Error loading dashboard.",

error:
error.message,

});

}

}
);

/* =========================================================
   PROJECTS
========================================================= */

app.get(
"/api/projects",
authenticateToken,
async (
req,
res
) => {

try {

const requestedLimit =
Number(
req.query.limit
);

const limit =
requestedLimit >
0
? Math.min(
requestedLimit,
1000
)
: 500;

const rawProjects =
await Project.find()
.sort({
createdAt:
-1,
})
.limit(
limit
)
.lean();

const projects =
rawProjects.map(
normalizeProject
);

res.json({

success: true,

count:
projects.length,

projects,

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
"Error fetching projects.",

error:
error.message,

});

}

}
);

app.post(
"/api/projects",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER"
),
async (
req,
res
) => {

try {

const project =
await Project.create({

...req.body,

createdBy:
req.user.id,

});

const normalized =
normalizeProject(
project.toObject()
);

await createAudit({

req,

action:
"CREATE_PROJECT",

event:
"PROJECT_CREATED",

details: {

projectId:
normalized.projectId,

},

});

await createNotification({

title:
"New Project Created",

message:
`${normalized.projectName || normalized.projectId} was added to NLAMS.`,

type:
"success",

targetRole:
"LAND_OFFICER",

createdBy:
req.user.username,

});

io.emit(
"workflow:update",
{

message:
"A new land acquisition project was created.",

project:
normalized,

}
);

res.status(201).json({

success: true,

message:
"Project created successfully.",

project:
normalized,

});

} catch (error) {

console.error(
"Create project error:",
error
);

res
.status(
error.code ===
11000
? 409
: 500
)
.json({

success: false,

message:
error.code ===
11000
? "Project ID already exists."
: error.message,

});

}

}
);

app.put(
"/api/projects/:id",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER"
),
async (
req,
res
) => {

try {

const project =
await Project.findByIdAndUpdate(
req.params.id,
req.body,
{
new: true,
runValidators:
true,
}
).lean();

if (!project) {

return res
.status(404)
.json({

success: false,

message:
"Project not found.",

});

}

const normalized =
normalizeProject(
project
);

await createAudit({

req,

action:
"UPDATE_PROJECT",

event:
"PROJECT_UPDATED",

details: {

projectId:
normalized.projectId,

},

});

io.emit(
"workflow:update",
{

message:
`${normalized.projectName || normalized.projectId} was updated.`,

project:
normalized,

}
);

res.json({

success: true,

project:
normalized,

});

} catch (error) {

console.error(
"Update project error:",
error
);

res
.status(500)
.json({

success: false,

message:
error.message,

});

}

}
);

/* =========================================================
   LAND
========================================================= */

app.get(
"/api/land",
authenticateToken,
async (
req,
res
) => {

try {

const requestedLimit =
Number(
req.query.limit
);

const limit =
requestedLimit >
0
? Math.min(
requestedLimit,
2000
)
: 1000;

const land =
await Land.find()
.sort({
createdAt:
-1,
})
.limit(
limit
)
.lean();

res.json({

success: true,

count:
land.length,

land,

parcels:
land,

});

} catch (error) {

console.error(
"Land error:",
error
);

res
.status(500)
.json({

success: false,

message:
"Error fetching land.",

});

}

}
);

app.post(
"/api/land",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER"
),
async (
req,
res
) => {

try {

const parcel =
await Land.create(
req.body
);

await createAudit({

req,

action:
"CREATE_PARCEL",

event:
"LAND_PARCEL_CREATED",

details: {

parcelId:
parcel.parcelId,

},

});

io.emit(
"workflow:update",
{

message:
`Land parcel ${parcel.parcelId} was created.`,

parcel,

}
);

res.status(201).json({

success: true,

message:
"Land parcel created successfully.",

parcel,

});

} catch (error) {

console.error(
"Create land error:",
error
);

res
.status(
error.code ===
11000
? 409
: 500
)
.json({

success: false,

message:
error.code ===
11000
? "Parcel ID already exists."
: error.message,

});

}

}
);

app.put(
"/api/land/:id",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER"
),
async (
req,
res
) => {

try {

const parcel =
await Land.findByIdAndUpdate(
req.params.id,
req.body,
{
new: true,
runValidators:
true,
}
).lean();

if (!parcel) {

return res
.status(404)
.json({

success: false,

message:
"Parcel not found.",

});

}

await createAudit({

req,

action:
"UPDATE_PARCEL",

event:
"LAND_PARCEL_UPDATED",

details: {

parcelId:
parcel.parcelId,

},

});

io.emit(
"workflow:update",
{

message:
`Land parcel ${parcel.parcelId} was updated.`,

parcel,

}
);

res.json({

success: true,

parcel,

});

} catch (error) {

console.error(
"Update land error:",
error
);

res
.status(500)
.json({

success: false,

message:
error.message,

});

}

}
);

/* =========================================================
   COMPENSATION
========================================================= */

app.get(
"/api/compensation",
authenticateToken,
async (
req,
res
) => {

try {

const requestedLimit =
Number(
req.query.limit
);

const limit =
requestedLimit >
0
? Math.min(
requestedLimit,
1000
)
: 500;

const compensation =
await Compensation.find()
.sort({
createdAt:
-1,
})
.limit(
limit
)
.lean();

const awarded =
compensation.reduce(
(
sum,
item
) =>
sum +
Number(
item.awardedAmount ||
0
),
0
);

const paid =
compensation.reduce(
(
sum,
item
) =>
sum +
Number(
item.paidAmount ||
0
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

awarded,

paid,

pending:
Math.max(
awarded -
paid,
0
),

},

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
"Error fetching compensation.",

});

}

}
);

app.post(
"/api/compensation",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER"
),
async (
req,
res
) => {

try {

const item =
await Compensation.create(
{

...req.body,

createdBy:
req.user.id,

}
);

await createAudit({

req,

action:
"CREATE_COMPENSATION",

event:
"COMPENSATION_CREATED",

details: {

compensationId:
item.compensationId,

},

});

await createNotification({

title:
"Compensation Updated",

message:
`Compensation ${item.compensationId} was created.`,

type:
"info",

targetRole:
"LAND_OFFICER",

createdBy:
req.user.username,

});

res.status(201).json({

success: true,

compensation:
item,

});

} catch (error) {

console.error(
"Create compensation error:",
error
);

res
.status(
error.code ===
11000
? 409
: 500
)
.json({

success: false,

message:
error.code ===
11000
? "Compensation ID already exists."
: error.message,

});

}

}
);

/* =========================================================
   LEGAL CASES
========================================================= */

app.get(
"/api/cases",
authenticateToken,
async (
req,
res
) => {

try {

const requestedLimit =
Number(
req.query.limit
);

const limit =
requestedLimit >
0
? Math.min(
requestedLimit,
1000
)
: 500;

const cases =
await LegalCase.find()
.sort({
createdAt:
-1,
})
.limit(
limit
)
.lean();

res.json({

success: true,

count:
cases.length,

cases,

});

} catch (error) {

console.error(
"Cases error:",
error
);

res
.status(500)
.json({

success: false,

message:
"Error fetching cases.",

});

}

}
);

app.post(
"/api/cases",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LEGAL_OFFICER"
),
async (
req,
res
) => {

try {

const legalCase =
await LegalCase.create(
{

...req.body,

createdBy:
req.user.id,

}
);

await createAudit({

req,

action:
"CREATE_CASE",

event:
"LEGAL_CASE_CREATED",

details: {

caseId:
legalCase.caseId,

},

});

await createNotification({

title:
"New Legal Case",

message:
`Legal case ${legalCase.caseId} was created.`,

type:
"warning",

targetRole:
"LEGAL_OFFICER",

createdBy:
req.user.username,

});

res.status(201).json({

success: true,

legalCase,

});

} catch (error) {

console.error(
"Create case error:",
error
);

res
.status(
error.code ===
11000
? 409
: 500
)
.json({

success: false,

message:
error.code ===
11000
? "Case ID already exists."
: error.message,

});

}

}
);

/* =========================================================
   MULTER
========================================================= */

const storage =
multer.diskStorage({

destination:
function (
req,
file,
cb
) {

cb(
null,
uploadDirectory
);

},

filename:
function (
req,
file,
cb
) {

const extension =
path.extname(
file.originalname
);

const baseName =
path
.basename(
file.originalname,
extension
)
.replace(
/[^a-zA-Z0-9_-]/g,
"_"
);

const uniqueName =
`${Date.now()}-${Math.round(
Math.random() *
1e9
)}-${baseName}${extension}`;

cb(
null,
uniqueName
);

},

});

const upload =
multer({

storage,

limits: {

fileSize:
10 * 1024 * 1024,

},

fileFilter:
function (
req,
file,
cb
) {

const allowedTypes =
[
"application/pdf",
"image/jpeg",
"image/png",
"image/webp",
];

if (
allowedTypes.includes(
file.mimetype
)
) {

cb(
null,
true
);

} else {

cb(
new Error(
"Only PDF, JPG, PNG and WEBP files are allowed."
)
);

}

},

});

/* =========================================================
   DOCUMENT UPLOAD
========================================================= */

app.post(
"/api/documents/upload",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER",
"LEGAL_OFFICER"
),
upload.single(
"file"
),
async (
req,
res
) => {

try {

if (!req.file) {

return res
.status(400)
.json({

success: false,

message:
"No file uploaded.",

});

}

const documentId =
`DOC-${Date.now()}-${Math.floor(
Math.random() *
10000
)}`;

const document =
await Document.create({

documentId,

name:
req.body.name ||
req.file.originalname,

originalName:
req.file.originalname,

fileName:
req.file.filename,

mimeType:
req.file.mimetype,

size:
req.file.size,

url:
`/uploads/${req.file.filename}`,

projectId:
req.body.projectId ||
"",

parcelId:
req.body.parcelId ||
"",

uploadedBy:
req.user.username,

uploadedByRole:
req.user.role,

status:
"UPLOADED",

});

await createAudit({

req,

action:
"UPLOAD_DOCUMENT",

event:
"DOCUMENT_UPLOADED",

details: {

documentId,

fileName:
req.file.originalname,

projectId:
req.body.projectId ||
"",

},

});

if (
req.user.role ===
"LAND_OFFICER"
) {

await createNotification({

title:
"New Document Received",

message:
`${req.file.originalname} was uploaded by Land Officer and is available for Legal Officer review.`,

type:
"info",

targetRole:
"LEGAL_OFFICER",

createdBy:
req.user.username,

});

}

if (
req.user.role ===
"LEGAL_OFFICER"
) {

await createNotification({

title:
"Legal Document Updated",

message:
`${req.file.originalname} was uploaded by Legal Officer.`,

type:
"info",

targetRole:
"LAND_OFFICER",

createdBy:
req.user.username,

});

}

io.emit(
"workflow:update",
{

message:
"A new document was uploaded.",

document,

}
);

res.status(201).json({

success: true,

message:
"Document uploaded successfully.",

document,

});

} catch (error) {

console.error(
"Document upload error:",
error
);

if (
req.file?.path &&
fs.existsSync(
req.file.path
)
) {

try {

fs.unlinkSync(
req.file.path
);

} catch {}

}

res
.status(500)
.json({

success: false,

message:
error.message ||
"Document upload failed.",

});

}

}
);

/* =========================================================
   DOCUMENT LIST
========================================================= */

app.get(
"/api/documents",
authenticateToken,
async (
req,
res
) => {

try {

const documents =
await Document.find()
.sort({
createdAt:
-1,
})
.limit(500)
.lean();

res.json({

success: true,

count:
documents.length,

documents,

});

} catch (error) {

console.error(
"Documents error:",
error
);

res
.status(500)
.json({

success: false,

message:
"Error fetching documents.",

});

}

}
);

/* =========================================================
   NOTIFICATIONS
========================================================= */

app.get(
"/api/notifications",
authenticateToken,
async (
req,
res
) => {

try {

const userId =
req.user.id;

const role =
req.user.role;

const notifications =
await Notification.find(
{

$or: [

{
targetUserId:
userId,
},

{
targetRole:
role,
},

{
targetRole:
"",
targetUserId:
"",
},

],

}
)
.sort({
createdAt:
-1,
})
.limit(100)
.lean();

res.json({

success: true,

count:
notifications.length,

notifications,

});

} catch (error) {

console.error(
"Notifications error:",
error
);

res
.status(500)
.json({

success: false,

message:
"Error fetching notifications.",

});

}

}
);

/* =========================================================
   MARK NOTIFICATION READ
========================================================= */

app.patch(
"/api/notifications/:id/read",
authenticateToken,
async (
req,
res
) => {

try {

const notification =
await Notification.findByIdAndUpdate(
req.params.id,
{
read: true,
},
{
new: true,
}
).lean();

if (!notification) {

return res
.status(404)
.json({

success: false,

message:
"Notification not found.",

});

}

res.json({

success: true,

notification,

});

} catch (error) {

res
.status(500)
.json({

success: false,

message:
error.message,

});

}

}
);

/* =========================================================
   AUDIT
========================================================= */

app.get(
"/api/audit",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR"
),
async (
req,
res
) => {

try {

const audit =
await Audit.find()
.sort({
createdAt:
-1,
})
.limit(500)
.lean();

res.json({

success: true,

count:
audit.length,

audit,

});

} catch (error) {

console.error(
"Audit error:",
error
);

res
.status(500)
.json({

success: false,

message:
"Error fetching audit trail.",

});

}

}
);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.get(
"/api/admin/dashboard",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR"
),
async (
req,
res
) => {

res.json({

success: true,

message:
"Administrator access granted.",

access:
"Full System",

});

}
);

/* =========================================================
   LAND OFFICER DASHBOARD
========================================================= */

app.get(
"/api/land/dashboard",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LAND_OFFICER"
),
async (
req,
res
) => {

res.json({

success: true,

message:
"Land & Projects access granted.",

});

}
);

/* =========================================================
   LEGAL OFFICER DASHBOARD
========================================================= */

app.get(
"/api/legal/dashboard",
authenticateToken,
authorizeRoles(
"ADMINISTRATOR",
"LEGAL_OFFICER"
),
async (
req,
res
) => {

res.json({

success: true,

message:
"Legal access granted.",

});

}
);

/* =========================================================
   404
========================================================= */

app.use(
(req, res) => {

res
.status(404)
.json({

success: false,

message:
"API route not found.",

path:
req.originalUrl,

});

}
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
(
error,
req,
res,
next
) => {

console.error(
"Global error:",
error
);

if (
error.message ===
"CORS origin not allowed"
) {

return res
.status(403)
.json({

success: false,

message:
"CORS origin not allowed.",

});

}

if (
error instanceof
multer.MulterError
) {

return res
.status(400)
.json({

success: false,

message:
error.message,

});

}

res
.status(
error.status ||
500
)
.json({

success: false,

message:
error.message ||
"Internal server error.",

});

}
);

/* =========================================================
   DATABASE CONNECTION
========================================================= */

async function connectDatabase() {

try {

await mongoose.connect(
MONGO_URI,
{
serverSelectionTimeoutMS:
15000,
}
);

console.log(
"MongoDB connected"
);

console.log(
"Database:",
mongoose.connection.name
);

} catch (error) {

console.error(
"MongoDB connection failed:"
);

console.error(
error.message
);

process.exit(1);

}

}

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

try {

await connectDatabase();

await createDefaultUsers();

const projectCount =
await Project.countDocuments();

const landCount =
await Land.countDocuments();

const compensationCount =
await Compensation.countDocuments();

const caseCount =
await LegalCase.countDocuments();

console.log(
"Projects in database:",
projectCount
);

console.log(
"Land parcels in database:",
landCount
);

console.log(
"Compensation records:",
compensationCount
);

console.log(
"Legal cases:",
caseCount
);

server.listen(
PORT,
"0.0.0.0",
() => {

console.log(
`NLAMS server running on port ${PORT}`
);

console.log(
`http://localhost:${PORT}`
);

console.log(
`Environment: ${NODE_ENV}`
);

}
);

} catch (error) {

console.error(
"Server startup failed:",
error
);

process.exit(1);

}

}

/* =========================================================
   PROCESS HANDLERS
========================================================= */

process.on(
"SIGINT",
async () => {

console.log(
"\nShutting down NLAMS..."
);

await mongoose.connection.close();

server.close(() => {

process.exit(0);

});

}
);

process.on(
"SIGTERM",
async () => {

await mongoose.connection.close();

server.close(() => {

process.exit(0);

});

}
);

process.on(
"uncaughtException",
(error) => {

console.error(
"Uncaught exception:",
error
);

}
);

process.on(
"unhandledRejection",
(error) => {

console.error(
"Unhandled rejection:",
error
);

}
);

/* =========================================================
   START
========================================================= */

startServer();