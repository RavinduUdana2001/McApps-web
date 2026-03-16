import { api } from "./api";
import type { DirectoryPerson } from "../types";

export async function getPhoneDirectory(params?: {
  company?: string;
  department?: string;
  keyword?: string;
}) {
  const res = await api.get("/get_phone/phone_directory_list", { params });
  return res.data as DirectoryPerson[];
}