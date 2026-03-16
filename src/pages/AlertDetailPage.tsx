import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  ThumbsUp,
  BellRing,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import type { AlertComment, AlertItem } from "../types/alerts";
import {
  addAlertComment,
  deleteAlertComment,
  editAlertComment,
  subscribeToAlertById,
  subscribeToAlertComments,
  subscribeToAlertLikes,
  toggleAlertLike,
} from "../services/alertsService";
import { formatAlertDate, formatCommentDate } from "../utils/alertsDate";
import { getAlertUserIdentity } from "../utils/firebaseUser";
import UserAvatar from "../components/common/UserAvatar";

type DeleteModalState = {
  open: boolean;
  commentId: string | null;
};

type EditModalState = {
  open: boolean;
  commentId: string | null;
  text: string;
};

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-[#0f172a]/35 backdrop-blur-[3px]"
      />

      <div className="relative z-[101] w-full max-w-md rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_25px_80px_rgba(35,64,120,0.18)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

export default function AlertDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userId, userName, userEmail } = getAlertUserIdentity();

  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [likeCount, setLikeCount] = useState(0);
  const [iLiked, setILiked] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  const [comments, setComments] = useState<AlertComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    commentId: null,
    text: "",
  });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    open: false,
    commentId: null,
  });

  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsub = subscribeToAlertById(
      id,
      (item) => {
        setAlert(item);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load alert detail:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const unsubLikes = subscribeToAlertLikes(id, userId, ({ likeCount, iLiked }) => {
      setLikeCount(likeCount);
      setILiked(iLiked);
    });

    const unsubComments = subscribeToAlertComments(id, setComments);

    return () => {
      unsubLikes();
      unsubComments();
    };
  }, [id, userId]);

  const handleToggleLike = async () => {
    if (!id || !userId) return;

    try {
      setTogglingLike(true);
      await toggleAlertLike({
        messageId: id,
        userId,
        iLiked,
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setTogglingLike(false);
    }
  };

  const handleSendComment = async () => {
    if (!id || !userId || !commentText.trim()) return;

    try {
      setSendingComment(true);

      await addAlertComment({
        messageId: id,
        userId,
        userName,
        userEmail,
        text: commentText.trim(),
      });

      setCommentText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setSendingComment(false);
    }
  };

  const openEditModal = (commentId: string, currentText: string) => {
    setEditModal({
      open: true,
      commentId,
      text: currentText,
    });
  };

  const closeEditModal = () => {
    if (savingEdit) return;

    setEditModal({
      open: false,
      commentId: null,
      text: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!id || !editModal.commentId || !editModal.text.trim()) return;

    try {
      setSavingEdit(true);

      await editAlertComment({
        messageId: String(id),
        commentId: editModal.commentId,
        text: editModal.text.trim(),
      });

      setEditModal({
        open: false,
        commentId: null,
        text: "",
      });
    } catch (error) {
      console.error("Failed to edit comment:", error);
    } finally {
      setSavingEdit(false);
    }
  };

  const openDeleteModal = (commentId: string) => {
    setDeleteModal({
      open: true,
      commentId,
    });
  };

  const closeDeleteModal = () => {
    if (deletingCommentId) return;

    setDeleteModal({
      open: false,
      commentId: null,
    });
  };

  const handleDeleteComment = async () => {
    if (!id || !deleteModal.commentId) return;

    try {
      setDeletingCommentId(deleteModal.commentId);

      await deleteAlertComment({
        messageId: String(id),
        commentId: deleteModal.commentId,
      });

      setDeleteModal({
        open: false,
        commentId: null,
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#2f66cc]" />
        </div>
      </AppShell>
    );
  }

  if (!alert) {
    return (
      <AppShell>
        <div className="glass rounded-[26px] p-8 text-center">
          <p className="text-lg font-semibold text-[#1c2740]">Alert not found</p>
          <button
            onClick={() => navigate("/alerts")}
            className="mt-4 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc]"
          >
            Back to Alerts
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="glass rounded-[26px] p-5 md:p-6">
          <div className="mx-auto max-w-[940px]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate("/alerts")}
                className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e4efff]"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleLike}
                  disabled={!userId || togglingLike}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    iLiked ? "bg-blue-50 text-blue-600" : "bg-[#edf4ff] text-[#5d6f91]"
                  } ${!userId ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {togglingLike ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ThumbsUp size={16} className={iLiked ? "fill-blue-600" : ""} />
                  )}
                  {likeCount}
                </button>

                <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#5d6f91]">
                  <MessageCircle size={16} />
                  {comments.length}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/60 bg-white/55 p-5 md:p-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#2f66cc]">
                <BellRing size={14} />
                McAlert
              </div>

              <p className="mt-4 text-sm text-[#8ea0bf]">{formatAlertDate(alert.timestamp)}</p>

              <h1 className="mt-2 text-2xl font-bold leading-tight text-[#1c2740] md:text-[2rem]">
                {alert.title}
              </h1>

              <div className="mt-4 rounded-[20px] bg-white/70 p-4 md:p-5">
                <div className="whitespace-pre-line text-[15px] leading-7 text-[#5d6f91]">
                  {alert.message}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass rounded-[26px] p-5 md:p-6">
          <div className="mx-auto max-w-[940px]">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#1c2740]">Comments</h2>
              <p className="text-sm text-[#6d7c99]">Join the discussion</p>
            </div>

            <div className="rounded-[18px] border border-white/60 bg-white/65 p-3">
              <div className="flex items-start gap-3">
                <UserAvatar
                  email={userEmail}
                  displayName={userName}
                  size={34}
                  className="mt-1 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="rounded-[16px] border border-white/60 bg-white px-3 py-2.5">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={userId ? "Write a comment..." : "Sign in to comment"}
                      disabled={!userId || sendingComment}
                      rows={2}
                      className="w-full resize-none bg-transparent text-sm text-[#1c2740] outline-none placeholder:text-[#94a0b7]"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-end">
                    <button
                      onClick={handleSendComment}
                      disabled={!userId || sendingComment || !commentText.trim()}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#2f66cc] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2556ad] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingComment ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {comments.length === 0 ? (
                <div className="rounded-[16px] bg-white/50 p-3 text-sm text-[#6d7c99]">
                  No comments yet.
                </div>
              ) : (
                comments.map((comment) => {
                  const isMine = comment.userId === userId;

                  return (
                    <div
                      key={comment.id}
                      className="rounded-[16px] border border-white/50 bg-white/65 px-3.5 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          email={comment.userEmail}
                          displayName={comment.userName}
                          size={32}
                          className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-[#1c2740]">
                                  {comment.userName || "User"}
                                </p>

                                <p className="text-xs text-[#8ea0bf]">
                                  {formatCommentDate(comment.ts)}
                                </p>

                                {comment.ts_edit ? (
                                  <span className="text-[10px] italic text-[#8ea0bf]">
                                    edited
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {isMine ? (
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  onClick={() => openEditModal(comment.id, comment.text)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ff] text-[#2f66cc] transition hover:bg-[#e4efff]"
                                  title="Edit comment"
                                >
                                  <Pencil size={14} />
                                </button>

                                <button
                                  onClick={() => openDeleteModal(comment.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100"
                                  title="Delete comment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : null}
                          </div>

                          <p className="mt-1.5 text-sm leading-6 text-[#5d6f91]">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>

      <Modal open={editModal.open} onClose={closeEditModal}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea0bf]">
              Edit Comment
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#1c2740]">
              Update your comment
            </h3>
          </div>

          <button
            onClick={closeEditModal}
            disabled={savingEdit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f7ff] text-[#5d6f91] transition hover:bg-[#e9f0ff] disabled:opacity-60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 rounded-[18px] border border-[#dbe7ff] bg-[#f8fbff] p-3">
          <textarea
            value={editModal.text}
            onChange={(e) =>
              setEditModal((prev) => ({
                ...prev,
                text: e.target.value,
              }))
            }
            rows={4}
            disabled={savingEdit}
            className="w-full resize-none rounded-[14px] border border-white/70 bg-white px-3 py-3 text-sm text-[#1c2740] outline-none placeholder:text-[#94a0b7]"
            placeholder="Edit your comment..."
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={closeEditModal}
            disabled={savingEdit}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#f4f7ff] px-4 text-sm font-semibold text-[#5d6f91] transition hover:bg-[#eaf0ff] disabled:opacity-60"
          >
            <X size={15} />
            Cancel
          </button>

          <button
            onClick={handleSaveEdit}
            disabled={savingEdit || !editModal.text.trim()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#2f66cc] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2556ad] disabled:opacity-50"
          >
            {savingEdit ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            Save Changes
          </button>
        </div>
      </Modal>

      <Modal open={deleteModal.open} onClose={closeDeleteModal}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle size={24} />
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea0bf]">
            Delete Comment
          </p>
          <h3 className="mt-1 text-xl font-bold text-[#1c2740]">
            Are you sure?
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6d7c99]">
            This comment will be permanently removed. This action cannot be undone.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={closeDeleteModal}
            disabled={!!deletingCommentId}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#f4f7ff] px-4 text-sm font-semibold text-[#5d6f91] transition hover:bg-[#eaf0ff] disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteComment}
            disabled={!!deletingCommentId}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
          >
            {deletingCommentId ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            Delete
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}