import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BrowserRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  Globe2,
  IndianRupee,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map,
  MapPinned,
  Menu,
  MessageSquareWarning,
  Moon,
  Network,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Satellite,
  Stamp,
  Sun,
  TriangleAlert,
  Upload,
  Scale,
  Users,
  X,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  get,
  post,
  createSocket,
} from "./services";

import { useAuth } from "./context/AuthContext";


/* =========================================================
   CONSTANTS
========================================================= */

const GREEN = "#198754";
const DARK_GREEN = "#0b3d2e";
const LIGHT_GREEN = "#57d68d";
const MINT = "#dff8e9";

const API_BASE = "http://localhost:5000/api";


/* =========================================================
   HELPERS
========================================================= */

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value) {
  return number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value) {
  const n = number(value);

  if (n >= 10000000) {
    return `₹${(n / 10000000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} Cr`;
  }

  if (n >= 100000) {
    return `₹${(n / 100000).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })} L`;
  }

  return `₹${n.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function safeArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function projectName(project) {
  return (
    project?.projectName ||
    project?.name ||
    project?.title ||
    project?.project ||
    "Unnamed Project"
  );
}

function projectId(project) {
  return (
    project?.projectId ||
    project?.id ||
    project?._id ||
    "-"
  );
}

function projectProgress(project) {
  const direct =
    project?.acquisitionProgressPct ??
    project?.progressPct ??
    project?.progress ??
    project?.acquisitionProgress;

  if (direct !== undefined && direct !== null) {
    return Math.min(100, Math.max(0, number(direct)));
  }

  const required =
    project?.landRequiredAcres ??
    project?.requiredAcres ??
    project?.landRequired ??
    0;

  const acquired =
    project?.landAcquiredAcres ??
    project?.acquiredAcres ??
    project?.landAcquired ??
    0;

  if (number(required) > 0) {
    return Math.min(
      100,
      Math.max(0, (number(acquired) / number(required)) * 100)
    );
  }

  return 0;
}

function projectStatus(project) {
  const raw = String(
    project?.projectStatus ||
      project?.status ||
      ""
  ).toLowerCase();

  const progress = projectProgress(project);

  if (
    progress >= 100 ||
    raw.includes("completed") ||
    raw.includes("complete")
  ) {
    return "Completed";
  }

  if (
    raw.includes("progress") ||
    raw.includes("ongoing") ||
    raw.includes("active")
  ) {
    return "Ongoing";
  }

  return "Under Process";
}

function statusClass(status) {
  if (status === "Completed") return "green";
  if (status === "Ongoing") return "blue";
  if (status === "Under Process") return "yellow";
  return "gray";
}

function coordinates(item) {
  const lat = number(
    item?.latitude ??
      item?.lat ??
      item?.location?.latitude ??
      item?.location?.lat
  );

  const lng = number(
    item?.longitude ??
      item?.lng ??
      item?.lon ??
      item?.location?.longitude ??
      item?.location?.lng
  );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat === 0 ||
    lng === 0 ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return [lat, lng];
}

function compensationAwarded(item) {
  return number(
    item?.awardedAmount ??
      item?.amountAwarded ??
      item?.awarded ??
      item?.totalAwarded
  );
}

function compensationPaid(item) {
  return number(
    item?.paidAmount ??
      item?.amountPaid ??
      item?.paid
  );
}

function roleLabel(role) {
  return String(role || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


/* =========================================================
   BADGES
========================================================= */

function Badge({ children, type = "green" }) {
  return (
    <span className={`badge ${type}`}>
      {children}
    </span>
  );
}


/* =========================================================
   LOGIN
========================================================= */

function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await login(username.trim(), password);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">

      <div className="login-box">

        {/* LEFT GREEN BRAND PANEL */}

        <div className="login-brand">

          <div className="brand-icon">
            <Landmark size={26} />
          </div>

          <h1>
            National Land Acquisition
            & Management System
          </h1>

          <p>
            Secure digital monitoring, GIS intelligence
            and AI-assisted decision support for national
            land acquisition workflows.
          </p>

          <div className="login-feature">
            <ShieldCheck size={18} />
            <span>
              Role-based secure access control
            </span>
          </div>

          <div className="login-feature">
            <MapPinned size={18} />
            <span>
              Live GIS and national project intelligence
            </span>
          </div>

          <div className="login-feature">
            <BarChart3 size={18} />
            <span>
              Advanced analytics and risk monitoring
            </span>
          </div>

          <div className="login-feature">
            <Activity size={18} />
            <span>
              Real-time acquisition workflow
            </span>
          </div>

        </div>


        {/* RIGHT LOGIN PANEL */}

        <div className="login-form-wrap">

          <div className="brand-mark">
            <Globe2 size={25} />
          </div>

          <div
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              color: GREEN,
              marginBottom: "10px",
            }}
          >
            SECURE OFFICER ACCESS
          </div>

          <h2>
            Welcome Back
          </h2>

          <p>
            Sign in to access the national
            command dashboard.
          </p>

          {error && (
            <div className="login-error">
              <TriangleAlert size={14} />
              {error}
            </div>
          )}

          <form onSubmit={submit}>

            <div className="login-group">

              <label>
                USERNAME
              </label>

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                autoComplete="username"
                placeholder="Enter username"
                required
              />

            </div>


            <div className="login-group">

              <label>
                PASSWORD
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                placeholder="Enter password"
                required
              />

            </div>


            <button
              className="login-submit"
              disabled={loading}
              type="submit"
            >
              <ShieldCheck size={17} />

              {loading
                ? "Signing in..."
                : "Secure Login"}
            </button>

          </form>


          <div className="demo-hint">

            <strong
              style={{
                display: "block",
                color: DARK_GREEN,
                marginBottom: "5px",
              }}
            >
              Demo Accounts
            </strong>

            <div>
              admin / admin123
            </div>

            <div>
              land.officer / Land@123
            </div>

            <div>
              legal.officer / Legal@123
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SIDEBAR
========================================================= */

const navigation = [
  {
    title: "Command Center",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        key: "projects",
        label: "Projects",
        icon: Network,
      },
      {
        key: "gis",
        label: "GIS Intelligence",
        icon: MapPinned,
      },
      {
        key: "parcels",
        label: "Land Parcels",
        icon: Map,
      },
    ],
  },

  {
    title: "Acquisition",
    items: [
      {
        key: "workflow",
        label: "Acquisition Workflow",
        icon: Route,
      },
      {
        key: "compensation",
        label: "Compensation",
        icon: IndianRupee,
      },
      {
        key: "disputes",
        label: "Legal / Disputes",
        icon: Scale,
      },
      {
        key: "documents",
        label: "Documents",
        icon: FileText,
      },
    ],
  },

  {
    title: "Intelligence",
    items: [
      {
        key: "analytics",
        label: "Analytics",
        icon: BarChart3,
      },
      {
        key: "alerts",
        label: "Alerts",
        icon: AlertTriangle,
      },
    ],
  },

  {
    title: "Administration",
    items: [
      {
        key: "users",
        label: "Users",
        icon: Users,
      },
      {
        key: "audit",
        label: "Audit Trail",
        icon: FileCheck2,
      },
      {
        key: "settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];


function Sidebar({
  activePage,
  setActivePage,
  mobileOpen,
  setMobileOpen,
  user,
  logout,
}) {
  function canSee(item) {
    const role = user?.role;

    if (role === "ADMINISTRATOR") {
      return true;
    }

    if (role === "LAND_OFFICER") {
      return [
        "dashboard",
        "projects",
        "gis",
        "parcels",
        "workflow",
        "compensation",
        "analytics",
        "alerts",
        "documents",
      ].includes(item.key);
    }

    if (role === "LEGAL_OFFICER") {
      return [
        "dashboard",
        "projects",
        "gis",
        "parcels",
        "compensation",
        "disputes",
        "documents",
        "analytics",
        "alerts",
      ].includes(item.key);
    }

    return false;
  }

  return (
    <>
      <aside
        className={`sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >

        <div className="brand">

          <div className="brand-icon">
            <Landmark size={21} />
          </div>

          <div>
            <h2>NLAMS</h2>
            <span>
              LAND ACQUISITION INTELLIGENCE
            </span>
          </div>

        </div>


        <div className="role-card">

          <div className="avatar">
            {String(user?.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.designation ||
                roleLabel(user?.role)}
            </strong>

            <small>
              {roleLabel(user?.role)}
            </small>
          </div>

        </div>


        <nav className="sidebar-nav">

          {navigation.map((section) => {

            const items =
              section.items.filter(canSee);

            if (!items.length) {
              return null;
            }

            return (
              <React.Fragment key={section.title}>

                <div className="menu-title">
                  {section.title}
                </div>

                {items.map((item) => {

                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      className={`nav-item ${
                        activePage === item.key
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        setActivePage(item.key);
                        setMobileOpen(false);
                      }}
                    >

                      <Icon size={17} />

                      <span>
                        {item.label}
                      </span>

                    </button>
                  );
                })}

              </React.Fragment>
            );
          })}

        </nav>


        <div className="sidebar-bottom">

          <button
            className="logout-btn"
            onClick={logout}
          >
            <LogOut size={15} />
            Logout
          </button>

        </div>

      </aside>

      {mobileOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}
    </>
  );
}


/* =========================================================
   TOPBAR
========================================================= */

function Topbar({
  user,
  activePage,
  setMobileOpen,
  notifications,
  onNotificationClick,
}) {
  const title =
    navigation
      .flatMap((section) => section.items)
      .find((item) => item.key === activePage)
      ?.label || "Dashboard";

  const unread = notifications.filter(
    (n) => !n.read
  ).length;

  return (
    <header className="topbar">

      <div className="top-left">

        <div
          className="breadcrumb"
        >
          NLAMS
          <ChevronRight size={12} />
          COMMAND CENTER
        </div>

        <h1>
          {title}
        </h1>

        <p>
          National Land Acquisition & Management System
        </p>

      </div>


      <div className="top-actions">

        <button
          className="icon-btn mobile-menu-btn"
          onClick={() =>
            setMobileOpen(true)
          }
        >
          <Menu size={19} />
        </button>


        <button
          className="icon-btn notification-bell"
          onClick={onNotificationClick}
          title="Notifications"
        >

          <Bell size={18} />

          {unread > 0 && (
            <span className="notification-count show">
              {unread > 9 ? "9+" : unread}
            </span>
          )}

        </button>


        <div className="user-chip">

          <div className="avatar">
            {String(user?.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.username}
            </strong>

            <small>
              {roleLabel(user?.role)}
            </small>
          </div>

        </div>

      </div>

    </header>
  );
}


/* =========================================================
   NOTIFICATION PANEL
========================================================= */

function NotificationPanel({
  notifications,
  onClose,
  markRead,
}) {
  return (
    <div className="notification-panel open">

      <div className="notification-head">

        <div>
          <h3>
            Notifications
          </h3>

          <span
            style={{
              fontSize: "9px",
              color: "var(--text-soft)",
            }}
          >
            Live officer coordination
          </span>
        </div>

        <button
          className="icon-btn"
          style={{
            width: 30,
            height: 30,
          }}
          onClick={onClose}
        >
          <X size={15} />
        </button>

      </div>


      <div className="notification-list">

        {notifications.length === 0 ? (

          <div className="notification-empty">
            <Bell size={30} />
            <div>
              No notifications
            </div>
          </div>

        ) : (

          notifications
            .slice(0, 30)
            .map((item, index) => (

              <div
                key={
                  item._id ||
                  item.id ||
                  index
                }
                className={`notification-item ${
                  item.read
                    ? ""
                    : "unread"
                }`}
                onClick={() =>
                  markRead(item)
                }
              >

                <div
                  className={`notification-icon ${
                    item.type || "info"
                  }`}
                >
                  <Bell size={15} />
                </div>

                <div className="notification-content">

                  <div className="notification-title">
                    {item.title ||
                      "System notification"}
                  </div>

                  <div className="notification-message">
                    {item.message ||
                      "New activity is available."}
                  </div>

                  <div className="notification-meta">
                    {item.createdAt
                      ? new Date(
                          item.createdAt
                        ).toLocaleString(
                          "en-IN"
                        )
                      : "Just now"}
                  </div>

                </div>

              </div>

            ))
        )}

      </div>

    </div>
  );
}


/* =========================================================
   KPI CARD
========================================================= */

function KPI({
  icon: Icon,
  label,
  value,
  foot,
  progress,
}) {
  return (
    <div className="kpi">

      <div className="kpi-top">

        <div>

          <div className="kpi-label">
            {label}
          </div>

          <div className="kpi-value">
            {value}
          </div>

        </div>

        <div className="kpi-icon">
          <Icon size={20} />
        </div>

      </div>

      {foot && (
        <div className="kpi-foot">
          <Activity size={11} />
          {foot}
        </div>
      )}

      {progress !== undefined && (
        <div className="kpi-progress">
          <span
            style={{
              width: `${Math.min(
                100,
                Math.max(0, number(progress))
              )}%`,
            }}
          />
        </div>
      )}

    </div>
  );
}


/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}) {
  return (
    <div className="card-head">

      <div className="card-title">

        <div className="card-title-icon">
          <Icon size={16} />
        </div>

        <div>
          <h3>{title}</h3>

          {subtitle && (
            <p>{subtitle}</p>
          )}
        </div>

      </div>

      {right}

    </div>
  );
}


/* =========================================================
   DASHBOARD MAP
========================================================= */

function ProjectMap({
  projects,
  parcels,
  full = false,
}) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!instanceRef.current) {

      instanceRef.current = L.map(
        mapRef.current,
        {
          zoomControl: true,
          attributionControl: true,
        }
      ).setView(
        [22.5, 80],
        5
      );

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "&copy; OpenStreetMap contributors",
        }
      ).addTo(
        instanceRef.current
      );

      layerRef.current =
        L.layerGroup().addTo(
          instanceRef.current
        );
    }

    const map =
      instanceRef.current;

    const layer =
      layerRef.current;

    layer.clearLayers();

    const points = [];

    const items = [
      ...projects,
      ...parcels,
    ];

    items.forEach((item) => {

      const coords =
        coordinates(item);

      if (!coords) return;

      const status =
        projectStatus(item);

      let color =
        LIGHT_GREEN;

      if (status === "Ongoing") {
        color = "#2d9cdb";
      }

      if (status === "Under Process") {
        color = "#ffb703";
      }

      const marker =
        L.circleMarker(
          coords,
          {
            radius: full ? 7 : 6,
            color: "#ffffff",
            weight: 2,
            fillColor: color,
            fillOpacity: 0.9,
          }
        );

      marker.bindPopup(`
        <div style="
          min-width:220px;
          font-family:Inter,Arial,sans-serif;
          line-height:1.55;
        ">
          <strong style="font-size:14px;">
            ${projectName(item)}
          </strong>

          <hr style="
            border:0;
            border-top:1px solid #ddd;
            margin:8px 0;
          "/>

          <b>Project ID:</b>
          ${projectId(item)}
          <br/>

          <b>State:</b>
          ${item.state || "-"}
          <br/>

          <b>District:</b>
          ${item.district || "-"}
          <br/>

          <b>Status:</b>
          ${status}
          <br/>

          <b>Progress:</b>
          ${projectProgress(item).toFixed(1)}%
        </div>
      `);

      marker.addTo(layer);

      points.push(coords);
    });

    setTimeout(() => {
      map.invalidateSize();

      if (points.length > 1) {
        map.fitBounds(
          L.latLngBounds(points).pad(0.15)
        );
      }
    }, 100);

    return () => {};
  }, [projects, parcels, full]);

  return (
    <div
      className={
        full
          ? "full-map"
          : "map-wrapper"
      }
    >

      <div
        ref={mapRef}
        className="map"
        style={{
          width: "100%",
          height: "100%",
          minHeight: full
            ? 600
            : 360,
        }}
      />

      <div className="map-legend">

        <strong>
          Acquisition Status
        </strong>

        <div>
          <span className="dot orange" />
          Under Process
        </div>

        <div>
          <span className="dot blue" />
          Ongoing
        </div>

        <div>
          <span className="dot green" />
          Completed
        </div>

      </div>

      {projects.length === 0 &&
        parcels.length === 0 && (
          <div className="map-empty">
            No geospatial records available.
          </div>
        )}

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  projects,
  parcels,
  compensation,
  cases,
}) {
  const totalProjects =
    projects.length;

  const landRequired =
    projects.reduce(
      (sum, item) =>
        sum +
        number(
          item.landRequiredAcres ??
            item.requiredAcres ??
            item.landRequired
        ),
      0
    );

  const landAcquired =
    projects.reduce(
      (sum, item) =>
        sum +
        number(
          item.landAcquiredAcres ??
            item.acquiredAcres ??
            item.landAcquired
        ),
      0
    );

  const progress =
    landRequired > 0
      ? (landAcquired /
          landRequired) *
        100
      : projects.length
        ? projects.reduce(
            (sum, item) =>
              sum +
              projectProgress(item),
            0
          ) / projects.length
        : 0;

  const completed =
    projects.filter(
      (p) =>
        projectStatus(p) ===
        "Completed"
    ).length;

  const ongoing =
    projects.filter(
      (p) =>
        projectStatus(p) ===
        "Ongoing"
    ).length;

  const underProcess =
    projects.filter(
      (p) =>
        projectStatus(p) ===
        "Under Process"
    ).length;

  const awarded =
    compensation.reduce(
      (sum, item) =>
        sum +
        compensationAwarded(item),
      0
    );

  const paid =
    compensation.reduce(
      (sum, item) =>
        sum +
        compensationPaid(item),
      0
    );

  const pendingCases =
    cases.filter((item) => {
      const s = String(
        item?.status || ""
      ).toUpperCase();

      return (
        s.includes("PENDING") ||
        s.includes("DISPUT") ||
        s.includes("CORRECTION")
      );
    }).length;


  const statusData = [
    {
      name: "Completed",
      value: completed,
    },
    {
      name: "Ongoing",
      value: ongoing,
    },
    {
      name: "Under Process",
      value: underProcess,
    },
  ];


  const landData = [
    {
      name: "Land",
      Required: Number(
        landRequired.toFixed(2)
      ),
      Acquired: Number(
        landAcquired.toFixed(2)
      ),
    },
  ];


  const stateMap = {};

  projects.forEach((item) => {
    const state =
      item.state || "Unknown";

    stateMap[state] =
      (stateMap[state] || 0) + 1;
  });

  const stateData =
    Object.entries(stateMap)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 8);


  return (
    <div className="page active">

      {/* HERO */}

      <section className="hero">

        <div className="hero-content">

          <div
            className="pulse-dot"
            style={{
              display: "inline-block",
              marginRight: 7,
            }}
          />

          <span
            style={{
              fontSize: 10,
              letterSpacing: 1.4,
              fontWeight: 800,
              textTransform:
                "uppercase",
              opacity: 0.85,
            }}
          >
            National Command Center
          </span>

          <h2>
            Land Acquisition.
            <br />
            From Delays to
            Real-Time Decisions.
          </h2>

          <p>
            National Land Acquisition &
            Management System for project
            monitoring, GIS intelligence,
            acquisition analytics and
            officer coordination.
          </p>


          <div className="hero-stats">

            <div className="hero-stat">
              <strong>
                {formatNumber(
                  totalProjects
                )}
              </strong>

              <span>
                Government Projects
              </span>
            </div>


            <div className="hero-stat">
              <strong>
                {formatNumber(
                  landRequired
                )}
              </strong>

              <span>
                Required Acres
              </span>
            </div>


            <div className="hero-stat">
              <strong>
                {formatNumber(
                  landAcquired
                )}
              </strong>

              <span>
                Acquired Acres
              </span>
            </div>


            <div className="hero-stat">
              <strong>
                {progress.toFixed(1)}%
              </strong>

              <span>
                Acquisition Progress
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* KPI */}

      <div className="kpi-grid">

        <KPI
          icon={Building2}
          label="TOTAL PROJECTS"
          value={formatNumber(
            totalProjects
          )}
          foot="Government dataset"
        />

        <KPI
          icon={Map}
          label="LAND REQUIRED"
          value={`${formatNumber(
            landRequired
          )} Ac`}
          foot="Project requirement"
        />

        <KPI
          icon={CheckCircle2}
          label="LAND ACQUIRED"
          value={`${formatNumber(
            landAcquired
          )} Ac`}
          foot={`${progress.toFixed(
            1
          )}% complete`}
          progress={progress}
        />

        <KPI
          icon={Clock3}
          label="ONGOING"
          value={formatNumber(
            ongoing
          )}
          foot="Active projects"
        />

        <KPI
          icon={IndianRupee}
          label="COMPENSATION PAID"
          value={formatCurrency(
            paid
          )}
          foot="Payment released"
        />

        <KPI
          icon={TriangleAlert}
          label="PENDING CASES"
          value={formatNumber(
            pendingCases
          )}
          foot="Requires attention"
        />

      </div>


      {/* CHART ROW */}

      <div className="section-grid">

        <div className="card">

          <CardHeader
            icon={BarChart3}
            title="Project Workflow Status"
            subtitle="Current national project distribution"
            right={
              <Badge type="green">
                LIVE DATA
              </Badge>
            }
          />

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={52}
                  paddingAngle={3}
                >

                  <Cell fill="#198754" />
                  <Cell fill="#2d9cdb" />
                  <Cell fill="#ffb703" />

                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="card">

          <CardHeader
            icon={ShieldCheck}
            title="Acquisition Intelligence"
            subtitle="Required vs acquired land"
            right={
              <Badge type="green">
                LIVE
              </Badge>
            }
          />

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={landData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="Required"
                  fill="#0b3d2e"
                  radius={[7, 7, 0, 0]}
                />

                <Bar
                  dataKey="Acquired"
                  fill="#57d68d"
                  radius={[7, 7, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      {/* SECOND CHART */}

      <div className="section-grid">

        <div className="card">

          <CardHeader
            icon={IndianRupee}
            title="Compensation Overview"
            subtitle="Awarded vs payment released"
          />

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={[
                  {
                    name: "Compensation",
                    Awarded: awarded,
                    Paid: paid,
                    Pending: Math.max(
                      0,
                      awarded - paid
                    ),
                  },
                ]}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />

                <Legend />

                <Bar
                  dataKey="Awarded"
                  fill="#0b3d2e"
                  radius={[7, 7, 0, 0]}
                />

                <Bar
                  dataKey="Paid"
                  fill="#57d68d"
                  radius={[7, 7, 0, 0]}
                />

                <Bar
                  dataKey="Pending"
                  fill="#ffb703"
                  radius={[7, 7, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="card">

          <CardHeader
            icon={Globe2}
            title="Projects by State"
            subtitle="National project distribution"
          />

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={stateData}
                layout="vertical"
                margin={{
                  left: 25,
                  right: 15,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={85}
                  tick={{
                    fontSize: 9,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#198754"
                  radius={[
                    0,
                    7,
                    7,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      {/* WORKFLOW */}

      <div
        className="card"
        style={{
          marginBottom: 18,
        }}
      >

        <CardHeader
          icon={Route}
          title="End-to-End Acquisition Workflow"
          subtitle="Digital lifecycle monitoring"
          right={
            <Badge type="green">
              SYSTEM ACTIVE
            </Badge>
          }
        />

        <div className="workflow">

          <div className="workflow-steps">

            <div className="workflow-line" />


            <WorkflowStep
              icon={Satellite}
              title="Survey"
              text="Land identification"
            />

            <WorkflowStep
              icon={FileCheck2}
              title="Verification"
              text="Record validation"
            />

            <WorkflowStep
              icon={Stamp}
              title="Approval"
              text="Government approval"
            />

            <WorkflowStep
              icon={IndianRupee}
              title="Compensation"
              text="Payment processing"
            />

            <WorkflowStep
              icon={KeyRound}
              title="Possession"
              text="Final handover"
            />

          </div>

        </div>

      </div>


      {/* MAP + RISK */}

      <div className="section-grid">

        <div className="card">

          <CardHeader
            icon={MapPinned}
            title="National GIS Intelligence Map"
            subtitle="Live project and parcel visualization"
            right={
              <Badge type="green">
                GIS LIVE
              </Badge>
            }
          />

          <ProjectMap
            projects={projects}
            parcels={parcels}
          />

        </div>


        <RiskPanel
          projects={projects}
        />

      </div>


      {/* PRIORITY PROJECTS */}

      <div className="card">

        <CardHeader
          icon={Activity}
          title="Priority Projects"
          subtitle="Projects requiring monitoring"
          right={
            <Badge type="yellow">
              MONITORING
            </Badge>
          }
        />

        <ProjectTable
          projects={projects.slice(0, 12)}
        />

      </div>

    </div>
  );
}


/* =========================================================
   WORKFLOW STEP
========================================================= */

function WorkflowStep({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="workflow-step">

      <div className="workflow-icon">
        <Icon size={18} />
      </div>

      <div>
        <h4>{title}</h4>
        <span>{text}</span>
      </div>

    </div>
  );
}


/* =========================================================
   RISK PANEL
========================================================= */

function RiskPanel({
  projects,
}) {
  const risk =
    projects.length
      ? Math.round(
          projects.reduce(
            (sum, p) => {
              const progress =
                projectProgress(p);

              return (
                sum +
                Math.max(
                  10,
                  100 - progress
                )
              );
            },
            0
          ) / projects.length
        )
      : 0;

  const legalRisk =
    Math.min(
      95,
      Math.round(risk * 0.82)
    );

  const landRisk =
    Math.min(
      95,
      Math.round(risk * 0.62)
    );

  const compensationRisk =
    Math.min(
      95,
      Math.round(risk * 0.72)
    );

  const delayRisk =
    Math.min(
      95,
      Math.round(risk * 0.92)
    );

  return (
    <div className="card">

      <CardHeader
        icon={ShieldCheck}
        title="AI Risk Prediction"
        subtitle="Acquisition risk intelligence"
        right={
          <Badge type="yellow">
            LIVE
          </Badge>
        }
      />

      <div className="risk-panel">

        <div className="risk-main">

          <div className="risk-score">

            <strong>
              {risk}
            </strong>

            <small>
              RISK INDEX
            </small>

          </div>


          <div className="risk-details">

            <RiskBar
              label="Legal Risk"
              value={legalRisk}
            />

            <RiskBar
              label="Land Record Risk"
              value={landRisk}
            />

            <RiskBar
              label="Compensation Risk"
              value={compensationRisk}
            />

            <RiskBar
              label="Delay Probability"
              value={delayRisk}
            />

          </div>

        </div>

      </div>

    </div>
  );
}


function RiskBar({
  label,
  value,
}) {
  return (
    <div className="risk-row">

      <div className="risk-row-head">

        <span>{label}</span>

        <span>
          {value}%
        </span>

      </div>

      <div className="risk-bar">

        <span
          style={{
            width: `${value}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   PROJECT TABLE
========================================================= */

function ProjectTable({
  projects,
}) {
  return (
    <div className="table-wrapper">

      <div className="table-container">

        <table>

          <thead>

            <tr>
              <th>Project</th>
              <th>State</th>
              <th>District</th>
              <th>Required</th>
              <th>Acquired</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            {projects.length === 0 ? (

              <tr>
                <td
                  colSpan="7"
                  className="empty-cell"
                >
                  No project records available.
                </td>
              </tr>

            ) : (

              projects.map(
                (project, index) => {

                  const required =
                    number(
                      project.landRequiredAcres
                    );

                  const acquired =
                    number(
                      project.landAcquiredAcres
                    );

                  const progress =
                    projectProgress(
                      project
                    );

                  const status =
                    projectStatus(
                      project
                    );

                  return (
                    <tr
                      key={
                        project._id ||
                        project.projectId ||
                        index
                      }
                    >

                      <td>

                        <div className="table-project">

                          <div className="avatar small">
                            <Building2 size={14} />
                          </div>

                          <span>
                            <strong>
                              {projectName(
                                project
                              )}
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                                color:
                                  "var(--text-soft)",
                              }}
                            >
                              {projectId(
                                project
                              )}
                            </small>
                          </span>

                        </div>

                      </td>


                      <td>
                        {project.state ||
                          "-"}
                      </td>


                      <td>
                        {project.district ||
                          "-"}
                      </td>


                      <td>
                        {formatNumber(
                          required
                        )} Ac
                      </td>


                      <td>
                        {formatNumber(
                          acquired
                        )} Ac
                      </td>


                      <td>

                        <div
                          className="progress-cell"
                        >

                          <span>
                            {progress.toFixed(
                              1
                            )}%
                          </span>

                          <div className="progress-bar">
                            <div
                              style={{
                                width: `${progress}%`,
                              }}
                            />
                          </div>

                        </div>

                      </td>


                      <td>

                        <Badge
                          type={statusClass(
                            status
                          )}
                        >
                          {status}
                        </Badge>

                      </td>

                    </tr>
                  );
                }
              )

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}


/* =========================================================
   PROJECTS PAGE
========================================================= */

function ProjectsPage({
  projects,
}) {
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const filtered =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        (project) => {

          const matchesSearch =
            !query ||
            projectName(project)
              .toLowerCase()
              .includes(query) ||
            String(
              projectId(project)
            )
              .toLowerCase()
              .includes(query) ||
            String(
              project.state || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              project.district || ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            status === "All" ||
            projectStatus(project) ===
              status;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [projects, search, status]);


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Government Projects
          </h1>

          <p>
            {projects.length} project
            records loaded directly
            from the NLAMS dataset.
          </p>
        </div>

        <Badge type="green">
          {projects.length} RECORDS
        </Badge>

      </div>


      <div className="filter-panel">

        <div className="search-box">

          <Search size={16} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search project, state, district..."
          />

        </div>


        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >

          <option>All</option>
          <option>Completed</option>
          <option>Ongoing</option>
          <option>Under Process</option>

        </select>

      </div>


      <div className="card">

        <CardHeader
          icon={Network}
          title="National Project Dataset"
          subtitle="Live MongoDB records"
        />

        <ProjectTable
          projects={filtered}
        />

      </div>

    </div>
  );
}


/* =========================================================
   GIS PAGE
========================================================= */

function GISPage({
  projects,
  parcels,
}) {
  const [filter, setFilter] =
    useState("All");

  const filteredProjects =
    projects.filter(
      (project) =>
        filter === "All" ||
        projectStatus(project) ===
          filter
    );

  const completed =
    projects.filter(
      (p) =>
        projectStatus(p) ===
        "Completed"
    ).length;

  const ongoing =
    projects.filter(
      (p) =>
        projectStatus(p) ===
        "Ongoing"
    ).length;

  const process =
    projects.filter(
      (p) =>
        projectStatus(p) ===
        "Under Process"
    ).length;


  const required =
    projects.reduce(
      (sum, p) =>
        sum +
        number(
          p.landRequiredAcres
        ),
      0
    );

  const acquired =
    projects.reduce(
      (sum, p) =>
        sum +
        number(
          p.landAcquiredAcres
        ),
      0
    );


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            GIS Intelligence
          </h1>

          <p>
            Geospatial view of project
            acquisition status.
          </p>
        </div>

        <Badge type="green">
          GIS LIVE
        </Badge>

      </div>


      <div className="gis-toolbar">

        <div className="gis-stats">

          <div>
            <span>
              Under Process
            </span>

            <strong>
              {process}
            </strong>
          </div>

          <div>
            <span>
              Ongoing
            </span>

            <strong>
              {ongoing}
            </strong>
          </div>

          <div>
            <span>
              Completed
            </span>

            <strong>
              {completed}
            </strong>
          </div>

          <div>
            <span>
              Land Required
            </span>

            <strong>
              {formatNumber(required)} Ac
            </strong>
          </div>

        </div>


        <div className="map-filters">

          {[
            "All",
            "Under Process",
            "Ongoing",
            "Completed",
          ].map((item) => (

            <button
              key={item}
              className={`filter-btn ${
                filter === item
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setFilter(item)
              }
            >
              {item}
            </button>

          ))}

        </div>

      </div>


      <div className="card">

        <CardHeader
          icon={MapPinned}
          title="National GIS Map"
          subtitle="Project and parcel intelligence"
        />

        <ProjectMap
          projects={filteredProjects}
          parcels={parcels}
          full
        />

      </div>


      <div
        className="info-banner"
        style={{
          marginTop: 18,
        }}
      >

        <MapPinned size={17} />

        <div>

          <strong>
            GIS coordinate integrity
          </strong>

          <span>
            Only records containing real
            latitude/longitude coordinates
            are plotted. No artificial
            coordinates are generated.
          </span>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PARCEL PAGE
========================================================= */

function ParcelsPage({
  parcels,
}) {
  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Land Parcels
          </h1>

          <p>
            Parcel-level acquisition
            intelligence.
          </p>
        </div>

      </div>


      <div className="card">

        <CardHeader
          icon={Map}
          title="Land Parcel Records"
          subtitle={`${parcels.length} records`}
        />

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Parcel</th>
                <th>Project</th>
                <th>State</th>
                <th>District</th>
                <th>Village</th>
                <th>Area</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {parcels.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="empty-cell"
                  >
                    No parcel records available.
                  </td>
                </tr>

              ) : (

                parcels.slice(0, 200).map(
                  (parcel, index) => {

                    const status =
                      projectStatus(
                        parcel
                      );

                    return (
                      <tr
                        key={
                          parcel._id ||
                          parcel.parcelId ||
                          index
                        }
                      >

                        <td>
                          <strong>
                            {parcel.parcelId ||
                              parcel.id ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {parcel.projectId ||
                            "-"}
                        </td>

                        <td>
                          {parcel.state ||
                            "-"}
                        </td>

                        <td>
                          {parcel.district ||
                            "-"}
                        </td>

                        <td>
                          {parcel.village ||
                            "-"}
                        </td>

                        <td>
                          {formatNumber(
                            parcel.areaAcres ??
                              parcel.area
                          )} Ac
                        </td>

                        <td>
                          <Badge
                            type={statusClass(
                              status
                            )}
                          >
                            {status}
                          </Badge>
                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   COMPENSATION
========================================================= */

function CompensationPage({
  compensation,
}) {
  const awarded =
    compensation.reduce(
      (sum, item) =>
        sum +
        compensationAwarded(item),
      0
    );

  const paid =
    compensation.reduce(
      (sum, item) =>
        sum +
        compensationPaid(item),
      0
    );

  const pending =
    Math.max(
      0,
      awarded - paid
    );


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Compensation
          </h1>

          <p>
            Award and payment monitoring.
          </p>
        </div>

      </div>


      <div className="kpi-grid">

        <KPI
          icon={CircleDollarSign}
          label="AWARDED"
          value={formatCurrency(
            awarded
          )}
        />

        <KPI
          icon={CheckCircle2}
          label="PAID"
          value={formatCurrency(
            paid
          )}
        />

        <KPI
          icon={Clock3}
          label="PENDING"
          value={formatCurrency(
            pending
          )}
        />

        <KPI
          icon={Database}
          label="RECORDS"
          value={formatNumber(
            compensation.length
          )}
        />

      </div>


      <div className="card">

        <CardHeader
          icon={IndianRupee}
          title="Compensation Records"
          subtitle="Live database records"
        />

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Case / Parcel</th>
                <th>Beneficiary</th>
                <th>Awarded</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {compensation.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="empty-cell"
                  >
                    No compensation records available.
                  </td>
                </tr>

              ) : (

                compensation
                  .slice(0, 200)
                  .map((item, index) => {

                    const a =
                      compensationAwarded(
                        item
                      );

                    const p =
                      compensationPaid(
                        item
                      );

                    return (
                      <tr
                        key={
                          item._id ||
                          index
                        }
                      >

                        <td>
                          {item.caseId ||
                            item.parcelId ||
                            "-"}
                        </td>

                        <td>
                          {item.beneficiary ||
                            item.ownerName ||
                            item.landOwner ||
                            "-"}
                        </td>

                        <td>
                          {formatCurrency(a)}
                        </td>

                        <td>
                          {formatCurrency(p)}
                        </td>

                        <td>

                          <Badge
                            type={
                              p >= a
                                ? "green"
                                : "yellow"
                            }
                          >
                            {p >= a
                              ? "PAID"
                              : "PENDING"}
                          </Badge>

                        </td>

                      </tr>
                    );
                  })

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   DISPUTES
========================================================= */

function DisputesPage({
  cases,
}) {
  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Legal & Disputes
          </h1>

          <p>
            Legal verification and
            acquisition case monitoring.
          </p>
        </div>

      </div>


      <div className="card">

        <CardHeader
          icon={Scale}
          title="Case Register"
          subtitle={`${cases.length} cases`}
        />

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Case</th>
                <th>Project</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {cases.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="empty-cell"
                  >
                    No legal cases available.
                  </td>
                </tr>

              ) : (

                cases.map(
                  (item, index) => (

                    <tr
                      key={
                        item._id ||
                        index
                      }
                    >

                      <td>
                        {item.caseNumber ||
                          item.caseId ||
                          "-"}
                      </td>

                      <td>
                        {item.projectName ||
                          item.projectId ||
                          "-"}
                      </td>

                      <td>
                        {item.landOwner ||
                          item.ownerName ||
                          "-"}
                      </td>

                      <td>
                        {[
                          item.district,
                          item.state,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "-"}
                      </td>

                      <td>

                        <Badge
                          type={
                            String(
                              item.status ||
                                ""
                            )
                              .toUpperCase()
                              .includes(
                                "VERIFIED"
                              )
                              ? "green"
                              : "yellow"
                          }
                        >
                          {item.status ||
                            "PENDING"}
                        </Badge>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   DOCUMENTS
========================================================= */

function DocumentsPage({
  cases,
}) {
  const { user } = useAuth();

  const [documents, setDocuments] =
    useState([]);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [caseId, setCaseId] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function loadDocuments() {
    try {
      const result =
        await get("/documents");

      setDocuments(
        safeArray(result, [
          "documents",
        ])
      );
    } catch (error) {
      console.warn(
        "Documents unavailable",
        error
      );
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);


  async function upload() {
    if (!selectedFile) {
      setMessage(
        "Please select a file."
      );
      return;
    }

    if (!caseId) {
      setMessage(
        "Please enter a case ID."
      );
      return;
    }

    setUploading(true);
    setMessage("");

    try {

      const token =
        localStorage.getItem(
          "nlams-token"
        );

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      formData.append(
        "caseId",
        caseId
      );

      const response =
        await fetch(
          `${API_BASE}/documents/upload`,
          {
            method: "POST",
            headers: token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {},
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Upload failed."
        );
      }

      setMessage(
        "Document uploaded successfully."
      );

      setSelectedFile(null);

      await loadDocuments();

    } catch (error) {

      setMessage(
        error?.message ||
          "Upload failed."
      );

    } finally {
      setUploading(false);
    }
  }


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Documents
          </h1>

          <p>
            Evidence and acquisition
            document management.
          </p>
        </div>

      </div>


      <div className="document-grid">

        {user?.role ===
          "LAND_OFFICER" && (

          <div className="card">

            <CardHeader
              icon={Upload}
              title="Upload Evidence"
              subtitle="Land photos and documents"
            />

            <div className="upload-form">

              <label>
                Case ID
              </label>

              <input
                value={caseId}
                onChange={(e) =>
                  setCaseId(
                    e.target.value
                  )
                }
                placeholder="Enter case ID"
              />

              <label>
                File
              </label>

              <div className="file-picker">

                <Upload size={17} />

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) =>
                    setSelectedFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

              </div>

              {selectedFile && (
                <div className="selected-file">
                  <FileText size={15} />
                  {selectedFile.name}
                </div>
              )}

              <button
                className="primary-btn"
                disabled={uploading}
                onClick={upload}
              >
                <Upload size={15} />

                {uploading
                  ? "Uploading..."
                  : "Upload Document"}
              </button>

              {message && (
                <div
                  className={
                    message.includes(
                      "successfully"
                    )
                      ? "success-box"
                      : "error-box"
                  }
                >
                  {message}
                </div>
              )}

            </div>

          </div>
        )}


        <div className="card">

          <CardHeader
            icon={FileText}
            title="Document Register"
            subtitle={`${documents.length} records`}
          />

          <div className="document-list">

            {documents.length === 0 ? (

              <div className="empty-state">
                <FileText size={28} />
                No documents available.
              </div>

            ) : (

              documents
                .slice(0, 100)
                .map(
                  (document, index) => (

                    <div
                      className="document-item"
                      key={
                        document._id ||
                        index
                      }
                    >

                      <div className="document-icon">
                        <FileText size={17} />
                      </div>

                      <div className="document-info">

                        <strong>
                          {document.originalName ||
                            document.fileName ||
                            "Document"}
                        </strong>

                        <span>
                          {document.status ||
                            "PENDING"}
                        </span>

                        <small>
                          {document.createdAt
                            ? new Date(
                                document.createdAt
                              ).toLocaleString(
                                "en-IN"
                              )
                            : ""}
                        </small>

                      </div>

                      {document.url && (
                        <a
                          className="icon-action"
                          href={
                            document.url.startsWith(
                              "http"
                            )
                              ? document.url
                              : `http://localhost:5000${document.url}`
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ChevronRight size={15} />
                        </a>
                      )}

                    </div>

                  )
                )

            )}

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   WORKFLOW PAGE
========================================================= */

function WorkflowPage({
  projects,
}) {
  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Acquisition Workflow
          </h1>

          <p>
            End-to-end digital land
            acquisition lifecycle.
          </p>
        </div>

        <Badge type="green">
          SYSTEM ACTIVE
        </Badge>

      </div>


      <div className="card">

        <div className="workflow">

          <div className="workflow-steps">

            <div className="workflow-line" />

            <WorkflowStep
              icon={Satellite}
              title="Survey"
              text="Land identification"
            />

            <WorkflowStep
              icon={FileCheck2}
              title="Verification"
              text="Record validation"
            />

            <WorkflowStep
              icon={Stamp}
              title="Approval"
              text="Government approval"
            />

            <WorkflowStep
              icon={IndianRupee}
              title="Compensation"
              text="Payment processing"
            />

            <WorkflowStep
              icon={KeyRound}
              title="Possession"
              text="Final handover"
            />

          </div>

        </div>

      </div>


      <div
        className="section-grid"
        style={{ marginTop: 18 }}
      >

        <div className="card">

          <CardHeader
            icon={Activity}
            title="Current Workflow Load"
            subtitle="Project distribution"
          />

          <div
            style={{
              padding: 20,
            }}
          >

            {[
              [
                "Survey",
                projects.length,
              ],
              [
                "Verification",
                Math.round(
                  projects.length *
                    0.72
                ),
              ],
              [
                "Approval",
                Math.round(
                  projects.length *
                    0.55
                ),
              ],
              [
                "Compensation",
                Math.round(
                  projects.length *
                    0.42
                ),
              ],
              [
                "Possession",
                Math.round(
                  projects.length *
                    0.28
                ),
              ],
            ].map(
              ([label, value]) => (

                <div
                  key={label}
                  style={{
                    marginBottom: 15,
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      fontSize: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      {label}
                    </span>

                    <strong>
                      {value}
                    </strong>
                  </div>

                  <div className="progress-bar">

                    <div
                      style={{
                        width: `${
                          projects.length
                            ? (value /
                                projects.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                </div>

              )
            )}

          </div>

        </div>


        <div className="card">

          <CardHeader
            icon={Clock3}
            title="Operational Principle"
            subtitle="Real-time coordination"
          />

          <div
            style={{
              padding: 22,
              color:
                "var(--text-soft)",
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >

            <p>
              Land Officer uploads field
              evidence and acquisition
              information.
            </p>

            <p>
              Legal Officer receives
              real-time notification and
              performs verification.
            </p>

            <p>
              Administrator receives
              system-wide visibility,
              audit events and status
              updates.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ANALYTICS
========================================================= */

function AnalyticsPage({
  projects,
  compensation,
}) {
  const monthly = useMemo(() => {

    const result = {};

    projects.forEach((project) => {

      const date =
        project.startDate ||
        project.createdAt;

      if (!date) return;

      const month =
        new Date(date).toLocaleString(
          "en-IN",
          {
            month: "short",
          }
        );

      if (!result[month]) {
        result[month] = {
          month,
          projects: 0,
          progress: 0,
        };
      }

      result[month].projects += 1;

      result[month].progress +=
        projectProgress(project);

    });

    return Object.values(result)
      .map((item) => ({
        ...item,
        progress:
          item.projects
            ? Number(
                (
                  item.progress /
                  item.projects
                ).toFixed(1)
              )
            : 0,
      }))
      .slice(-12);

  }, [projects]);


  const stateMap = {};

  projects.forEach((p) => {

    const state =
      p.state || "Unknown";

    stateMap[state] =
      (stateMap[state] || 0) +
      projectProgress(p);

  });

  const stateData =
    Object.entries(stateMap)
      .map(([name, progress]) => ({
        name,
        progress:
          projects.filter(
            (p) =>
              (p.state ||
                "Unknown") ===
              name
          ).length
            ? progress /
              projects.filter(
                (p) =>
                  (p.state ||
                    "Unknown") ===
                  name
              ).length
            : 0,
      }))
      .sort(
        (a, b) =>
          b.progress -
          a.progress
      )
      .slice(0, 10);


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Acquisition Analytics
          </h1>

          <p>
            National acquisition
            performance intelligence.
          </p>
        </div>

      </div>


      <div className="section-grid">

        <div className="card">

          <CardHeader
            icon={Activity}
            title="Progress Trend"
            subtitle="Average acquisition progress"
          />

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={monthly}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="month"
                />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#198754"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="card">

          <CardHeader
            icon={Globe2}
            title="State Performance"
            subtitle="Average acquisition progress"
          />

          <div className="chart-box">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={stateData}
                layout="vertical"
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{
                    fontSize: 9,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="progress"
                  fill="#57d68d"
                  radius={[
                    0,
                    7,
                    7,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      <div className="card">

        <CardHeader
          icon={Database}
          title="Dataset Intelligence"
          subtitle="Records currently loaded"
        />

        <div
          className="settings-grid"
        >

          <div>
            <label>
              PROJECT RECORDS
            </label>
            <strong>
              {formatNumber(
                projects.length
              )}
            </strong>
          </div>

          <div>
            <label>
              COMPENSATION RECORDS
            </label>
            <strong>
              {formatNumber(
                compensation.length
              )}
            </strong>
          </div>

          <div>
            <label>
              PROJECTS WITH LAND DATA
            </label>
            <strong>
              {
                projects.filter(
                  (p) =>
                    number(
                      p.landRequiredAcres
                    ) > 0
                ).length
              }
            </strong>
          </div>

          <div>
            <label>
              PROJECTS WITH GIS DATA
            </label>
            <strong>
              {
                projects.filter(
                  (p) =>
                    coordinates(p)
                ).length
              }
            </strong>
          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   ALERTS
========================================================= */

function AlertsPage({
  projects,
}) {
  const alerts =
    projects.flatMap(
      (project) => {

        const progress =
          projectProgress(project);

        const result = [];

        if (progress < 30) {
          result.push({
            type: "danger",
            title:
              "Low acquisition progress",
            message:
              `${projectName(project)} is at ${progress.toFixed(
                1
              )}% acquisition progress.`,
          });
        }

        if (
          progress >= 30 &&
          progress < 60
        ) {
          result.push({
            type: "warning",
            title:
              "Acquisition requires monitoring",
            message:
              `${projectName(project)} has ${progress.toFixed(
                1
              )}% acquisition progress.`,
          });
        }

        if (
          projectStatus(project) ===
          "Ongoing"
        ) {
          result.push({
            type: "info",
            title:
              "Project ongoing",
            message:
              `${projectName(project)} is currently in progress.`,
          });
        }

        return result;
      }
    );


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Alerts & Risk Signals
          </h1>

          <p>
            Automatically generated
            acquisition monitoring signals.
          </p>
        </div>

        <Badge type="yellow">
          {alerts.length} SIGNALS
        </Badge>

      </div>


      <div className="notification-list">

        {alerts.length === 0 ? (

          <div className="empty-state">
            <CheckCircle2 size={32} />
            No active alerts.
          </div>

        ) : (

          alerts
            .slice(0, 100)
            .map((alert, index) => (

              <div
                className="notification-item"
                key={index}
              >

                <div
                  className={`notification-icon ${
                    alert.type
                  }`}
                >
                  <AlertTriangle size={17} />
                </div>

                <div className="notification-content">

                  <div className="notification-title">
                    {alert.title}
                  </div>

                  <div className="notification-message">
                    {alert.message}
                  </div>

                  <div className="notification-meta">
                    NLAMS ANALYTICS
                  </div>

                </div>

              </div>

            ))

        )}

      </div>

    </div>
  );
}


/* =========================================================
   USERS
========================================================= */

function UsersPage({
  user,
}) {
  const users = [
    {
      username: "admin",
      role: "ADMINISTRATOR",
      access: "Full System",
    },
    {
      username: "land.officer",
      role: "LAND_OFFICER",
      access: "Land & Projects",
    },
    {
      username: "legal.officer",
      role: "LEGAL_OFFICER",
      access: "Legal & Cases",
    },
  ];

  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Officer Access
          </h1>

          <p>
            Role-based NLAMS access
            configuration.
          </p>
        </div>

      </div>


      <div className="card">

        <CardHeader
          icon={Users}
          title="System Users"
          subtitle="Configured officer accounts"
        />

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Access</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {users.map(
                (item) => (

                  <tr
                    key={
                      item.username
                    }
                  >

                    <td>
                      <strong>
                        {item.username}
                      </strong>
                    </td>

                    <td>
                      {roleLabel(
                        item.role
                      )}
                    </td>

                    <td>
                      {item.access}
                    </td>

                    <td>
                      <Badge type="green">
                        ACTIVE
                      </Badge>
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      <div
        className="info-banner"
        style={{
          marginTop: 18,
        }}
      >

        <ShieldCheck size={17} />

        <div>
          <strong>
            Current session
          </strong>

          <span>
            You are signed in as{" "}
            <b>{user?.username}</b>{" "}
            with{" "}
            <b>
              {roleLabel(user?.role)}
            </b>{" "}
            access.
          </span>
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   AUDIT
========================================================= */

function AuditPage() {
  const [audit, setAudit] =
    useState([]);

  useEffect(() => {

    async function load() {
      try {

        const result =
          await get("/audit");

        setAudit(
          safeArray(result, [
            "audit",
            "logs",
          ])
        );

      } catch (error) {
        console.warn(
          "Audit endpoint unavailable",
          error
        );
      }
    }

    load();

  }, []);


  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            Audit Trail
          </h1>

          <p>
            System activity and
            accountability records.
          </p>
        </div>

      </div>


      <div className="card">

        <CardHeader
          icon={FileCheck2}
          title="System Audit"
          subtitle={`${audit.length} events`}
        />

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Action</th>
                <th>User</th>
                <th>Role</th>
                <th>Time</th>
              </tr>

            </thead>

            <tbody>

              {audit.length === 0 ? (

                <tr>
                  <td
                    colSpan="4"
                    className="empty-cell"
                  >
                    No audit events available.
                  </td>
                </tr>

              ) : (

                audit
                  .slice(0, 200)
                  .map(
                    (item, index) => (

                      <tr
                        key={
                          item._id ||
                          index
                        }
                      >

                        <td>
                          {item.action ||
                            item.event ||
                            "-"}
                        </td>

                        <td>
                          {item.username ||
                            item.user?.username ||
                            "-"}
                        </td>

                        <td>
                          {roleLabel(
                            item.role ||
                              item.user?.role
                          )}
                        </td>

                        <td>
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleString(
                                "en-IN"
                              )
                            : "-"}
                        </td>

                      </tr>

                    )
                  )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({
  user,
}) {
  return (
    <div className="page active">

      <div className="page-heading">

        <div>
          <h1>
            System Settings
          </h1>

          <p>
            NLAMS configuration and
            environment information.
          </p>
        </div>

      </div>


      <div className="card">

        <div className="settings-profile">

          <div className="avatar large">
            {String(
              user?.username ||
                "U"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <h3>
              {user?.designation ||
                roleLabel(user?.role)}
            </h3>

            <p>
              {user?.username}
            </p>

            <Badge type="green">
              {roleLabel(
                user?.role
              )}
            </Badge>

          </div>

        </div>


        <div className="settings-grid">

          <div>
            <label>
              FRONTEND
            </label>
            <strong>
              React + Vite
            </strong>
          </div>

          <div>
            <label>
              BACKEND
            </label>
            <strong>
              Node.js + Express
            </strong>
          </div>

          <div>
            <label>
              DATABASE
            </label>
            <strong>
              MongoDB
            </strong>
          </div>

          <div>
            <label>
              GIS ENGINE
            </label>
            <strong>
              Leaflet + OpenStreetMap
            </strong>
          </div>

          <div>
            <label>
              REAL-TIME
            </label>
            <strong>
              Socket.IO
            </strong>
          </div>

          <div>
            <label>
              SECURITY
            </label>
            <strong>
              JWT + RBAC
            </strong>
          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   MAIN APP SHELL
========================================================= */

function Shell() {
  const {
    user,
    logout,
    notifications,
    setNotifications,
  } = useAuth();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [activePage, setActivePage] =
    useState(
      location.pathname
        .replace("/", "") ||
        "dashboard"
    );

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [projects, setProjects] =
    useState([]);

  const [parcels, setParcels] =
    useState([]);

  const [compensation, setCompensation] =
    useState([]);

  const [cases, setCases] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  /* ---------------------------------------------------------
     PAGE CHANGE
  --------------------------------------------------------- */

  function changePage(page) {
    setActivePage(page);
    navigate(
      page === "dashboard"
        ? "/"
        : `/${page}`
    );
  }


  /* ---------------------------------------------------------
     LOAD DATA
  --------------------------------------------------------- */

  async function loadData() {

    setLoading(true);

    try {

      const [
        projectResult,
        landResult,
        compensationResult,
        casesResult,
      ] = await Promise.allSettled([
        get("/projects"),
        get("/land"),
        get("/compensation"),
        get("/cases"),
      ]);


      if (
        projectResult.status ===
        "fulfilled"
      ) {
        setProjects(
          safeArray(
            projectResult.value,
            ["projects"]
          )
        );
      }


      if (
        landResult.status ===
        "fulfilled"
      ) {
        setParcels(
          safeArray(
            landResult.value,
            [
              "land",
              "parcels",
            ]
          )
        );
      }


      if (
        compensationResult.status ===
        "fulfilled"
      ) {
        setCompensation(
          safeArray(
            compensationResult.value,
            ["compensation"]
          )
        );
      }


      if (
        casesResult.status ===
        "fulfilled"
      ) {
        setCases(
          safeArray(
            casesResult.value,
            ["cases"]
          )
        );
      }

    } catch (error) {

      console.error(
        "NLAMS data loading error:",
        error
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    if (user) {
      loadData();
    }

  }, [user]);


  /* ---------------------------------------------------------
     REAL-TIME SOCKET
  --------------------------------------------------------- */

  useEffect(() => {

    if (!user) return;

    let socket;

    try {

      socket =
        createSocket(
          localStorage.getItem(
            "nlams-token"
          )
        );

      socket.on(
        "notification",
        (notification) => {

          setNotifications(
            (old) => [
              notification,
              ...old,
            ]
          );

        }
      );

      socket.on(
        "notification:new",
        (notification) => {

          setNotifications(
            (old) => [
              notification,
              ...old,
            ]
          );

        }
      );

      socket.on(
        "workflow:update",
        (event) => {

          setNotifications(
            (old) => [
              {
                _id:
                  `workflow-${Date.now()}`,
                title:
                  "Workflow Updated",
                message:
                  event?.message ||
                  "Acquisition workflow updated.",
                read: false,
                createdAt:
                  new Date(),
              },
              ...old,
            ]
          );

        }
      );

    } catch (error) {

      console.warn(
        "Realtime connection unavailable",
        error
      );

    }

    return () => {

      try {
        socket?.disconnect();
      } catch {}

    };

  }, [user, setNotifications]);


  /* ---------------------------------------------------------
     NOTIFICATIONS
  --------------------------------------------------------- */

  async function markNotificationRead(
    notification
  ) {

    const id =
      notification?._id ||
      notification?.id;

    setNotifications(
      (old) =>
        old.map((item) =>
          (
            item._id ||
            item.id
          ) === id
            ? {
                ...item,
                read: true,
              }
            : item
        )
    );

    if (id) {

      try {

        await fetch(
          `${API_BASE}/notifications/${id}/read`,
          {
            method: "PATCH",
            headers: {
              Authorization:
                `Bearer ${localStorage.getItem(
                  "nlams-token"
                )}`,
            },
          }
        );

      } catch {}

    }

  }


  /* ---------------------------------------------------------
     RENDER PAGE
  --------------------------------------------------------- */

  function renderPage() {

    if (loading) {

      return (
        <div className="page-loading">

          <Activity
            size={20}
            className="spin"
          />

          Loading NLAMS command center...

        </div>
      );
    }


    switch (activePage) {

      case "projects":
        return (
          <ProjectsPage
            projects={projects}
          />
        );

      case "gis":
        return (
          <GISPage
            projects={projects}
            parcels={parcels}
          />
        );

      case "parcels":
        return (
          <ParcelsPage
            parcels={parcels}
          />
        );

      case "workflow":
        return (
          <WorkflowPage
            projects={projects}
          />
        );

      case "compensation":
        return (
          <CompensationPage
            compensation={
              compensation
            }
          />
        );

      case "disputes":
        return (
          <DisputesPage
            cases={cases}
          />
        );

      case "documents":
        return (
          <DocumentsPage
            cases={cases}
          />
        );

      case "analytics":
        return (
          <AnalyticsPage
            projects={projects}
            compensation={
              compensation
            }
          />
        );

      case "alerts":
        return (
          <AlertsPage
            projects={projects}
          />
        );

      case "users":
        return (
          <UsersPage
            user={user}
          />
        );

      case "audit":
        return <AuditPage />;

      case "settings":
        return (
          <SettingsPage
            user={user}
          />
        );

      case "dashboard":

      default:
        return (
          <Dashboard
            projects={projects}
            parcels={parcels}
            compensation={
              compensation
            }
            cases={cases}
          />
        );
    }
  }


  return (
    <div className="app-shell">

      <Sidebar
        activePage={activePage}
        setActivePage={changePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        logout={logout}
      />


      <main className="main">

        <Topbar
          user={user}
          activePage={activePage}
          setMobileOpen={setMobileOpen}
          notifications={
            notifications
          }
          onNotificationClick={() =>
            setShowNotifications(
              (value) => !value
            )
          }
        />


        <div className="content">

          {renderPage()}

        </div>

      </main>


      {showNotifications && (
        <div
          style={{
            position: "fixed",
            right: 25,
            top: 72,
            zIndex: 9999,
          }}
        >

          <NotificationPanel
            notifications={
              notifications
            }
            onClose={() =>
              setShowNotifications(
                false
              )
            }
            markRead={
              markNotificationRead
            }
          />

        </div>
      )}

    </div>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {
  const {
    user,
    loading,
  } = useAuth();


  if (loading) {

    return (
      <div className="loading-screen">

        <Activity
          size={22}
          className="spin"
        />

        Loading NLAMS...

      </div>
    );
  }


  if (!user) {
    return <LoginScreen />;
  }


  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}