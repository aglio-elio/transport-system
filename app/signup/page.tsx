"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

import { Orbitron } from "next/font/google";

const orbitron = Orbitron({
  weight: "700",
  subsets: ["latin"],
});

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  

const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

if (!firstName.trim()) { setError("First name is required."); setIsSubmitting(false); return; }
if (!lastName.trim()) { setError("Last name is required."); setIsSubmitting(false); return; }
if (!username.trim()) { setError("Username is required."); setIsSubmitting(false); return; }
if (!password) { setError("Password is required."); setIsSubmitting(false); return; }
if (!confirmPassword) { setError("Please confirm your password."); setIsSubmitting(false); return; }
if (password !== confirmPassword) { setError("Passwords do not match."); setIsSubmitting(false); return; }
if (role === "admin") {
  if (!adminKey) { setError("Admin key is required."); setIsSubmitting(false); return; }
  if (adminKey !== "NIA_ADMIN_PASSWORD") { setError("Invalid admin key."); setIsSubmitting(false); return; }
}

    const fakeEmail = `${username}@moventrax.com`;

    try{
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: authData.user?.id,
      first_name: firstName,
      last_name: lastName,
      username: username,
      role: role,
    });

    if (error) {
      setError("Error creating account: " + error.message);
      return;
    }

    setSuccess("Account created successfully!");
    setTimeout(() => router.push("/login"), 1000);
}
catch (err) {
    console.error("Signup error:", err);
    setError("Something went wrong. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.leftPanel}>
        <h1 style={styles.brand} className={orbitron.className}>MovenTrax</h1>
          <h2 style={styles.leftTitle}>Create your account</h2>
          <p style={styles.leftText}>
            Register as a user to submit transport requests, or as an admin to manage and approve requests.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.title}>Sign Up</h2>
          <p style={styles.subtitle}>Fill in your details</p>

          <form onSubmit={handleSignup} style={styles.form}>
            
          <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={styles.input}
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={styles.input}
        />

            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />

            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />

            <div style={styles.roleBox}>
              <label style={styles.roleLabel}>
                <input
                  type="radio"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                />
                User
              </label>

              <label style={styles.roleLabel}>
                <input
                  type="radio"
                  value="admin"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                />
                Admin
              </label>
            </div>

            {role === "admin" && (
              <input
                type="text"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                style={styles.input}
              />
            )}

            {error && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-geist-sans)",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: "spin 0.8s linear infinite" }}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          </form>

          <p style={styles.footer}>
            Already have an account?{" "}

          <Link
            href="/login"
            style={styles.link}
            onMouseEnter={e => (e.currentTarget.style.color = "#0e9b3a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2563eb")}
            onMouseDown={e => (e.currentTarget.style.color = "#1e40af")}
            onMouseUp={e => (e.currentTarget.style.color = "#1d4ed8")}
          >
            Login
          </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#eef2f7",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "24px",
    overflowX: "hidden",
  },
  wrapper: {
    width: "100%",
    maxWidth: "1040px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
  },
  leftPanel: {
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  brand: {
    fontSize: "clamp(24px, 5vw, 42px)",
    margin: 0,
    fontWeight: 800,
  },
  leftTitle: {
    fontSize: "clamp(18px, 3vw, 30px)",
    marginTop: "16px",
    marginBottom: "12px",
  },
  leftText: {
    fontSize: "15px",
    lineHeight: 1.7,
    maxWidth: "430px",
    opacity: 0.95,
  },
  card: {
    padding: "36px 32px",
    background: "#ffffff",
    minWidth: "0",
    overflowY: "auto",
  },
  title: {
    fontSize: "28px",
    margin: 0,
    color: "#111827",
    fontWeight: 700,
  },
  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
    marginBottom: "24px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#374151",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  roleBox: {
    display: "flex",
    justifyContent: "space-between",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  roleLabel: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 600,
  },
  button: {
    marginTop: "6px",
    padding: "13px",
    border: "none",
    borderRadius: "12px",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "15px",
    width: "100%",
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    margin: 0,
  },
  success: {
    color: "#16a34a",
    fontSize: "14px",
    margin: 0,
  },
  footer: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#4b5563",
    textAlign: "center",
  },
  link: {
    color: "#2563eb",
    fontWeight: 700,
    textDecoration: "none",
  },
};