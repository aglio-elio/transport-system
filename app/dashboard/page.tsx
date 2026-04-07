"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  weight: "700",
  subsets: ["latin"],
});

type RequestItem = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  transportationRequest: string;
  duration: string;
  destination: string;
  passengers: string;
  departure: string;
  signedTravelOrderName: string;
  signedTravelOrderData: string;
  driverType: string;
  remarks: string;
  status: "Pending" | "On Process" | "Approved" | "Declined" | "Cancelled";
  dateCreated: string;
  vehicle?: string;
  driver?: string;
  contact?: string;
};

const emptyForm = {
  transportationRequest: "",
  duration: "",
  destination: "",
  passengers: "",
  departure: "",
  signedTravelOrderName: "",
  signedTravelOrderData: "",
  driverType: "",
  remarks: "",
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [search, setSearch] = useState("");

  const [transportationRequest, setTransportationRequest] = useState("");
  const [duration, setDuration] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("");
  const [departure, setDeparture] = useState("");
  const [signedTravelOrderName, setSignedTravelOrderName] = useState("");
  const [signedTravelOrderData, setSignedTravelOrderData] = useState("");
  const [driverType, setDriverType] = useState("");
  const [remarks, setRemarks] = useState("");

  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [showAnnouncements, setShowAnnouncements] = useState(false);  

  const [readIds, setReadIds] = useState<number[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
const [entriesPerPage, setEntriesPerPage] = useState(0);

useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error || !profile || profile.role !== "user") {
      router.push("/login");
      return;
    }

setUser(profile);
loadUserRequests(session.user.id);

const { data: readData } = await supabase
  .from("read_announcements")
  .select("announcement_id")
  .eq("user_id", session.user.id);

if (readData) setReadIds(readData.map((r: any) => r.announcement_id));
const { data: announcementsData } = await supabase
  .from("announcements")
  .select("*")
  .order("created_at", { ascending: false });

if (announcementsData) setAnnouncements(announcementsData);
  };

  checkUser();
}, [router]);

  const loadUserRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", userId)
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

const fileInputRef = useRef<HTMLInputElement>(null);

const resetForm = () => {
  setTransportationRequest(emptyForm.transportationRequest);
  setDuration(emptyForm.duration);
  setDestination(emptyForm.destination);
  setPassengers(emptyForm.passengers);
  setDeparture(emptyForm.departure);
  setSignedTravelOrderName(emptyForm.signedTravelOrderName);
  setSignedTravelOrderData(emptyForm.signedTravelOrderData);
  setDriverType(emptyForm.driverType);
  setRemarks(emptyForm.remarks);
  setEditingId(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

  const showTempMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignedTravelOrderName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSignedTravelOrderData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user || !transportationRequest.trim() || !duration.trim() ||
    !destination.trim() || !passengers.trim() || !departure.trim() || !driverType.trim()) {
    showTempMessage("Please complete all required fields.");
    return;
  }

  if (editingId !== null) {
    const { error } = await supabase
      .from("requests")
      .update({
        transportation_request: transportationRequest,
        duration,
        destination,
        passengers,
        departure,
        signed_travel_order_name: signedTravelOrderName || undefined,
        signed_travel_order_data: signedTravelOrderData || undefined,
        driver_type: driverType,
        remarks,
      })
      .eq("id", editingId);

    if (!error) {
      const { data: { session } } = await supabase.auth.getSession();
      loadUserRequests(session!.user.id);
      resetForm();
      showTempMessage("Request updated successfully.");
    }
    return;
  }

  const { error } = await supabase.from("requests").insert({
    user_id: (await supabase.auth.getSession()).data.session?.user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    transportation_request: transportationRequest,
    duration,
    destination,
    passengers,
    departure,
    signed_travel_order_name: signedTravelOrderName,
    signed_travel_order_data: signedTravelOrderData,
    driver_type: driverType,
    remarks,
    status: "Pending",
  });

  if (!error) {
    const { data: { session } } = await supabase.auth.getSession();
    loadUserRequests(session!.user.id);
    resetForm();
    showTempMessage("Your request was received and is now pending.");
  } else {
    showTempMessage("Error submitting request: " + error.message);
  }
};

  const handleEdit = (req: RequestItem) => {
  setEditingId(req.id);
  setTransportationRequest(req.transportationRequest || "");
  setDuration(req.duration || "");
  setDestination(req.destination || "");
  setPassengers(req.passengers || "");
  setDeparture(req.departure || "");
  setSignedTravelOrderName(req.signedTravelOrderName || "");
  setSignedTravelOrderData(req.signedTravelOrderData || "");
  setDriverType(req.driverType || "");
  setRemarks(req.remarks || "");
};


const handleDelete = async (id: number) => {
  if (!user) return;
  const confirmDelete = window.confirm("Are you sure you want to cancel this request?");
  if (!confirmDelete) return;

  const { error } = await supabase
    .from("requests")
    .update({ status: "Cancelled" })
    .eq("id", id);

  if (!error) {
    const { data: { session } } = await supabase.auth.getSession();
    loadUserRequests(session!.user.id);
    if (editingId === id) resetForm();
    showTempMessage("Request has been cancelled.");
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

const handleRead = async (id: number) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { error } = await supabase.from("read_announcements").insert({
    user_id: session.user.id,
    announcement_id: id,
  });
  if (!error) setReadIds((prev) => [...prev, id]);
};

  const filteredRequests = useMemo(() => {
    return requests.filter((req) =>
      `${req.transportationRequest} ${req.destination} ${req.status} ${req.dateCreated} ${req.driverType} ${req.remarks}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [requests, search]);

const totalPages =
  entriesPerPage === 0
    ? 0
    : Math.ceil(filteredRequests.length / entriesPerPage);

const paginatedRequests = useMemo(() => {
  if (entriesPerPage === 0) return [];
  const start = (currentPage - 1) * entriesPerPage;
  return filteredRequests.slice(start, start + entriesPerPage);
}, [filteredRequests, currentPage, entriesPerPage]);

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

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
        <h2 style={styles.brand} className={orbitron.className}>MovenTrax</h2>

          <div style={styles.sideUserBox}>
           {/* <p style={styles.sideUserLabel}>Logged in as</p> */}
            <p style={styles.sideUserName}>{user?.first_name} {user?.last_name || ""}</p>
            <p style={styles.sideUserSub}>{user?.username || ""}</p>
          </div>

          <div style={styles.menu}>
            <div style={styles.menuItemActive}>Home</div>
          </div>
        </div>

          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            onMouseEnter={e => (e.currentTarget.style.background = "#811010")}
            onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            Logout
          </button>
      </aside>

      <section style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {getGreeting()}, {user?.first_name} {user?.last_name}👋
            </h1>

            <p style={styles.subtitle}>
              Welcome back! Manage your transportation requests and track status here.
            </p>

          </div>
        </div>

        {message && <div style={styles.alertBox}>{message}</div>}

    <div style={styles.panelLarge}>
  <div style={styles.announcementHeader}>
    <h3 style={styles.panelTitle}>
      📢Announcements ({announcements.filter(a => !readIds.includes(a.id)).length})
    </h3>

    <button
      type="button"
      onClick={() => setShowAnnouncements(!showAnnouncements)}
      style={styles.toggleBtn}
    >
      {showAnnouncements ? "Hide" : "Show"}
    </button>
  </div>

  {showAnnouncements && (
    <>
      {announcements.length > 0 ? (
        <div style={styles.announcementList}>
        
        {announcements.map((item) => {
          const isRead = readIds.includes(item.id);
          return (
            <div key={item.id} style={{
              ...styles.announcementCard,
              opacity: isRead ? 0.5 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h4 style={styles.announcementTitle}>{item.title}</h4>
                {!isRead && (
                  <button
                    onClick={() => handleRead(item.id)}
                    style={styles.readBtn}
                  >
                    Mark as Read
                  </button>
                )}
                {isRead && (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Read</span>
                )}
              </div>
              <p style={styles.announcementMessage}>{item.message}</p>
              <p style={styles.announcementMeta}>
                Posted by {item.author} • {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
        </div>
      ) : (
        <p style={styles.emptyText}>No announcements available.</p>
      )}
    </>
  )}
</div>

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

        <div style={styles.mainGrid}>
          <div style={styles.panelLarge}>
            <h3 style={styles.panelTitle}>
              {editingId !== null ? "Edit Transportation Request" : "Transportation Request Form"}
            </h3>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Transportation Request</label>
                <input
                  type="text"
                  placeholder="Enter transportation request"
                  value={transportationRequest}
                  onChange={(e) => setTransportationRequest(e.target.value)}
                  style={styles.input}
                              />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Duration of Travel</label>
                <input
                  type="text"
                  placeholder="e.g. 1 day / 3 hours"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Destination</label>
                <input
                  type="text"
                  placeholder="Enter destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Passenger/s</label>
                <input
                  type="text"
                  placeholder="Enter passenger names or count"
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Time of Departure</label>
                <input
                  type="datetime-local"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Driver Type</label>
                <select
                  value={driverType}
                  onChange={(e) => setDriverType(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select option</option>
                  <option value="Stay In">Stay In</option>
                  <option value="Pickup / Drop Off">Pickup / Drop Off</option>
                </select>
              </div>

              <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Signed Travel Order (Picture)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                {signedTravelOrderName && (
                  <p style={styles.fileName}>Selected file: {signedTravelOrderName}</p>
                )}
              </div>

              <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Remarks / Concerns (Optional)</label>
                <textarea
                  placeholder="Enter remarks or concerns"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.actionRow}>
              <button
                type="submit"
                style={styles.primaryBtn}
                onMouseEnter={e => (e.currentTarget.style.background = "#0a2b86")}
                onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                {editingId !== null ? "Update Request" : "Submit"}
              </button>

                {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={styles.secondaryBtn}
                  onMouseEnter={e => (e.currentTarget.style.background = "#777a7f")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#e5e7eb")}
                  onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                  onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  Cancel Edit
                </button>
                )}
              </div>
            </form>
          </div>

          <div style={styles.panelSmall}>
            <h3 style={styles.panelTitle}>Status Summary</h3>
            <div style={styles.summaryList}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDotPending}></span>
                <span>Pending: request received</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDotProcess}></span>
                <span>On Process: request under review</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDotApproved}></span>
                <span>Approved: ready to proceed</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDotDeclined}></span>
                <span>Declined: cannot proceed</span>
              </div>
            </div>

            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>Notice</h4>
              <p style={styles.infoText}>
                Approved requests may later display assigned driver, vehicle, and contact details.
              </p>
            </div>

            <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>Decline Note</h4>
              <p style={styles.infoText}>
                If a request is declined, further inquiries may be directed to the proper office section.
              </p>
            </div>
          </div>
        </div>

        <div style={styles.panelLarge}>
          <div style={styles.tableHeader}>
            <h3 style={styles.panelTitle}>Track Transportation Request Status</h3>
            <input
              type="text"
              placeholder="Search request, destination, status, or date"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={styles.searchInput}
            />
          </div>
            
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#64748b", marginBottom: "12px" }}>
                Show
                <select
                  value={entriesPerPage}
                  onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#374151", outline: "none" }}
                >
                  <option value={0}>Select</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                entries per page
              </div>

              <div style={{
                ...styles.tableWrapper,
                maxHeight: "480px",
                overflowY: "auto",
                paddingRight: "6px",
              }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Request</th>
                  <th style={styles.th}>Destination</th>
                  <th style={styles.th}>Passengers</th>
                  <th style={styles.th}>Departure</th>
                  <th style={styles.th}>Driver Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Driver / Vehicle Info</th>
                  <th style={styles.th}>Actions</th>
                  
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={styles.td}>
                      <div style={styles.requestMain}>{req.transportationRequest}</div>
                        <div style={styles.requestSub}>
                          {new Date(req.dateCreated).toLocaleString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>   
                 </td>
                    <td style={styles.td}>{req.destination}</td>
                    <td style={styles.td}>{req.passengers}</td>
                    <td style={styles.td}>{formatDeparture(req.departure)}</td>
                    <td style={styles.td}>{req.driverType}</td>
                    <td style={styles.td}>
                      <span
                      
                      style={{
                        ...styles.statusBadge,
                        ...(req.status === "Approved"
                          ? styles.approved
                          : req.status === "Declined"
                          ? styles.declined
                          : req.status === "On Process"
                          ? styles.onProcess
                          : req.status === "Cancelled"
                          ? styles.cancelled
                          : styles.pending),
                      }}
                                            >
                        {req.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                    
                      {req.status === "Approved" ? (
                        <div style={styles.assignmentBox}>
                          <div><strong>Vehicle:</strong> {req.vehicle || "To be assigned"}</div>
                          <div><strong>Driver:</strong> {req.driver || "To be assigned"}</div>
                          <div><strong>Contact:</strong> {req.contact || "To be assigned"}</div>
                        </div>
                      ) : req.status === "Declined" ? (
                        <span style={styles.declineText}>
                          Due to influx of requests, this request can no longer proceed.
                        </span>
                      ) : req.status === "Cancelled" ? (
                        <span style={{ fontSize: "13px", color: "#dc2626" }}>
                          This request was cancelled.
                        </span>
                      ) : (
                        <span style={styles.pendingText}>
                          Your request is {req.status.toLowerCase()}.
                        </span>
                      )}


                    </td>
                    
                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        {req.status === "Pending" && (
                          <>
                          <button
                            onClick={() => handleEdit(req)}
                            style={styles.editBtn}
                            onMouseEnter={e => (e.currentTarget.style.background = "#0a2b86")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
                            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.95)")}
                            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                          >
                            Edit
                          </button>
                                                                              
                          <button
                            onClick={() => handleDelete(req.id)}
                            style={styles.deleteBtn}
                            onMouseEnter={e => (e.currentTarget.style.background = "#811010")}
                            onMouseLeave={e => (e.currentTarget.style.background = "#dc2626")}
                            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.95)")}
                            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                          >
                            Cancel Request
                          </button>

                          </>
                        )}
                        {req.status === "On Process" && (
                          <span style={{ fontSize: "12px", color: "#1d4ed8" }}>Under review</span>
                        )}
                        {req.status === "Approved" && (
                          <span style={{ fontSize: "12px", color: "#16a34a" }}>No actions available</span>
                        )}
                        {req.status === "Declined" && (
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>No actions available</span>
                        )}
                        {req.status === "Cancelled" && (
                          <span style={{ fontSize: "12px", color: "#dc2626" }}>Request cancelled</span>
                        )}
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredRequests.length)} of {filteredRequests.length} entries
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: "5px 9px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", color: currentPage === 1 ? "#cbd5e1" : "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}>«</button>
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: "5px 9px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", color: currentPage === 1 ? "#cbd5e1" : "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "13px" }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                const showLeftDots = page === currentPage - 2 && currentPage > 3;
                const showRightDots = page === currentPage + 2 && currentPage < totalPages - 2;
                if (showLeftDots) return <span key={`l${page}`} style={{ padding: "5px 6px", fontSize: "13px", color: "#94a3b8" }}>...</span>;
                if (showRightDots) return <span key={`r${page}`} style={{ padding: "5px 6px", fontSize: "13px", color: "#94a3b8" }}>...</span>;
                if (!showPage) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", background: currentPage === page ? "#2563eb" : "white", color: currentPage === page ? "white" : "#374151", cursor: "pointer", fontWeight: currentPage === page ? 700 : 400, fontSize: "13px" }}>{page}</button>
                );
              })}
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: "5px 9px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", color: currentPage === totalPages ? "#cbd5e1" : "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px" }}>›</button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: "5px 9px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "white", color: currentPage === totalPages ? "#cbd5e1" : "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "13px" }}>»</button>
            </div>
          </div>
        </div>

        <div style={styles.footerNote}>
          Complete your request carefully before submission to avoid delays in processing.
        </div>
      </section>
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
    color: "#374151",
    overflowX: "hidden",
  },


  sidebar: {
    background: "#0f172a",
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
    background: "#1d4ed8",
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
    transition: "background 0.15s, transform 0.1s",

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
    fontWeight: 700,
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

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "16px",
    marginBottom: "20px",
    height: "inline-block",
  },
  panelLarge: {
    background: "white",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    marginBottom: "20px",
  },
  panelSmall: {
    background: "white",
    borderRadius: "10px",
    padding: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    height: "inline-block",
  },
  panelTitle: {
    fontWeight: 700,
    marginTop: 0,
    marginBottom: "14px",
    color: "#0f172a",
    fontSize: "18px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    background: "white",
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    background: "white",
  },
  fileName: {
    margin: 0,
    fontSize: "13px",
    color: "#475569",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  actionRow: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "12px",
    marginTop: "6px",
  },
  primaryBtn: {
    padding: "13px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s, transform 0.1s",

  },
  secondaryBtn: {
    padding: "13px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s, transform 0.1s",

  },
  summaryList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "18px",
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#334155",
    fontSize: "14px",
  },
  summaryDotPending: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#f59e0b",
  },
  summaryDotProcess: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#3b82f6",
  },
  summaryDotApproved: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#16a34a",
  },
  summaryDotDeclined: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#dc2626",
  },
  infoCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "14px",
    marginTop: "12px",
  },
  infoTitle: {
    margin: "0 0 8px 0",
    color: "#0f172a",
    fontSize: "15px",
  },
  infoText: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    marginBottom: "12px",
  },
  searchInput: {
    width: "340px",
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
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
    lineHeight: 1.5,
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
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    display: "inline-block",
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
  assignmentBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#334155",
    fontSize: "13px",
  },
  pendingText: {
    color: "#64748b",
    fontSize: "13px",
  },
  declineText: {
    color: "#b91c1c",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  editBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    transition: "background 0.15s, transform 0.1s",

  },
  deleteBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    transition: "background 0.15s, transform 0.1s",

  },
  emptyText: {
    color: "#64748b",
    marginTop: "14px",
  },
  footerNote: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "14px",
  },

  announcementList: {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  maxHeight: "350px",
  overflowY: "auto",
  paddingRight: "6px",
},

announcementCard: {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "14px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
},

announcementTitle: {
  margin: "0 0 8px 0",
  fontSize: "16px",
  fontWeight: 700,
  color: "#2563eb",
},

announcementMessage: {
  margin: "0 0 8px 0",
  fontSize: "14px",
  color: "#334155",
  lineHeight: 1.6,
},

announcementMeta: {
  margin: 0,
  fontSize: "12px",
  color: "#64748b",
},

announcementHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
},

toggleBtn: {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
},

cancelled: {
  background: "#f1f5f9",
  color: "#475569",
},

readBtn: {
  padding: "5px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#f1f5f9",
  color: "#475569",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "12px",
  whiteSpace: "nowrap" as const,
},

brand: {
    fontSize: "clamp(24px, 5vw, 28px)",
    margin: 0,
    fontWeight: 900,
  },
};