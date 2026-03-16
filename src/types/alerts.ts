export type AlertItem = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
};

export type AlertComment = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
  ts: number;
  ts_edit?: number;
};