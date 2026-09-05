const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
require("dotenv").config();
const mongoose = require("mongoose");

const Project = require("./models/Project");
const LandParcel = require("./models/LandParcel");
const AcquisitionCase = require("./models/AcquisitionCase");
const Compensation = require("./models/Compensation");
const StatusUpdate = require("./models/StatusUpdate");
const Objection = require("./models/Objection");

const DATA = path.join(__dirname, "data");

function readCsv(file) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(path.join(DATA, file))
      .pipe(csv())
      .on("data", r => rows.push(r))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

const n = v => (v === "" || v == null ? undefined : Number(v));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const projectRows = await readCsv("projects.csv");
  const landRows = await readCsv("land_parcels.csv");
  const caseRows = await readCsv("acquisition_cases.csv");
  const compRows = await readCsv("compensation.csv");
  const updateRows = await readCsv("status_updates.csv");
  const objectionRows = await readCsv("objections.csv");

  await Project.deleteMany({});
  await LandParcel.deleteMany({});
  await AcquisitionCase.deleteMany({});
  await Compensation.deleteMany({});
  await StatusUpdate.deleteMany({});
  await Objection.deleteMany({});

  await Project.insertMany(projectRows.map(x => ({
    projectId:x.project_id, projectName:x.project_name, state:x.state, district:x.district,
    authority:x.authority, projectType:x.project_type, startDate:x.start_date,
    expectedCompletion:x.expected_completion, landRequiredAcres:n(x.land_required_acres),
    landAcquiredAcres:n(x.land_acquired_acres), acquisitionProgressPct:n(x.acquisition_progress_pct),
    projectStatus:x.project_status
  })), { ordered:false });

  await LandParcel.insertMany(landRows.map(x => ({
    parcelId:x.parcel_id, projectId:x.project_id, state:x.state, district:x.district,
    tehsilCode:x.tehsil_code, villageCode:x.village_code, surveyNumber:String(x.survey_number),
    areaAcres:n(x.area_acres), landType:x.land_type, ownershipType:x.ownership_type,
    acquisitionStage:x.acquisition_stage, landRecordMatch:x.land_record_match,
    litigationFlag:x.litigation_flag, latitude:n(x.latitude), longitude:n(x.longitude),
    dataProvenance:x.data_provenance
  })), { ordered:false });

  await AcquisitionCase.insertMany(caseRows.map(x => ({
    caseId:x.case_id, parcelId:x.parcel_id, projectId:x.project_id,
    currentStage:x.current_stage, estimatedDelayDays:n(x.estimated_delay_days),
    riskScore:n(x.risk_score), riskLevel:x.risk_level, recommendedAction:x.recommended_action
  })), { ordered:false });

  await Compensation.insertMany(compRows.map(x => ({
    compensationId:x.compensation_id, parcelId:x.parcel_id, projectId:x.project_id,
    areaAcres:n(x.area_acres), baseRateInrPerAcre:n(x.base_rate_inr_per_acre),
    multiplier:n(x.multiplier), awardedAmountInr:n(x.awarded_amount_inr),
    paidAmountInr:n(x.paid_amount_inr), paymentStatus:x.payment_status,
    awardOrPaymentDate:x.award_or_payment_date
  })), { ordered:false });

  await StatusUpdate.insertMany(updateRows.map(x => ({
    updateId:x.update_id, parcelId:x.parcel_id, projectId:x.project_id,
    updateDate:x.update_date, stage:x.stage, updateSource:x.update_source
  })), { ordered:false });

  await Objection.insertMany(objectionRows.map(x => ({
    objectionId:x.objection_id, parcelId:x.parcel_id, projectId:x.project_id,
    objectionType:x.objection_type, status:x.status, severity:x.severity
  })), { ordered:false });

  console.log("IMPORT COMPLETE");
  console.log({
    projects: projectRows.length, parcels: landRows.length, cases: caseRows.length,
    compensation: compRows.length, updates: updateRows.length, objections: objectionRows.length
  });
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });