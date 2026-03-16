import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, LockKeyhole, Mail, Loader2 } from "lucide-react";
import { ldapLogin } from "../services/authService";
import { saveSession } from "../utils/session";
import type { CompanyOption } from "../types/auth";
import logo from "../assets/mcapps.png";

type FormState = {
  username: string;
  password: string;
  company_name: CompanyOption;
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    username: "",
    password: "",
    company_name: "McLarens",
  });

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

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
    <div className="relative h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(47,102,204,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(95,137,218,0.12),transparent_26%),linear-gradient(180deg,#eef4ff_0%,#e7efff_52%,#edf4ff_100%)] px-3 py-3 sm:px-4 sm:py-4">
      <div className="absolute left-[-60px] top-[-60px] h-[180px] w-[180px] rounded-full bg-[#2f66cc]/12 blur-[60px]" />
      <div className="absolute bottom-[-70px] right-[-70px] h-[220px] w-[220px] rounded-full bg-[#5f89da]/14 blur-[70px]" />

      <div className="relative z-10 mx-auto grid h-full w-full max-w-[1180px] overflow-hidden rounded-[26px] border border-white/40 bg-white/18 shadow-[0_24px_70px_rgba(35,76,150,0.16)] backdrop-blur-[18px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative hidden lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,102,204,0.94)_0%,rgba(34,78,159,0.92)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_22%)]" />

          <div className="relative flex h-full w-full flex-col justify-between p-7 xl:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/14 p-2 backdrop-blur-md">
                <img
                  src={logo}
                  alt="McApps Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl font-bold text-white">McApps</h1>
                <p className="text-sm text-white/70">Employee Portal</p>
              </div>
            </div>

            <div className="max-w-[310px]">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md">
                Secure Workspace
              </div>

              <h2 className="mt-4 text-[2rem] font-bold leading-[1.15] text-white xl:text-[2.3rem]">
                Welcome to McApps
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/75">
                Sign in to continue to your internal tools, alerts, news, and lunch services.
              </p>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-medium text-white/70">Quick Access</p>
                <p className="mt-1.5 text-base font-semibold text-white">
                  Internal tools
                </p>
              </div>

              <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-xs font-medium text-white/70">Secure Login</p>
                <p className="mt-1.5 text-base font-semibold text-white">
                  LDAP authenticated
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full items-center justify-center px-4 py-4 sm:px-6 md:px-8 lg:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-6 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#2f66cc_0%,#5f89da_100%)] p-3 shadow-[0_16px_30px_rgba(47,102,204,0.24)] lg:mx-0">
                <img
                  src={logo}
                  alt="McApps Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-[#1f2a44] sm:text-[1.9rem]">
                Sign in
              </h2>
              <p className="mt-1.5 text-sm text-[#6b7996]">
                Use your company credentials.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#33415d]">
                  Username or Email
                </label>
                <div className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-white/55 bg-white/55 px-4 shadow-[0_8px_22px_rgba(35,76,150,0.08)] backdrop-blur-md">
                  <Mail size={17} className="shrink-0 text-[#6f7d99]" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter username or email"
                    className="w-full bg-transparent py-2.5 text-[#1f2a44] outline-none placeholder:text-[#94a0b7]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#33415d]">
                  Password
                </label>
                <div className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-white/55 bg-white/55 px-4 shadow-[0_8px_22px_rgba(35,76,150,0.08)] backdrop-blur-md">
                  <LockKeyhole size={17} className="shrink-0 text-[#6f7d99]" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full bg-transparent py-2.5 text-[#1f2a44] outline-none placeholder:text-[#94a0b7]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#33415d]">
                  Company
                </label>
                <div className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-white/55 bg-white/55 px-4 shadow-[0_8px_22px_rgba(35,76,150,0.08)] backdrop-blur-md">
                  <Building2 size={17} className="shrink-0 text-[#6f7d99]" />
                  <select
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    className="w-full bg-transparent py-2.5 text-[#1f2a44] outline-none"
                  >
                    <option value="McLarens">McLarens</option>
                    <option value="GAC">GAC</option>
                    <option value="M&D">MLL / IOLand</option>
                  </select>
                </div>
              </div>

              {errorText ? (
                <div className="rounded-2xl border border-red-200/80 bg-red-50/85 px-4 py-2.5 text-sm font-medium text-red-600 backdrop-blur-sm">
                  {errorText}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2f66cc_0%,#5f89da_100%)] px-4 py-3 text-base font-semibold text-white shadow-[0_14px_28px_rgba(47,102,204,0.24)] transition hover:translate-y-[-1px] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:hidden">
              <div className="rounded-[18px] border border-white/45 bg-white/35 p-3 text-center backdrop-blur-md">
                <p className="text-xs font-medium text-[#6a7896]">Quick Access</p>
                <p className="mt-1 text-sm font-semibold text-[#1f2a44]">
                  Internal tools
                </p>
              </div>
              <div className="rounded-[18px] border border-white/45 bg-white/35 p-3 text-center backdrop-blur-md">
                <p className="text-xs font-medium text-[#6a7896]">Secure Login</p>
                <p className="mt-1 text-sm font-semibold text-[#1f2a44]">
                  LDAP account
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-[#7e8ba5] lg:text-left">
              Secure company access for employees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}