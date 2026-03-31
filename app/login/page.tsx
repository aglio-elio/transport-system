"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    const fakeEmail = `${username}@moventrax.com`;

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: password,
    });

    if (authError) {
      setError("Invalid username or password.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("Could not fetch user profile.");
      return;
    }

    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  };

  

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.leftPanel}>
          <h1 style={styles.brand}>MovenTrax</h1>
          <h3 style={styles.leftTitle}>Request. Approve. Dispatch. Done.</h3>
          <p style={styles.leftText}>
            A smarter way to manage transportation requests, approvals, dispatching, and status tracking in one platform.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.title}>Login</h2>
          <p style={styles.subtitle}>Sign in to continue</p>

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

            <button type="submit" style={styles.button}>
              Login
            </button>
          </form>

          <p style={styles.footer}>
            No account yet?{" "}
            <Link href="/signup" style={styles.link}>
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
  },
  wrapper: {
    width: "100%",
    maxWidth: "1000px",
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
  },
  leftPanel: {
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "white",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  brand: {
    fontSize: "42px",
    margin: 0,
    fontWeight: 800,
  },
  leftTitle: {
    fontSize: "25px",
    marginTop: "10px",
    marginBottom: "12px",
  },
  leftText: {
    fontSize: "15px",
    lineHeight: 1.7,
    maxWidth: "420px",
    opacity: 5,

  },
  card: {
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "#ffffff",
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
    marginBottom: "28px",
    fontSize: "14px",
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
  },
};