"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Orbitron } from "next/font/google";
import { Kanit } from "next/font/google";

const orbitron = Orbitron({
  weight: "700",
  subsets: ["latin"],
});
const kanit = Kanit({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kanit",
});

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoggingIn(true);

  // Validation
  if (!username.trim()) {
    setError("Username is required.");
    setIsLoggingIn(false);
    return;
  }
  if (!password) {
    setError("Password is required.");
    setIsLoggingIn(false);
    return;
  }

  try {
    // Step 1: Look up the user profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username.trim())
      .single();

    if (profileError || !profile) {
      setError("Invalid username or password.");
      setIsLoggingIn(false);
      return;
    }

    // Step 2: Authenticate via Supabase Auth using the stored fake email pattern
    const fakeEmail = `${username.trim()}@moventrax.com`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });

    if (authError || !authData.user) {
      setError("Invalid username or password.");
      setIsLoggingIn(false);
      return;
    }

    // Step 3: Persist user profile in localStorage for easy access
    localStorage.setItem("loggedInUser", JSON.stringify(profile));

    // Step 4: Redirect based on role
    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  } catch (err) {
    console.error("Login error:", err);
    setError("Something went wrong. Please try again.");
  } finally {
    setIsLoggingIn(false);
  }
};

  

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.leftPanel}>
<h1 style={styles.brand} className={orbitron.className}>MovenTrax</h1>
          <h3 style={styles.leftTitle} className={kanit.className}>
            Request. Approve. Dispatch. Done.
          </h3>

          <p style={styles.leftText}>
          Manage transportation requests, approvals, dispatch, and tracking in one place.
          </p> 

        </div>

        <div style={styles.card}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to your account to continue.</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isLoggingIn ? 0.7 : 1,
              cursor: isLoggingIn ? "not-allowed" : "pointer",
            }}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
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
                Logging in...
              </span>
            ) : (
              "Login"
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
            No account yet?{" "}
            
          <Link
            href="/signup"
            style={styles.link}
            onMouseEnter={e => (e.currentTarget.style.color = "#0e9b3a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#2563eb")}
            onMouseDown={e => (e.currentTarget.style.color = "#1e40af")}
            onMouseUp={e => (e.currentTarget.style.color = "#1d4ed8")}
          >
            Sign up
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
  alignItems: "center",
  padding: "24px",
  fontFamily: "var(--font-geist-sans)",  
},

  wrapper: {
    width: "100%",
    maxWidth: "1000px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
  },

  leftPanel: {
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "white",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
brand: {
    fontSize: "clamp(32px, 5vw, 50px)",
    margin: 0,
    fontWeight: 900,
  },

leftTitle: {
    fontSize: "clamp(16px, 3vw, 25px)",
    marginTop: "5px",
    marginBottom: "5px",
  },

  leftText: {
    fontSize: "15px",
    lineHeight: 1.7,
    maxWidth: "420px",
    opacity: 3,

  },
  card: {
    padding: "38px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#ffffff",
  },
  title: {
    fontSize: "25px",
    margin: 0,
    color: "#111827",
    fontWeight: 600,
  },
  subtitle: {
    color: "#6b7280",
    marginTop: "0.8px",
    marginBottom: "28px",
    fontSize: "13px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#374151",
    outline: "none",
  },
  button: {
    marginTop: "8px",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    transform: "scale(1)",
    transition: "all 0.15s ease",
  },
  error: {
    color: "#dc2626",
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
    transform: "scale(1)",
    transition: "color 0.15s ease",
  },
};