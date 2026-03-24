import type { LucideIcon } from "lucide-react";
import {
  Mail,
  IdCard,
  Users,
  BriefcaseBusiness,
  FileText,
  BookOpen,
  Sailboat,
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
    gradient: "from-[#4f91ff] to-[#1f61c8]",
  },
  {
    id: "hris",
    title: "HRIS",
    subtitle: "Employee records",
    icon: IdCard,
    href: "https://mhl.peopleshr.com/",
    gradient: "from-[#719fff] to-[#2a73da]",
  },
  {
    id: "group-intranet",
    title: "Group Intranet",
    subtitle: "Internal portal access",
    icon: Users,
    href: "https://intranet.mclarens.lk",
    gradient: "from-[#5dafff] to-[#2d7edb]",
  },
  {
    id: "work-hub",
    title: "Work Hub",
    subtitle: "Work platform",
    icon: BriefcaseBusiness,
    href: "https://app.workhub24.com",
    gradient: "from-[#7fa7df] to-[#42679a]",
  },
  {
    id: "stationary-request",
    title: "Stationary Request",
    subtitle: "Office requests",
    icon: FileText,
    href: "https://office.mclarens.lk/",
    gradient: "from-[#7cb6ff] to-[#336fcb]",
  },
  {
    id: "lms",
    title: "LMS",
    subtitle: "Learning management",
    icon: BookOpen,
    href: "https://lms.mclarens.lk/",
    gradient: "from-[#60a9ff] to-[#2a68c8]",
  },
  {
    id: "gac-petty-cash",
    title: "GAC Petty Cash",
    subtitle: "Cash request system",
    icon: Banknote,
    href: "https://pettycash.gac.lk",
    gradient: "from-[#83b5ff] to-[#3c76cf]",
  },
  {
    id: "gac-trip-bonus",
    title: "GAC Trip Bonus",
    subtitle: "Trip bonus portal",
    icon: Sailboat,
    href: "https://tripbonus.gac.lk",
    gradient: "from-[#4b8cff] to-[#275fbf]",
  },
  {
    id: "ops-job-tracker",
    title: "OPS Job Tracker",
    subtitle: "Track operations jobs",
    icon: ClipboardList,
    href: "https://opsjobtracker.gac.lk/",
    gradient: "from-[#7f9bc3] to-[#305d99]",
  },
  {
    id: "it-help-desk",
    title: "IT Help Desk",
    subtitle: "Technical support",
    icon: Headphones,
    href: "https://outlook.cloud.microsoft/mail/deeplink/compose?to=helpdesk@mclarens.lk",
    gradient: "from-[#5d95f0] to-[#244ea8]",
  },
  {
    id: "gac-genie",
    title: "GAC Genie",
    subtitle: "Shared resources",
    icon: Globe2,
    href: "https://gacuae.sharepoint.com/",
    gradient: "from-[#75b5ff] to-[#3474d0]",
  },
  {
    id: "telephone-directory",
    title: "Telephone Directory",
    subtitle: "Company contacts",
    icon: PhoneCall,
    href: "https://intranet.mclarens.lk/telephone-directory/",
    gradient: "from-[#9fb7d7] to-[#4f6f9a]",
  },
  {
    id: "mclarens-petty-cash",
    title: "McLarens Petty Cash",
    subtitle: "Cash claims portal",
    icon: Banknote,
    href: "https://pettycash.mclarens.lk/",
    gradient: "from-[#6ea9ff] to-[#2e69c8]",
  },
  {
    id: "gac-mobile-cost",
    title: "GAC Mobile Cost",
    subtitle: "Mobile expense portal",
    icon: Smartphone,
    href: "https://cea.gac.lk/",
    gradient: "from-[#90b5ef] to-[#496ea5]",
  },
];
