import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Mail,
  Building2,
  Briefcase,
  Phone,
  User2,
  Save,
  FileText,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import UserAvatar from "../components/common/UserAvatar";
import { getSession } from "../utils/session";
import {
  clearProfileImageCache,
  setProfileImageCache,
  submitEmployeeUpdate,
  uploadProfileImage,
} from "../services/profileService";

type NoticeType = "success" | "error" | null;

type FormState = {
  displayname: string;
  title: string;
  department: string;
  company: string;
  phoneNumber: string;
  user_note: string;
};

type FormErrors = {
  displayname?: string;
  title?: string;
  department?: string;
  company?: string;
  phoneNumber?: string;
  email?: string;
};

const EMPTY_FORM: FormState = {
  displayname: "",
  title: "",
  department: "",
  company: "",
  phoneNumber: "",
  user_note: "",
};

export default function ProfilePage() {
  const user = getSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageVersion, setImageVersion] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [noticeType, setNoticeType] = useState<NoticeType>(null);
  const [noticeText, setNoticeText] = useState("");

  const [imageNoticeType, setImageNoticeType] = useState<NoticeType>(null);
  const [imageNoticeText, setImageNoticeText] = useState("");

  const email = user?.mail || "";
  const username = user?.username || "";

  const originalProfile = useMemo(
    () => ({
      displayname: user?.displayname || "",
      title: user?.title || "",
      department: user?.department || "",
      company: user?.company || "",
      phoneNumber: user?.phoneNumber || "",
    }),
    [user]
  );

  const displayName =
    originalProfile.displayname.trim() ||
    user?.username?.trim() ||
    user?.mail?.trim() ||
    "Employee";

  const canSubmit = useMemo(() => {
    return !!username && !!email;
  }, [username, email]);

  useEffect(() => {
    if (!noticeText) return;

    const timer = window.setTimeout(() => {
      setNoticeType(null);
      setNoticeText("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [noticeText]);

  useEffect(() => {
    if (!imageNoticeText) return;

    const timer = window.setTimeout(() => {
      setImageNoticeType(null);
      setImageNoticeText("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [imageNoticeText]);

  const showNotice = (type: NoticeType, text: string) => {
    setNoticeType(type);
    setNoticeText(text);
  };

  const clearNotice = () => {
    setNoticeType(null);
    setNoticeText("");
  };

  const showImageNotice = (type: NoticeType, text: string) => {
    setImageNoticeType(type);
    setImageNoticeText(text);
  };

  const clearImageNotice = () => {
    setImageNoticeType(null);
    setImageNoticeText("");
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;

    clearImageNotice();

    try {
      setUploadingImage(true);

      const res = await uploadProfileImage(email, file);

      if (!res.success) {
        throw new Error(res.message || "Image upload failed");
      }

      clearProfileImageCache(email);

      if (res.image_url) {
        setProfileImageCache(email, res.image_url);
      }

      setImageVersion((prev) => prev + 1);
      window.dispatchEvent(new Event("mcapps-profile-image-updated"));

      showImageNotice("success", "Profile image uploaded successfully.");
    } catch (error) {
      showImageNotice(
        "error",
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name in errors) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleStartEdit = () => {
    clearNotice();
    setErrors({});
    setIsEditing(true);
    setForm({
      displayname: originalProfile.displayname,
      title: originalProfile.title,
      department: originalProfile.department,
      company: originalProfile.company,
      phoneNumber: originalProfile.phoneNumber,
      user_note: "",
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    clearNotice();
    setErrors({});
    setForm(EMPTY_FORM);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!form.displayname.trim()) {
      newErrors.displayname = "Display Name is required.";
    }

    if (!form.title.trim()) {
      newErrors.title = "Designation is required.";
    }

    if (!form.department.trim()) {
      newErrors.department = "Department is required.";
    }

    if (!form.company.trim()) {
      newErrors.company = "Company is required.";
    }

    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotice();

    if (!canSubmit) {
      showNotice("error", "Missing required user data.");
      return;
    }

    if (!validateForm()) {
      showNotice("error", "Please fill all required fields except Note.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await submitEmployeeUpdate({
        username,
        mail: email,
        department: form.department.trim(),
        company: form.company.trim(),
        title: form.title.trim(),
        displayname: form.displayname.trim(),
        phoneNumber: form.phoneNumber.trim(),
        user_note: form.user_note.trim(),
      });

      if (res.status !== "success") {
        throw new Error(res.message || "Failed to submit update request.");
      }

      showNotice("success", "Data sent to HR for review.");
      setIsEditing(false);
      setErrors({});
      setForm(EMPTY_FORM);
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error
          ? error.message
          : "Failed to submit employee update request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const rightSideValues = isEditing ? form : EMPTY_FORM;

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="glass rounded-[28px] p-5 md:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <UserAvatar
                email={email}
                displayName={displayName}
                size={118}
                imageVersion={imageVersion}
                className="shadow-[0_14px_30px_rgba(47,102,204,0.18)]"
              />

              <button
                type="button"
                onClick={handleImageClick}
                disabled={uploadingImage}
                className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#2f66cc] text-white shadow-lg transition hover:bg-[#2556ad] disabled:opacity-60"
                title="Update image"
              >
                {uploadingImage ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <h1 className="mt-4 text-2xl font-bold text-[#1c2740]">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-[#6d7c99]">
              {originalProfile.title || "Employee"}
            </p>

            {imageNoticeText ? (
              <div
                className={`mt-4 w-full rounded-2xl border px-4 py-3 text-left ${
                  imageNoticeType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {imageNoticeType === "success" ? (
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    )}
                    <p className="text-sm font-medium">{imageNoticeText}</p>
                  </div>

                  <button
                    type="button"
                    onClick={clearImageNotice}
                    className="shrink-0 rounded-full p-1 opacity-70 transition hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid w-full gap-3">
              <InfoCard icon={<Mail size={16} />} label="Email" value={email} />
              <InfoCard
                icon={<Building2 size={16} />}
                label="Company"
                value={originalProfile.company || "-"}
              />
              <InfoCard
                icon={<Briefcase size={16} />}
                label="Department"
                value={originalProfile.department || "-"}
              />
              <InfoCard
                icon={<Phone size={16} />}
                label="Phone"
                value={originalProfile.phoneNumber || "-"}
              />
              <InfoCard
                icon={<User2 size={16} />}
                label="Username"
                value={username || "-"}
              />
            </div>
          </div>
        </section>

        <section className="glass rounded-[28px] p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#2f66cc]">
                <FileText size={14} />
                Employee Update Request
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-[#1c2740] md:text-[2rem]">
                  Profile Details
                </h2>
                <p className="mt-1 text-sm text-[#6d7c99]">
                  Review your information and submit an update request if anything
                  needs to be corrected.
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e4efff]"
              >
                <Pencil size={16} />
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          {noticeText ? (
            <div
              className={`mb-5 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 ${
                noticeType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              <div className="flex items-start gap-2">
                {noticeType === "success" ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                )}
                <p className="text-sm font-medium">{noticeText}</p>
              </div>

              <button
                type="button"
                onClick={clearNotice}
                className="shrink-0 rounded-full p-1 opacity-70 transition hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSubmitUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Display Name"
                name="displayname"
                value={rightSideValues.displayname}
                onChange={handleChange}
                readOnly={!isEditing}
                error={errors.displayname}
                required
              />
              <Field
                label="Designation"
                name="title"
                value={rightSideValues.title}
                onChange={handleChange}
                readOnly={!isEditing}
                error={errors.title}
                required
              />
              <Field
                label="Department"
                name="department"
                value={rightSideValues.department}
                onChange={handleChange}
                readOnly={!isEditing}
                error={errors.department}
                required
              />
              <Field
                label="Company"
                name="company"
                value={rightSideValues.company}
                onChange={handleChange}
                readOnly={!isEditing}
                error={errors.company}
                required
              />
              <Field
                label="Phone Number"
                name="phoneNumber"
                value={rightSideValues.phoneNumber}
                onChange={handleChange}
                readOnly={!isEditing}
                error={errors.phoneNumber}
                required
              />
              <Field
                label="Email"
                name="mail_display"
                value={isEditing ? email : ""}
                onChange={() => {}}
                readOnly
                error={errors.email}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#33415d]">
                Note
              </label>
              <textarea
                name="user_note"
                value={rightSideValues.user_note}
                onChange={handleChange}
                rows={3}
                readOnly={!isEditing}
                placeholder={isEditing ? "Write what needs to be updated..." : ""}
                className={`w-full resize-none rounded-2xl border border-white/60 px-4 py-3 text-[#1f2a44] outline-none ${
                  !isEditing
                    ? "bg-[#f6f8fc] text-[#6d7c99]"
                    : "bg-white/70 placeholder:text-[#97a3bb]"
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!isEditing || submitting || !canSubmit}
                className={`inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_16px_32px_rgba(47,102,204,0.20)] transition ${
                  !isEditing
                    ? "cursor-not-allowed bg-[#d8deea] text-[#8b98b1] shadow-none"
                    : "bg-[linear-gradient(135deg,#2f66cc_0%,#5f89da_100%)] text-white hover:opacity-95"
                }`}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {submitting ? "Submitting..." : "Send Update Request"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/60 px-4 py-3 text-left">
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#6d7c99]">
        <span className="text-[#2f66cc]">{icon}</span>
        {label}
      </div>
      <p className="break-words text-sm font-semibold text-[#1c2740]">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  error,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  readOnly?: boolean;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#33415d]">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`w-full rounded-2xl border px-4 py-3 text-[#1f2a44] outline-none ${
          readOnly
            ? "border-white/60 bg-[#f6f8fc] text-[#6d7c99]"
            : error
            ? "border-red-300 bg-white/70"
            : "border-white/60 bg-white/70 placeholder:text-[#97a3bb]"
        }`}
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      ) : null}
    </div>
  );
}