import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  LockKeyhole,
  Mail,
  Loader2,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { ldapLogin } from "../services/authService";
import { saveSession } from "../utils/session";
import type { CompanyOption } from "../types/auth";
import logo from "../assets/new1.png";
import loginBg from "../assets/123.jpeg";

type FormState = {
  username: string;
  password: string;
  company_name: CompanyOption;
};
const companyOptions: Array<{ value: CompanyOption; label: string }> = [
  { value: "McLarens", label: "McLarens" },
  { value: "GAC", label: "GAC" },
  { value: "M&D", label: "MLL / IOL" },
];

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    username: "",
    password: "",
    company_name: "McLarens",
  });

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fieldShellClass = "login-field-shell px-4";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!form.username.trim() || !form.password.trim() || !form.company_name) {
      setErrorText("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const user = await ldapLogin({
        username: form.username.trim(),
        password: form.password,
        company_name: form.company_name,
      });

      saveSession(user);
      navigate("/", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-shell relative h-[100dvh] overflow-hidden bg-[linear-gradient(145deg,#031225_0%,#082554_35%,#0d3f8a_70%,#082b5d_100%)]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.78]"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,14,34,0.16)_0%,rgba(5,24,56,0.1)_45%,rgba(8,36,81,0.18)_100%)]" />

      <div className="login-page-inner relative z-10">
        <div className="login-card rounded-[32px] border border-[rgba(255,255,255,0.18)] bg-[linear-gradient(180deg,rgba(5,20,46,0.14)_0%,rgba(8,28,62,0.08)_100%)] shadow-[0_20px_48px_rgba(2,11,28,0.12)] backdrop-blur-[6px]">
          <div className="login-card-header border-b border-white/8 bg-[linear-gradient(180deg,rgba(16,53,110,0.06)_0%,rgba(6,22,48,0)_100%)]">
            <div className="text-center">
              <div className="login-logo-wrap">
                <img
                  src={logo}
                  alt="McApps Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="login-title font-bold tracking-tight text-white">
                Sign In to Continue
              </h1>
            </div>
          </div>

          <div className="login-form-wrap">
            <form onSubmit={handleSubmit} className="login-form">
              <div>
                <label className="login-field-label mb-1.5 block text-sm font-semibold">
                  Username or Email
                </label>
                <div className={fieldShellClass}>
                  <Mail size={17} className="login-field-icon" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username or email"
                    autoComplete="username"
                    className="login-field-input"
                  />
                </div>
              </div>

              <div>
                <label className="login-field-label mb-1.5 block text-sm font-semibold">
                  Password
                </label>
                <div className={fieldShellClass}>
                  <LockKeyhole size={17} className="login-field-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="login-field-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="login-field-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="login-field-label mb-1.5 block text-sm font-semibold">
                  Company
                </label>
                <div className={fieldShellClass}>
                  <Building2 size={17} className="login-field-icon" />
                  <div className="relative min-w-0 flex-1">
                    <select
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      className="login-field-select"
                    >
                      {companyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="login-select-arrow">
                      <ChevronDown size={18} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="login-feedback-slot">
                {errorText ? (
                  <div className="login-feedback-message rounded-2xl border border-[rgba(255,115,115,0.24)] bg-[linear-gradient(180deg,rgba(112,22,32,0.34)_0%,rgba(66,13,20,0.28)_100%)] font-medium text-[#ffd2d7] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    {errorText}
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit-button flex w-full items-center justify-center gap-2 border border-[#5eabff]/25 bg-[linear-gradient(135deg,#2f7fff_0%,#5ca9ff_100%)] px-4 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(47,127,255,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
