import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import UserDeleteDialog from "../components/users/UserDeleteDialog";
import UserEditDialog from "../components/users/UserEditDialog";
import UserAuthorizationDialog from "../components/users/UserAuthorizationDialog";
import UserListPagination from "../components/users/UserListPagination";
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from "../components/users/UserListStatus";
import UserSearchForm from "../components/users/UserSearchForm";
import UserRoleDialog from "../components/users/UserRoleDialog";
import UserTable from "../components/users/UserTable";
import { logoutUser } from "../services/authApi";
import { fetchUsers } from "../services/usersApi";
import "../App.css";

function canPerformAction(action, currentUser, targetUser) {
    if (!currentUser || !targetUser) {
        return false;
    }

    if (currentUser.role === "admin") {
        return true;
    }

    return (
        action === "edit" &&
        currentUser.role === "user" &&
        currentUser.id !== null &&
        currentUser.id !== undefined &&
        targetUser.id !== null &&
        targetUser.id !== undefined &&
        String(currentUser.id) === String(targetUser.id)
    );
}

function getAuthorizationMessage(action, currentUser) {
    if (!currentUser || !["admin", "user"].includes(currentUser.role)) {
        return "User permissions are unavailable. Please sign in again.";
    }

    if (action === "edit") {
        return "You can edit your own profile, but only administrators can edit another user.";
    }

    if (action === "delete") {
        return "Only administrators can delete users.";
    }

    return "Only administrators can change user roles.";
}

function getRoleLabel(role) {
    if (role === "admin") {
        return "Admin";
    }

    if (role === "user") {
        return "User";
    }

    return "Role unavailable";
}

function UserListPage({ currentUser, onLogout, onUnauthenticated }) {
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState({ search: "", page: 1 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const requestId = useRef(0);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [roleOpen, setRoleOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [authorizationAlert, setAuthorizationAlert] = useState(null);
    const authorizationTrigger = useRef(null);

    const retry = useCallback(() => {
        setLoading(true);
        setError(null);
        setRetryKey((current) => current + 1);
    }, []);

    function openEdit(user) {
        setSelectedUser(user);
        setEditOpen(true);
    }

    function openDelete(user) {
        setSelectedUser(user);
        setDeleteOpen(true);
    }

    function openRoleChange(user) {
        setSelectedUser(user);
        setRoleOpen(true);
    }

    function handleActionAttempt(action, user, openAction) {
        if (!canPerformAction(action, currentUser, user)) {
            authorizationTrigger.current = document.activeElement;
            setAuthorizationAlert({
                message: getAuthorizationMessage(action, currentUser),
            });
            return;
        }

        openAction(user);
    }

    function closeAuthorizationDialog() {
        const trigger = authorizationTrigger.current;
        authorizationTrigger.current = null;
        setAuthorizationAlert(null);

        if (trigger && typeof trigger.focus === "function") {
            window.requestAnimationFrame(() => trigger.focus());
        }
    }

    function closeEdit() {
        setEditOpen(false);
        setSelectedUser(null);
    }

    function closeDelete() {
        setDeleteOpen(false);
        setSelectedUser(null);
    }

    function closeRoleChange() {
        setRoleOpen(false);
        setSelectedUser(null);
    }

    function refreshList() {
        setLoading(true);
        setError(null);
        setRetryKey((current) => current + 1);
    }

    async function handleLogout() {
        if (loggingOut) {
            return;
        }

        setLoggingOut(true);

        try {
            await logoutUser();
        } catch {
            // Local sign-out still completes when the server cannot confirm logout.
        } finally {
            onLogout();
        }
    }

    function handleDeleteSuccess() {
        const shouldMoveToPreviousPage =
            query.page > 1 && result?.rows?.length === 1;

        closeDelete();

        if (shouldMoveToPreviousPage) {
            setLoading(true);
            setError(null);
            setQuery((currentQuery) => ({
                ...currentQuery,
                page: Math.max(1, currentQuery.page - 1),
            }));
            return;
        }

        refreshList();
    }

    useEffect(() => {
        const controller = new AbortController();
        const currentRequestId = requestId.current + 1;
        requestId.current = currentRequestId;

        fetchUsers({
            search: query.search,
            page: query.page,
            signal: controller.signal,
        })
            .then((nextResult) => {
                if (requestId.current !== currentRequestId) {
                    return;
                }

                setResult(nextResult);
            })
            .catch((requestError) => {
                if (
                    controller.signal.aborted ||
                    requestId.current !== currentRequestId
                ) {
                    return;
                }

                if (requestError.code === "unauthenticated") {
                    onUnauthenticated();
                    return;
                }
                setError(requestError);
            })
            .finally(() => {
                if (requestId.current === currentRequestId) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [onUnauthenticated, query, retryKey]);

    function handleSearchSubmit(event) {
        event.preventDefault();
        const nextSearch = searchInput.trim();

        setLoading(true);
        setError(null);
        setQuery(() => ({
            search: nextSearch,
            page: 1,
        }));
        setRetryKey((current) => current + 1);
    }

    function handlePageChange(_event, nextPage) {
        setLoading(true);
        setError(null);
        setQuery((currentQuery) => ({
            ...currentQuery,
            page: nextPage,
        }));
    }

    const hasRows = Boolean(result?.rows?.length);
    const showInitialLoading = loading && !result;
    const showTable = result && hasRows;
    const showInlineError = Boolean(error && result);
    const currentUserName = currentUser?.name?.trim() || "Signed-in user";
    const currentUserEmail = currentUser?.email?.trim() || "Identity unavailable";
    const currentUserRole = getRoleLabel(currentUser?.role);

    return (
        <main className="user-list-page">
            <Box className="user-list-page__content">
                <Box className="user-list-page__header">
                    <Box className="user-list-page__header-heading">
                        <Typography
                            className="user-list-page__title"
                            component="h1"
                            variant="h3"
                        >
                            Users
                        </Typography>
                        <Box
                            className="user-list-page__identity"
                            aria-label={
                                currentUser
                                    ? "Current user"
                                    : "Current user unavailable"
                            }
                        >
                            <Typography
                                className="user-list-page__identity-name"
                                title={currentUser?.name || undefined}
                            >
                                {currentUserName}
                            </Typography>
                            <Typography
                                className="user-list-page__identity-email"
                                title={currentUser?.email || undefined}
                            >
                                {currentUserEmail}
                            </Typography>
                            <Chip
                                className="user-list-page__identity-role"
                                label={currentUserRole}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        startIcon={
                            loggingOut ? <CircularProgress size={16} /> : undefined
                        }
                    >
                        {loggingOut ? "Logging out…" : "Logout"}
                    </Button>
                </Box>

                <Paper className="user-list-page__surface" elevation={0}>
                    <UserSearchForm
                        value={searchInput}
                        onChange={setSearchInput}
                        onSubmit={handleSearchSubmit}
                        disabled={loading}
                    />

                    {showInlineError && (
                        <Alert
                            className="user-list-page__feedback"
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={retry}
                                >
                                    Retry
                                </Button>
                            }
                            severity={
                                error.code === "unauthenticated"
                                    ? "warning"
                                    : "error"
                            }
                        >
                            {error.message}
                        </Alert>
                    )}

                    {showInitialLoading && <LoadingState />}

                    {!loading && !result && error && (
                        <ErrorState error={error} onRetry={retry} />
                    )}

                    {!loading && result && !error && !hasRows && (
                        <EmptyState searched={Boolean(query.search)} />
                    )}

                    {showTable && (
                        <Box className="user-list-page__table-wrap">
                            <UserTable
                                users={result.rows}
                                onEdit={(user) =>
                                    handleActionAttempt("edit", user, openEdit)
                                }
                                onDelete={(user) =>
                                    handleActionAttempt("delete", user, openDelete)
                                }
                                onChangeRole={(user) =>
                                    handleActionAttempt(
                                        "role",
                                        user,
                                        openRoleChange,
                                    )
                                }
                                actionsDisabled={Boolean(selectedUser)}
                            />
                            {loading && <LoadingState overlay />}
                        </Box>
                    )}

                    {result && !error && hasRows && (
                        <UserListPagination
                            page={result.currentPage}
                            count={result.lastPage}
                            onChange={handlePageChange}
                            disabled={loading}
                        />
                    )}
                </Paper>
            </Box>
            <UserAuthorizationDialog
                open={Boolean(authorizationAlert)}
                message={authorizationAlert?.message || ""}
                onClose={closeAuthorizationDialog}
            />
            <UserEditDialog
                open={editOpen}
                user={selectedUser}
                onClose={closeEdit}
                onUnauthenticated={onUnauthenticated}
                onSaved={async () => {
                    closeEdit();
                    refreshList();
                }}
            />
            <UserDeleteDialog
                open={deleteOpen}
                user={selectedUser}
                onClose={closeDelete}
                onUnauthenticated={onUnauthenticated}
                onDeleted={handleDeleteSuccess}
            />
            <UserRoleDialog
                open={roleOpen}
                user={selectedUser}
                onClose={closeRoleChange}
                onUnauthenticated={onUnauthenticated}
                onChanged={async () => {
                    closeRoleChange();
                    refreshList();
                }}
            />
        </main>
    );
}

export default UserListPage;
