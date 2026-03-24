import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ThumbsUp,
  BellRing,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  WifiOff,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import type { AlertComment, AlertItem } from "../types/alerts";
import {
  addAlertComment,
  deleteAlertComment,
  editAlertComment,
  getAlertByIdSnapshot,
  getCachedAlertById,
  subscribeToAlertById,
  subscribeToAlertComments,
  subscribeToAlertLikes,
  toggleAlertLike,
} from "../services/alertsService";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { formatAlertDate, formatCommentDate } from "../utils/alertsDate";
import { getAlertUserIdentity } from "../utils/firebaseUser";
import { getOfflineAwareMessage, OFFLINE_MESSAGE } from "../utils/network";
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

const ALERT_DETAIL_ERROR_MESSAGE =
  "Unable to load this alert right now. Please try again.";

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
        className="absolute inset-0 bg-[#020916]/72 backdrop-blur-[6px]"
      />

      <div className="glass relative z-[101] w-full max-w-md rounded-[28px] p-5">
        {children}
      </div>
    </div>
  );
}

export default function AlertDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userId, userName, userEmail } = getAlertUserIdentity();
  const isOnline = useNetworkStatus();
  const initialAlert = id ? getCachedAlertById(id) : null;

  const [alert, setAlert] = useState<AlertItem | null>(initialAlert);
  const [loading, setLoading] = useState(!initialAlert);
  const [errorText, setErrorText] = useState("");

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
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setAlert(null);
      setLoading(false);
      return;
    }

    let active = true;
    const cachedItem = getCachedAlertById(id);

    if (cachedItem) {
      setAlert(cachedItem);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const unsub = subscribeToAlertById(
      id,
      (item) => {
        if (!active) return;
        setAlert(item);
        setErrorText("");
        setLoading(false);
      },
      (error) => {
        if (!active) return;
        console.error("Failed to load alert detail:", error);
        setErrorText(
          getOfflineAwareMessage(error, ALERT_DETAIL_ERROR_MESSAGE)
        );
        setLoading(false);
      }
    );

    if (!isOnline) {
      setErrorText(OFFLINE_MESSAGE);

      if (!cachedItem) {
        setLoading(false);
      }
    } else {
      setErrorText("");

      void getAlertByIdSnapshot(id)
        .then((item) => {
          if (!active) return;
          setAlert(item);
          setErrorText("");
          setLoading(false);
        })
        .catch((error) => {
          if (!active) return;
          console.error("Failed to load alert detail:", error);
          setErrorText(
            getOfflineAwareMessage(error, ALERT_DETAIL_ERROR_MESSAGE)
          );
          setLoading(false);
        });
    }

    return () => {
      active = false;
      unsub();
    };
  }, [id, isOnline, reloadKey]);

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
      <AppShell desktopFitScreen>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#8dbaff]" />
        </div>
      </AppShell>
    );
  }

  if (errorText && !alert) {
    return (
      <AppShell desktopFitScreen>
        <div className="app-page-surface rounded-[26px] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(255,184,120,0.12)] text-[#ffd7b0]">
            {errorText === OFFLINE_MESSAGE ? (
              <WifiOff size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>

          <p className="mt-4 text-lg font-semibold text-white">
            {errorText === OFFLINE_MESSAGE
              ? "No internet connection"
              : "Unable to load alert"}
          </p>

          <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[#d2def3]">
            {errorText}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setReloadKey((prev) => prev + 1)}
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              <RefreshCw size={15} />
              Retry
            </button>

            <button
              onClick={() => navigate("/alerts")}
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
            >
              <ArrowLeft size={15} />
              Back to Alerts
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!alert) {
    return (
      <AppShell desktopFitScreen>
        <div className="app-page-surface rounded-[26px] p-8 text-center">
          <p className="text-lg font-semibold text-white">Alert not found</p>
          <button
            onClick={() => navigate("/alerts")}
            className="theme-button-secondary mt-4 rounded-full px-4 py-2 text-sm font-semibold transition"
          >
            Back to Alerts
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell desktopFitScreen>
      <section className="app-page-surface rounded-[28px] p-5 md:p-6 lg:flex lg:h-full lg:flex-col">
        <div className="theme-scrollbar lg:h-full lg:overflow-y-auto lg:pr-1.5">
          <div className="w-full">
            {errorText ? (
              <div className="mb-5 flex flex-col gap-3 rounded-[22px] border border-[rgba(255,173,120,0.2)] bg-[linear-gradient(180deg,rgba(70,34,16,0.48)_0%,rgba(46,21,10,0.42)_100%)] p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,184,120,0.12)] text-[#ffd7b0]">
                    {errorText === OFFLINE_MESSAGE ? (
                      <WifiOff size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {errorText === OFFLINE_MESSAGE
                        ? "No internet connection"
                        : "Live updates are unavailable"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#f3d7bf]">
                      {errorText}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setReloadKey((prev) => prev + 1)}
                  className="theme-button-secondary inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold transition md:self-auto"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : null}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
              <button
                onClick={() => navigate("/alerts")}
                className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleLike}
                  disabled={!userId || togglingLike}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    iLiked
                      ? "border border-[rgba(116,194,255,0.24)] bg-[linear-gradient(135deg,rgba(94,162,255,0.2)_0%,rgba(74,205,255,0.1)_100%)] text-[#eaf7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "theme-button-secondary"
                  } ${!userId ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {togglingLike ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ThumbsUp
                      size={16}
                      className={
                        iLiked
                          ? "fill-current text-[#74c6ff] drop-shadow-[0_0_8px_rgba(116,198,255,0.22)]"
                          : ""
                      }
                    />
                  )}
                  {likeCount}
                </button>

                <div className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold">
                  <MessageCircle size={16} />
                  {comments.length}
                </div>
              </div>
            </div>

            <div className="app-page-card rounded-[24px] p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="theme-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
                  <BellRing size={14} />
                  McAlert
                </div>

                <p className="text-sm text-[#8ea9d3]">
                  {formatAlertDate(alert.timestamp)}
                </p>
              </div>

              <h1 className="theme-page-title mt-4 text-[1.7rem] font-bold leading-tight md:text-[2rem]">
                {alert.title}
              </h1>

              <div className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#d2def3] md:text-[16px]">
                {alert.message}
              </div>
            </div>

            <div className="app-page-card mt-5 rounded-[24px] p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Comments</h2>
                  <p className="theme-muted text-sm">Join the discussion</p>
                </div>

                <span className="theme-subtle-panel rounded-full px-3 py-1 text-xs font-semibold text-[#bdddff]">
                  {comments.length} Comments
                </span>
              </div>

              <div className="app-page-soft-panel rounded-[18px] p-3">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    email={userEmail}
                    displayName={userName}
                    size={34}
                    className="mt-1 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="theme-input rounded-[16px] px-3 py-2.5">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={userId ? "Write a comment..." : "Sign in to comment"}
                        disabled={!userId || sendingComment}
                        rows={2}
                        className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none"
                      />
                    </div>

                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSendComment}
                        disabled={!userId || sendingComment || !commentText.trim()}
                        className="theme-button-primary inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition disabled:opacity-50"
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
                  <div className="theme-empty rounded-[16px] p-3 text-sm">
                    No comments yet.
                  </div>
                ) : (
                  comments.map((comment) => {
                    const isMine = comment.userId === userId;

                    return (
                      <div
                        key={comment.id}
                        className="app-page-soft-panel rounded-[16px] px-3.5 py-3"
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
                                  <p className="text-sm font-semibold text-white">
                                    {comment.userName || "User"}
                                  </p>

                                  <p className="text-xs text-[#8ea9d3]">
                                    {formatCommentDate(comment.ts)}
                                  </p>

                                  {comment.ts_edit ? (
                                    <span className="text-[10px] italic text-[#8ea9d3]">
                                      edited
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {isMine ? (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    onClick={() => openEditModal(comment.id, comment.text)}
                                    className="theme-button-secondary inline-flex h-8 w-8 items-center justify-center rounded-lg transition"
                                    title="Edit comment"
                                  >
                                    <Pencil size={14} />
                                  </button>

                                  <button
                                    onClick={() => openDeleteModal(comment.id)}
                                    className="theme-danger inline-flex h-8 w-8 items-center justify-center rounded-lg transition"
                                    title="Delete comment"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ) : null}
                            </div>

                            <p className="mt-1.5 text-sm leading-6 text-[#d2def3]">
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
          </div>
        </div>
      </section>

      <Modal open={editModal.open} onClose={closeEditModal}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea9d3]">
              Edit Comment
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">
              Update your comment
            </h3>
          </div>

          <button
            onClick={closeEditModal}
            disabled={savingEdit}
            className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="theme-subtle-panel mt-4 rounded-[18px] p-3">
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
            className="theme-input w-full resize-none rounded-[14px] px-3 py-3 text-sm outline-none"
            placeholder="Edit your comment..."
          />
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={closeEditModal}
            disabled={savingEdit}
            className="theme-button-secondary inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-60"
          >
            <X size={15} />
            Cancel
          </button>

          <button
            onClick={handleSaveEdit}
            disabled={savingEdit || !editModal.text.trim()}
            className="theme-button-primary inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50"
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,99,99,0.14)] text-[#ff8e8e]">
          <AlertTriangle size={24} />
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8ea9d3]">
            Delete Comment
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">Are you sure?</h3>
          <p className="theme-muted mt-2 text-sm leading-6">
            This comment will be permanently removed. This action cannot be undone.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={closeDeleteModal}
            disabled={!!deletingCommentId}
            className="theme-button-secondary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteComment}
            disabled={!!deletingCommentId}
            className="theme-button-danger inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-60"
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
