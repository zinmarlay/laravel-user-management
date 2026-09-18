import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import UserDeleteDialog from "../components/users/UserDeleteDialog";
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
import { useTranslation } from "../i18n/LanguageContext";
import { getLocalizedErrorMessage } from "../i18n/errorMessages";
import "../App.css";

function canPerformAction(action, currentUser, targetUser) {
    if (!currentUser || !targetUser) {
        return false;
    }

    if (currentUser.role === "admin") {
        return true;
    }

    return (
        (action === "edit" || action === "view") &&
        currentUser.role === "user" &&
        currentUser.id !== null &&
        currentUser.id !== undefined &&
        targetUser.id !== null &&
        targetUser.id !== undefined &&
        String(currentUser.id) === String(targetUser.id)
    );
}

function getAuthorizationMessage(action, currentUser, t) {
    if (!currentUser || !["admin", "user"].includes(currentUser.role)) {
        return t("dialogs.permissionUnavailable");
    }

    if (action === "view") {
        return t("dialogs.viewForbidden");
    }

    if (action === "edit") {
        return t("dialogs.editOwnOnly");
    }

    if (action === "delete") {
        return t("dialogs.deleteAdminOnly");
    }

    return t("dialogs.roleAdminOnly");
}

function getRoleLabel(role, t) {
    if (role === "admin") {
        return t("roles.admin");
    }

    if (role === "user") {
        return t("roles.user");
    }

    return t("common.roleUnavailable");
}

function UserListPage({
    currentUser,
    onLogout,
    onUnauthenticated,
    onViewProfile,
    refreshKey = 0,
}) {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState({ search: "", page: 1 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const requestId = useRef(0);
    const [selectedUser, setSelectedUser] = useState(null);
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

    function openProfile(user) {
        onViewProfile(user);
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
                action,
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
    }, [onUnauthenticated, query, refreshKey, retryKey]);

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
    const currentUserName = currentUser?.name?.trim() || t("users.signedInUser");
    const currentUserEmail = currentUser?.email?.trim() || t("users.identityUnavailable");
    const currentUserRole = getRoleLabel(currentUser?.role, t);

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
                            {t("users.title")}
                        </Typography>
                        <Box
                            className="user-list-page__identity"
                            aria-label={
                                currentUser
                                    ? t("users.currentUser")
                                    : t("users.currentUserUnavailable")
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
                    <Box className="user-list-page__header-actions">
                        <LanguageSwitcher />
                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            startIcon={
                                loggingOut ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <LogoutIcon />
                                )
                            }
                        >
                            {loggingOut ? t("users.loggingOut") : t("users.logout")}
                        </Button>
                    </Box>
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
                                    {t("common.retry")}
                                </Button>
                            }
                            severity={
                                error.code === "unauthenticated"
                                    ? "warning"
                                    : "error"
                            }
                        >
                            {getLocalizedErrorMessage(error, t, "errors.loadUsers")}
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
                                onViewProfile={(user) =>
                                    handleActionAttempt("view", user, openProfile)
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
                message={
                    authorizationAlert
                        ? getAuthorizationMessage(
                              authorizationAlert.action,
                              currentUser,
                              t,
                          )
                        : ""
                }
                onClose={closeAuthorizationDialog}
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
