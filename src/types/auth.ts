export type CompanyOption = "McLarens" | "GAC" | "M&D";

export type AuthUser = {
  userId: string;
  username: string;
  mail: string;
  department: string;
  company: string;
  title: string;
  displayname: string;
  location: string;
  phoneNumber: string;
};

export type LoginPayload = {
  username: string;
  password: string;
  company_name: CompanyOption;
};

export type LoginErrorResponse = {
  error: string;
};