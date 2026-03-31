"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  firstName: string;
  lastName: string;
  id: number;
  username: string;
  transportationRequest: string;
  duration: string;
  destination: string;
  passengers: string;
  departure: string;
  signedTravelOrderName: string;
  signedTravelOrderData: string;
  driverType: string;
  remarks: string;
  status: "Pending" | "On Process" | "Approved" | "Declined";
  dateCreated: string;
  vehicle?: string;
  driver?: string;
  contact?: string;
};

type ActivityLog = {
  id: number;
  date: string;
  type: "Announcement" | "Request";
  action: string;
  requester: string;
  details: string;
  adminName: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<any>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeSection, setActiveSection] = useState<"dashboard" | "history">("dashboard");

  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [filterType, setFilterType] = useState("All");
  const [filterLocation, setFilterLocation] = useState("");
  const [downloadMode, setDownloadMode] = useState("range");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");



  const [showHistoryFilters, setShowHistoryFilters] = useState(false);

useEffect(() => {
  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      router.push("/login");
      return;
    }

    setAdmin(profile);
    loadRequests();
loadActivityLogs();

const { data: announcementsData } = await supabase
  .from("announcements")
  .select("*")
  .order("created_at", { ascending: false });

if (announcementsData) setAnnouncements(announcementsData);
  };

  checkAdmin();
}, [router]);

const loadRequests = async () => {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("date_created", { ascending: false });

  if (!error && data) {
    const mapped = data.map((r: any) => ({
      id: r.id,
      username: r.username,
      firstName: r.first_name,
      lastName: r.last_name,
      transportationRequest: r.transportation_request,
      duration: r.duration,
      destination: r.destination,
      passengers: r.passengers,
      departure: r.departure,
      signedTravelOrderName: r.signed_travel_order_name,
      signedTravelOrderData: r.signed_travel_order_data,
      driverType: r.driver_type,
      remarks: r.remarks,
      status: r.status,
      dateCreated: r.date_created,
      vehicle: r.vehicle,
      driver: r.driver,
      contact: r.contact,
    }));
    setRequests(mapped);
  }
};

  const showTempMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };
const updateRequestField = async (id: number, field: string, value: string) => {
  const dbField = field === "vehicle" ? "vehicle" : field === "driver" ? "driver" : "contact";
  const updated = requests.map((req) =>
    req.id === id ? { ...req, [field]: value } : req
  );
  setRequests(updated);
  await supabase.from("requests").update({ [dbField]: value }).eq("id", id);
};


const updateStatus = async (id: number, status: RequestItem["status"]) => {
  const updateData: any = { status };
  if (status === "Declined") {
    updateData.vehicle = "";
    updateData.driver = "";
    updateData.contact = "";
  }

  await supabase.from("requests").update(updateData).eq("id", id);
  await loadRequests();

  const targetRequest = requests.find((req) => req.id === id);
  if (targetRequest && (status === "Approved" || status === "Declined")) {
    addActivityLog({
      type: "Request",
      action: status === "Approved" ? "Approved Request" : "Declined Request",
      requester: "",
      details: [
        `Requester: ${targetRequest.firstName} ${targetRequest.lastName}`,
        `Destination: ${targetRequest.destination}`,
        `Passengers: ${targetRequest.passengers}`,
        `Duration: ${targetRequest.duration}`,
        `Driver Type: ${targetRequest.driverType}`,
        `Departure: ${formatDeparture(targetRequest.departure)}`
      ].join("\n"),
    });
  }

  if (status === "Pending") showTempMessage("Request moved to pending.");
  else if (status === "On Process") showTempMessage("Request is now on process.");
  else if (status === "Approved") showTempMessage("Request approved successfully.");
  else showTempMessage("Request declined.");
};
    

  const handleApprove = (req: RequestItem) => {
    if (!req.driver?.trim() || !req.vehicle?.trim() || !req.contact?.trim()) {
      showTempMessage("Please fill in driver, vehicle, and contact before approving.");
      return;
    }

    updateStatus(req.id, "Approved");
  };
const handleDelete = async (id: number) => {
  const confirmDelete = window.confirm("Delete this request permanently?");
  if (!confirmDelete) return;
  await supabase.from("requests").delete().eq("id", id);
  await loadRequests();
  showTempMessage("Request deleted.");
};


const addActivityLog = async ({ type, action, requester, details }: {
  type: "Announcement" | "Request";
  action: string;
  requester: string;
  details: string;
}) => {
  const adminName = `${admin?.first_name || ""} ${admin?.last_name || ""}`.trim() || "Admin";
await supabase.from("activity_logs").insert({
    type,
    activity_type: type,
    action,
    requester,
    details,
    admin_name: adminName,
  });
  loadActivityLogs();
};

const loadActivityLogs = async () => {
  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (data) {
    const mapped = data.map((l: any) => ({
      id: l.id,
      date: l.created_at,
      type: l.type || l.activity_type,
      action: l.action,
      requester: l.requester,
      details: l.details,
      adminName: l.admin_name,
    }));
    setActivityLogs(mapped);
  }
};

const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};

  const visibleActivityLogs = useMemo(() => {
  return activityLogs.filter(
    (log) =>
      log.type === "Announcement" ||
      (log.type === "Request" &&
        (log.action === "Approved Request" || log.action === "Declined Request"))
  );

}, [activityLogs]);

const filteredActivityLogs = useMemo(() => {
  return visibleActivityLogs.filter((log) => {
    const logDate = new Date(log.date);

    const matchesName =
      !filterName.trim() ||
      log.details.toLowerCase().includes(filterName.toLowerCase());

    const matchesType =
      filterType === "All" || log.type === filterType;

    const matchesLocation =
      !filterLocation.trim() ||
      log.details.toLowerCase().includes(`destination: ${filterLocation.toLowerCase()}`);

    let matchesDate = true;

    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);

      // include whole end day
      end.setHours(23, 59, 59, 999);

      matchesDate = logDate >= start && logDate <= end;
    }

    return (
      matchesName &&
      matchesType &&
      matchesLocation &&
      matchesDate
    );
  });
}, [
  visibleActivityLogs,
  filterName,
  filterType,
  filterLocation,
  filterStartDate,
  filterEndDate,
]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) =>
      `${req.firstName} ${req.lastName} ${req.username} ${req.transportationRequest} ${req.destination} ${req.status} ${req.driverType} ${req.remarks} ${req.dateCreated}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [requests, search]);

  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const onProcessCount = requests.filter((r) => r.status === "On Process").length;
  const approvedCount = requests.filter((r) => r.status === "Approved").length;
  const declinedCount = requests.filter((r) => r.status === "Declined").length;

  const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const handleDownloadFilteredHistory = () => {
  if (filteredActivityLogs.length === 0) {
    showTempMessage("No activity history found for the selected filters.");
    return;
  }

  const headers = ["Date", "Type", "Action", "Details", "Admin"];

  const rows = filteredActivityLogs.map((log) => [
    new Date(log.date).toLocaleString(),
    log.type,
    log.action,
    log.details.replace(/\n/g, " | "),
    log.adminName,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "filtered-activity-history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handlePostAnnouncement = async () => {
  if (!announcementTitle.trim() || !announcementMessage.trim()) {
    showTempMessage("Please fill in announcement title and message.");
    return;
  }

  const adminName = `Admin ${admin?.first_name} ${admin?.last_name}`;
  const { error } = await supabase.from("announcements").insert({
    title: announcementTitle,
    message: announcementMessage,
    author: adminName,
  });

  if (!error) {
    addActivityLog({
      type: "Announcement",
      action: "Posted Announcement",
      requester: "",
      details: [`Title: ${announcementTitle}`, `Announcement: ${announcementMessage}`].join("\n"),
    });
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    showTempMessage("Announcement posted successfully.");
  }
};

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <h2 style={styles.logo}>MovenTrax</h2>

          <div style={styles.sideUserBox}>
            <p style={styles.sideUserLabel}>Administrator</p>
            <p style={styles.sideUserName}>{admin?.first_name} {admin?.last_name || "Admin"}</p>
            <p style={styles.sideUserSub}>{admin?.username || ""}</p>
          </div>

          <div style={styles.menu}>
            
                <button
                  onClick={() => setActiveSection("dashboard")}
                  style={
                    activeSection === "dashboard"
                      ? styles.menuItemActive
                      : styles.menuItem
                  }
                >
                  Home
                </button>

                <button
                  onClick={() => setActiveSection("history")}
                  style={
                    activeSection === "history"
                      ? styles.menuItemActive
                      : styles.menuItem
                  }
                >
                  Activity History
                </button>
              </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </aside>
          

      {activeSection === "dashboard" && (
        <>
          <section style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
                 {getGreeting()}, Admin {admin?.first_name} {admin?.last_name} 👋!
             </h1>

            <p style={styles.subtitle}>
                 Manage and process transportation requests.
            </p>
          </div>
        </div>

        {message && <div style={styles.alertBox}>{message}</div>}

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Total Requests</p>
            <h3 style={styles.statValue}>{totalRequests}</h3>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Pending</p>
            <h3 style={styles.statValue}>{pendingCount}</h3>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>On Process</p>
            <h3 style={styles.statValue}>{onProcessCount}</h3>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Approved</p>
            <h3 style={styles.statValue}>{approvedCount}</h3>
          </div>
        </div>

      
<div style={styles.panel}>
  <h3 style={styles.panelTitle}>Post Announcement</h3>

      <div style={styles.announcementForm}>
        <input
          type="text"
          placeholder="Announcement title"
          value={announcementTitle}
          onChange={(e) => setAnnouncementTitle(e.target.value)}
          style={styles.input}
        />

        <textarea
          placeholder="Write announcement here"
          value={announcementMessage}
          onChange={(e) => setAnnouncementMessage(e.target.value)}
          style={styles.textarea}
        />

        <button onClick={handlePostAnnouncement} style={styles.approveBtn}>
          Post Announcement
        </button>
      </div>
    </div>

<div style={styles.panel}>
          <div style={styles.searchRow}>
            <h3 style={styles.panelTitle}>All Transportation Requests</h3>
            <input
              type="text"
              placeholder="Search user, destination, request, status, or date"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>



        <div style={styles.tablePanel}>
          <div style={{
            ...styles.tableWrapper,
            maxHeight: "480px",
            overflowY: "auto",
            paddingRight: "6px",
          }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Requester</th>
                  <th style={styles.th}>Travel Details</th>
                  <th style={styles.th}>Signed Travel Order</th>
                  <th style={styles.th}>Assignment</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={styles.td}>
                      <div style={styles.requestMain}>{req.firstName} {req.lastName}</div>
                      <div style={styles.requestSub}>@{req.username}</div>
                      <div style={styles.requestSub}>{req.dateCreated}</div>
                    </td>

                    
                    <td style={styles.td}>
                      <div style={styles.detailsBox}>
                        <div><strong>Request:</strong> {req.transportationRequest}</div>
                        <div><strong>Duration:</strong> {req.duration}</div>
                        <div><strong>Destination:</strong> {req.destination}</div>
                        <div><strong>Passenger/s:</strong> {req.passengers}</div>
                        <div><strong>Departure:</strong> {formatDeparture(req.departure)}</div>
                        <div><strong>Driver Type:</strong> {req.driverType}</div>
                        <div><strong>Remarks:</strong> {req.remarks || "-"}</div>
                      </div>
                    </td>

                    <td style={styles.td}>
                      {req.signedTravelOrderData ? (
                        <div style={styles.imageBox}>
                          <img
                            src={req.signedTravelOrderData}
                            alt={req.signedTravelOrderName || "Signed Travel Order"}
                            style={styles.imagePreview}
                          />
                          <p style={styles.fileText}>
                            {req.signedTravelOrderName || "Uploaded image"}
                          </p>
                        </div>
                      ) : (
                        <span style={styles.noFileText}>No file uploaded</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.assignmentForm}>
                        <input
                          type="text"
                          placeholder="Vehicle"
                          value={req.vehicle || ""}
                          onChange={(e) =>
                            updateRequestField(req.id, "vehicle", e.target.value)
                          }
                          style={styles.smallInput}
                        />

                        <input
                          type="text"
                          placeholder="Driver"
                          value={req.driver || ""}
                          onChange={(e) =>
                            updateRequestField(req.id, "driver", e.target.value)
                          }
                          style={styles.smallInput}
                        />

                        <input
                          type="text"
                          placeholder="Contact #"
                          value={req.contact || ""}
                          onChange={(e) =>
                            updateRequestField(req.id, "contact", e.target.value)
                          }
                          style={styles.smallInput}
                        />
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.statusColumn}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(req.status === "Approved"
                              ? styles.approved
                              : req.status === "Declined"
                              ? styles.declined
                              : req.status === "On Process"
                              ? styles.onProcess
                              : styles.pending),
                          }}
                        >
                          {req.status}
                        </span>

                        {req.status === "Declined" && (
                          <p style={styles.statusNote}>
                            Due to influx of request, this request can no longer proceed.
                          </p>
                        )}

                        {req.status === "Approved" && (
                          <p style={styles.statusNote}>
                            The requester will see the driver and vehicle information.
                          </p>
                        )}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        <button
                          onClick={() => updateStatus(req.id, "Pending")}
                          style={styles.pendingBtn}
                        >
                          Pending
                        </button>

                        <button
                          onClick={() => updateStatus(req.id, "On Process")}
                          style={styles.processBtn}
                        >
                          On Process
                        </button>

                        <button
                          onClick={() => handleApprove(req)}
                          style={styles.approveBtn}
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => updateStatus(req.id, "Declined")}
                          style={styles.rejectBtn}
                        >
                          Decline
                        </button>

                        <button
                          onClick={() => handleDelete(req.id)}
                          style={styles.deleteBtn}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRequests.length === 0 && (
              <p style={styles.emptyText}>No transportation requests found.</p>
            )}
          </div>
        </div>

        <div style={styles.footerNote}>
          Make sure assignment details are complete before approving a request.
        </div>
      </section>
        </>
      )}

{/* HISTORY */}
{activeSection === "history" && (
  <section style={styles.content}>
    <div style={styles.header}>
      <div>
        <h1 style={styles.title}>Activity History</h1>
        <p style={styles.subtitle}>
          View announcements and completed transactions.
        </p>
      </div>
    </div>

   <div style={styles.panel}>
  <div style={styles.searchRow}>
  <h3 style={styles.panelTitle}>Activity Logs</h3>

  <button
    onClick={() => setShowHistoryFilters(!showHistoryFilters)}
    style={styles.iconFilterBtn}
    title="Show filters"
  >
    ☰
  </button>
</div>


  {showHistoryFilters && (
  <div style={styles.filterPanel}>
<div style={styles.historyFilters}>

   <select
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
    style={styles.historyInput}
  >
    <option value="All">All Types</option>
    <option value="Announcement">Announcement</option>
    <option value="Request">Request</option>
  </select>

  <input
    type="text"
    placeholder="Filter by name"
    value={filterName}
    onChange={(e) => setFilterName(e.target.value)}
    style={styles.historyInput}
  />
  <input
    type="text"
    placeholder="Filter by location"
    value={filterLocation}
    onChange={(e) => setFilterLocation(e.target.value)}
    style={styles.historyInput}
  />
 
  <input
    type="date"
    value={filterStartDate}
    onChange={(e) => setFilterStartDate(e.target.value)}
    style={styles.historyInput}
  />

  <input
    type="date"
    value={filterEndDate}
    onChange={(e) => setFilterEndDate(e.target.value)}
    style={styles.historyInput}
  />
</div>

    <div style={styles.filterActions}>
      <button
        onClick={handleDownloadFilteredHistory}
        style={styles.approveBtn}
      >
        Download
      </button>

      <button
        onClick={() => {
          setFilterName("");
          setFilterType("All");
          setFilterLocation("");
          setFilterStartDate("");
          setFilterEndDate("");
        }}
        style={styles.clearBtn}
      >
        Clear
      </button>
    </div>
  </div>
)}

  <div
    style={{
      ...styles.tableWrapper,
      maxHeight: "400px",
      overflowY: "auto",
      paddingRight: "6px",
    }}
  >
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Type</th>
          <th style={styles.th}>Action</th>
          <th style={styles.th}>Details</th>
          <th style={styles.th}>Admin</th>
        </tr>
      </thead>
      <tbody>
        {filteredActivityLogs.map((log) => (
          <tr key={log.id}>
            <td style={styles.td}>{new Date(log.date).toLocaleString()}</td>
            <td style={styles.td}>{log.type}</td>
            <td style={styles.td}>{log.action}</td>
            <td style={{ ...styles.td, whiteSpace: "pre-line", lineHeight: "1.6" }}>
              {log.details}
            </td>
            <td style={styles.td}>{log.adminName}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {filteredActivityLogs.length === 0 && (
      <p style={styles.emptyText}>No activity history found.</p>
    )}
  </div>
</div>

  </section>
)}
  
    </main>
  );
}

function formatDeparture(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const styles: { [key: string]: React.CSSProperties } = {
page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(200px, 260px) 1fr",
    background: "#f3f6fb",
    overflowX: "hidden",
  },
  sidebar: {
    background: "#111827",
    color: "white",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  logo: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
  },
  sideUserBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "14px",
    marginTop: "24px",
  },
  sideUserLabel: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.8,
  },
  sideUserName: {
    margin: "8px 0 4px 0",
    fontWeight: 700,
    fontSize: "16px",
  },
  sideUserSub: {
    margin: 0,
    fontSize: "13px",
    opacity: 0.85,
  },
  menu: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  menuItemActive: {
    background: "#2563eb",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: 700,
  },
  logoutBtn: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },

  content: {
    padding: "28px",
    minWidth: "0",
    overflowX: "auto",
  
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "8px",
    color: "#64748b",
  },
  alertBox: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "18px",
    fontWeight: 600,
  },
statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  statCard: {
    background: "white",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },
  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },
  statValue: {
    margin: "10px 0 0 0",
    fontSize: "28px",
    color: "#0f172a",
  },
  panel: {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  panelTitle: {
    margin: 0,
    color: "#374151",
    fontSize: "18px",
  },
  searchRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "center",
  },
  searchInput: {
    width: "360px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#374151",
    outline: "none",
  },
  tablePanel: {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: "14px",
    verticalAlign: "top",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #f1f5f9",
    color: "#0f172a",
    fontSize: "14px",
    verticalAlign: "top",
  },
  requestMain: {
    fontWeight: 700,
    color: "#0f172a",
  },
  requestSub: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
  },
  detailsBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "#334155",
    fontSize: "13px",
    minWidth: "240px",
  },

 announcementForm: {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
},
input:{
  color: "#374151",
  fontSize: "14px",
},

textarea: {
  width: "100%",
  minHeight: "100px",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  resize: "vertical",
  fontFamily: "inherit",
  color: "#374151",
},

  imageBox: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "160px",
  },
  imagePreview: {
    width: "140px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  fileText: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    maxWidth: "150px",
    wordBreak: "break-word",
  },
  noFileText: {
    color: "#64748b",
    fontSize: "13px",
  },
  assignmentForm: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "180px",
  },
  smallInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    outline: "none",
  },
  statusColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "120px",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    display: "inline-block",
    width: "fit-content",
  },
  pending: {
    background: "#fef3c7",
    color: "#92400e",
  },
  onProcess: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  approved: {
    background: "#dcfce7",
    color: "#166534",
  },
  declined: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  statusNote: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "120px",
  },
  pendingBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#f59e0b",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  processBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  approveBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  rejectBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#6b7280",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  emptyText: {
    color: "#64748b",
    marginTop: "14px",
  },
footerNote: {
  marginTop: "10px",
  color: "#64748b",
  fontSize: "14px",
},
menuItem: {
  background: "transparent",
  padding: "12px 14px",
  borderRadius: "12px",
  fontWeight: 700,
  color: "white",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
},

historyFilters: {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginTop: "14px",
  marginBottom: "16px",
},
historyInput: {
  padding: "14px 18px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  fontSize: "14px",
  color: "#334155",
  background: "#ffffff",
  outline: "none",
  minWidth: "180px",
  transition: "all 0.2s ease",
},

iconFilterBtn: {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  border: "1px solid #d1d5db",
  background: "white",
  color: "#334155",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},
filterPanel: {
  marginTop: "16px",
  marginBottom: "18px",
  padding: "18px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
},

filterActions: {
  display: "flex",
  gap: "12px",
},

clearBtn: {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "white",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 700,
},

};
