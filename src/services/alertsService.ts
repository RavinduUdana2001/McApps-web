import {
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { db } from "./firebase";
import type { AlertComment, AlertItem } from "../types/alerts";

export function subscribeToAlerts(
  callback: (items: AlertItem[]) => void,
  onError?: (error: unknown) => void
) {
  const messagesRef = ref(db, "messages");

  return onValue(
    messagesRef,
    (snapshot) => {
      const raw = snapshot.val();

      if (!raw || typeof raw !== "object") {
        callback([]);
        return;
      }

      const items: AlertItem[] = Object.entries(raw).map(([key, value]) => {
        const item = value as Record<string, unknown>;

        return {
          id: String(key),
          title: String(item.title ?? ""),
          message: String(item.message ?? ""),
          timestamp: Number(item.timestamp ?? 0),
        };
      });

      items.sort((a, b) => b.timestamp - a.timestamp);
      callback(items);
    },
    onError
  );
}

export function subscribeToAlertById(
  alertId: string,
  callback: (item: AlertItem | null) => void,
  onError?: (error: unknown) => void
) {
  const alertRef = ref(db, `messages/${alertId}`);

  return onValue(
    alertRef,
    (snapshot) => {
      const raw = snapshot.val();

      if (!raw || typeof raw !== "object") {
        callback(null);
        return;
      }

      const item = raw as Record<string, unknown>;

      callback({
        id: alertId,
        title: String(item.title ?? ""),
        message: String(item.message ?? ""),
        timestamp: Number(item.timestamp ?? 0),
      });
    },
    onError
  );
}

export function subscribeToAlertLikes(
  messageId: string,
  userId: string,
  callback: (payload: { likeCount: number; iLiked: boolean }) => void
) {
  const likesRef = ref(db, `message_likes/${messageId}`);

  return onValue(likesRef, (snapshot) => {
    const raw = snapshot.val();
    const likesMap =
      raw && typeof raw === "object" ? (raw as Record<string, boolean>) : {};

    const likeCount = Object.values(likesMap).filter(Boolean).length;
    const iLiked = !!userId && likesMap[userId] === true;

    callback({ likeCount, iLiked });
  });
}

export async function toggleAlertLike(params: {
  messageId: string;
  userId: string;
  iLiked: boolean;
}) {
  const myLikeRef = ref(db, `message_likes/${params.messageId}/${params.userId}`);

  if (params.iLiked) {
    await remove(myLikeRef);
  } else {
    await set(myLikeRef, true);
  }
}

export function subscribeToAlertComments(
  messageId: string,
  callback: (comments: AlertComment[]) => void
) {
  const commentsRef = ref(db, `message_comments/${messageId}`);

  return onValue(commentsRef, (snapshot) => {
    const raw = snapshot.val();

    if (!raw || typeof raw !== "object") {
      callback([]);
      return;
    }

    const comments: AlertComment[] = Object.entries(raw).map(([key, value]) => {
      const comment = value as Record<string, unknown>;

      return {
        id: String(key),
        userId: String(comment.userId ?? ""),
        userName: String(comment.userName ?? "User"),
        userEmail: String(comment.userEmail ?? ""),
        text: String(comment.text ?? ""),
        ts: Number(comment.ts ?? 0),
        ts_edit: comment.ts_edit ? Number(comment.ts_edit) : undefined,
      };
    });

    comments.sort((a, b) => a.ts - b.ts);
    callback(comments);
  });
}

export async function addAlertComment(params: {
  messageId: string;
  userId: string;
  userName: string;
  userEmail: string;
  text: string;
}) {
  const commentsRef = ref(db, `message_comments/${params.messageId}`);
  const newRef = push(commentsRef);

  await set(newRef, {
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    text: params.text,
    ts: Date.now(),
  });
}

export async function editAlertComment(params: {
  messageId: string;
  commentId: string;
  text: string;
}) {
  const commentRef = ref(
    db,
    `message_comments/${params.messageId}/${params.commentId}`
  );

  await update(commentRef, {
    text: params.text,
    ts_edit: Date.now(),
  });
}

export async function deleteAlertComment(params: {
  messageId: string;
  commentId: string;
}) {
  const commentRef = ref(
    db,
    `message_comments/${params.messageId}/${params.commentId}`
  );

  await remove(commentRef);
}