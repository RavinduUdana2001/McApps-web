import type { LucideIcon } from "lucide-react";
import {
  Mail,
  IdCard,
  Users,
  BriefcaseBusiness,
  FileText,
  BookOpen,
  Wallet,
  ShipWheel,
  ClipboardList,
  Headphones,
  Globe2,
  PhoneCall,
  Banknote,
  Smartphone,
} from "lucide-react";

export type QuickAccessLink = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
};

export const quickLinks: QuickAccessLink[] = [
  {
    id: "webmail",
    title: "Webmail",
    subtitle: "Open company email",
    icon: Mail,
    href: "https://outlook.cloud.microsoft/mail/",
    gradient: "from-sky-400 to-blue-500",
  },
  {
    id: "hris",
    title: "HRIS",
    subtitle: "Employee records",
    icon: IdCard,
    href: "https://mhl.peopleshr.com/",
    gradient: "from-indigo-400 to-blue-500",
  },
  {
    id: "group-intranet",
    title: "Group Intranet",
    subtitle: "Internal portal access",
    icon: Users,
    href: "https://intranet.mclarens.lk",
    gradient: "from-cyan-400 to-sky-500",
  },
  {
    id: "work-hub",
    title: "Work Hub",
    subtitle: "Work platform",
    icon: BriefcaseBusiness,
    href: "https://app.workhub24.com",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    id: "stationary-request",
    title: "Stationary Request",
    subtitle: "Office requests",
    icon: FileText,
    href: "https://office.mclarens.lk/",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "lms",
    title: "LMS",
    subtitle: "Learning management",
    icon: BookOpen,
    href: "https://lms.mclarens.lk/",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "gac-petty-cash",
    title: "GAC Petty Cash",
    subtitle: "Cash request system",
    icon: Wallet,
    href: "https://pettycash.gac.lk",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    id: "gac-trip-bonus",
    title: "GAC Trip Bonus",
    subtitle: "Trip bonus portal",
    icon: ShipWheel,
    href: "https://tripbonus.gac.lk",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    id: "ops-job-tracker",
    title: "OPS Job Tracker",
    subtitle: "Track operations jobs",
    icon: ClipboardList,
    href: "https://opsjobtracker.gac.lk/",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    id: "it-help-desk",
    title: "IT Help Desk",
    subtitle: "Technical support",
    icon: Headphones,
    href: "https://helpdesk.mclarens.lk/",
    gradient: "from-fuchsia-400 to-purple-500",
  },
  {
    id: "gac-genie",
    title: "GAC Genie",
    subtitle: "Shared resources",
    icon: Globe2,
    href: "https://gacuae.sharepoint.com/",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    id: "telephone-directory",
    title: "Telephone Directory",
    subtitle: "Company contacts",
    icon: PhoneCall,
    href: "https://intranet.mclarens.lk/telephone-directory/",
    gradient: "from-slate-400 to-slate-600",
  },
  {
    id: "mclarens-petty-cash",
    title: "McLarens Petty Cash",
    subtitle: "Cash claims portal",
    icon: Banknote,
    href: "https://pettycash.mclarens.lk/",
    gradient: "from-lime-400 to-green-500",
  },
  {
    id: "gac-mobile-cost",
    title: "GAC Mobile Cost",
    subtitle: "Mobile expense portal",
    icon: Smartphone,
    href: "https://cea.gac.lk/",
    gradient: "from-orange-400 to-red-500",
  },
];