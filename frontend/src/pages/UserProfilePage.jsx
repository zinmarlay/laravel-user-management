import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ChangePasswordDialog from "../components/users/ChangePasswordDialog";
import UserAvatar from "../components/users/UserAvatar";
import UserEditDialog from "../components/users/UserEditDialog";
import { fetchUser } from "../services/usersApi";
import "../App.css";

function canViewProfile(currentUser, userId) {
    if (!currentUser || userId === null || userId === undefined) {
        return false;
    }

    if (currentUser.role === "admin") {
        return true;
    }

    return (
        currentUser.role === "user" &&
        currentUser.id !== null &&
        currentUser.id !== undefined &&
        String(currentUser.id) === String(userId)
    );
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

function getSafeError(error) {
    if (error?.code === "forbidden") {
        return "You are not authorized to view this profile.";
    }

    if (error?.code === "not-found") {
        return "This user could not be found.";
    }

    if (error?.code === "network") {
        return "We could not connect to the server. Check your connection and try again.";
    }

    if (error?.code === "invalid-response") {
        return "The profile response was not valid. Please try again.";
    }

    return "We could not load this profile. Please try again.";
}

function UserProfilePage({
    userId,
    currentUser,
    onBack,
    onCurrentUserUpdated,
    onUnauthenticated,
}) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);
    const [editOpen, setEditOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        if (!canViewProfile(currentUser, userId)) {
            // Intentional synchronization when profile authorization changes.
            // oxlint-disable-next-line react/set-state-in-effect
            setProfile(null);
            setLoading(false);
            setError({
                code: "forbidden",
                message: "You are not authorized to view this profile.",
            });

            return () => controller.abort();
        }

        setLoading(true);
        setError(null);
        setSuccessMessage("");

        fetchUser(userId, undefined, controller.signal)
            .then((nextProfile) => {
                setProfile(nextProfile);
            })
            .catch((requestError) => {
                if (controller.signal.aborted) {
                    return;
                }

                if (requestError.code === "unauthenticated") {
                    onUnauthenticated();
                    return;
                }

                setError(requestError);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [currentUser, onUnauthenticated, retryKey, userId]);

    function handleRetry() {
        setLoading(true);
        setError(null);
        setRetryKey((current) => current + 1);
    }

    function handleSaved(updatedProfile) {
        setProfile(updatedProfile);
        setEditOpen(false);
        setSuccessMessage("Profile updated.");
        onCurrentUserUpdated(updatedProfile);
    }

    function handlePasswordChanged() {
        setChangePasswordOpen(false);
        onUnauthenticated("Password changed successfully. Please sign in again.");
    }

    const canEdit = profile && canViewProfile(currentUser, profile.id);
    const canChangePassword =
        profile &&
        currentUser?.id !== null &&
        currentUser?.id !== undefined &&
        String(currentUser.id) === String(profile.id);
    const displayAddress = profile?.address?.trim() || "—";
    const displayName = profile?.name?.trim() || "User";
    const displayEmail = profile?.email?.trim() || "Email unavailable";

    return (
        <main className="user-profile-page">
            <Box className="user-profile-page__content">
                <Box className="user-profile-page__header">
                    <Button
                        onClick={onBack}
                        aria-label="Back to users"
                    >
                        ← Back to Users
                    </Button>
                    <Typography
                        className="user-profile-page__title"
                        component="h1"
                        variant="h3"
                    >
                        Profile
                    </Typography>
                </Box>

                {loading && (
                    <Paper
                        className="user-profile-page__state"
                        elevation={0}
                        role="status"
                        aria-live="polite"
                    >
                        <CircularProgress />
                        <Typography>Loading profile…</Typography>
                    </Paper>
                )}

                {!loading && error && (
                    <Paper className="user-profile-page__state" elevation={0}>
                        <Alert severity={error.code === "forbidden" ? "warning" : "error"}>
                            {error.code === "forbidden"
                                ? error.message
                                : getSafeError(error)}
                        </Alert>
                        {error.code !== "forbidden" && (
                            <Button variant="outlined" onClick={handleRetry}>
                                Retry
                            </Button>
                        )}
                        <Button onClick={onBack}>Back to Users</Button>
                    </Paper>
                )}

                {!loading && !error && profile && (
                    <Paper className="user-profile-page__card" elevation={0}>
                        <Box className="user-profile-page__identity">
                            <UserAvatar
                                name={displayName}
                                photo={profile.photo}
                                className="user-profile-page__avatar"
                            />
                            <Box className="user-profile-page__identity-copy">
                                <Typography component="h2" variant="h4">
                                    {displayName}
                                </Typography>
                                <Typography color="text.secondary">
                                    {displayEmail}
                                </Typography>
                                <Typography
                                    className="user-profile-page__role"
                                    component="span"
                                >
                                    {getRoleLabel(profile.role)}
                                </Typography>
                            </Box>
                        </Box>

                        {successMessage && (
                            <Alert
                                severity="success"
                                role="status"
                                onClose={() => setSuccessMessage("")}
                            >
                                {successMessage}
                            </Alert>
                        )}

                        <Box className="user-profile-page__details">
                            <Box>
                                <Typography
                                    className="user-profile-page__detail-label"
                                    component="h3"
                                >
                                    Name
                                </Typography>
                                <Typography>{displayName}</Typography>
                            </Box>
                            <Box>
                                <Typography
                                    className="user-profile-page__detail-label"
                                    component="h3"
                                >
                                    Email
                                </Typography>
                                <Typography>{displayEmail}</Typography>
                            </Box>
                            <Box>
                                <Typography
                                    className="user-profile-page__detail-label"
                                    component="h3"
                                >
                                    Address
                                </Typography>
                                <Typography>{displayAddress}</Typography>
                            </Box>
                            <Box>
                                <Typography
                                    className="user-profile-page__detail-label"
                                    component="h3"
                                >
                                    Role
                                </Typography>
                                <Typography>{getRoleLabel(profile.role)}</Typography>
                            </Box>
                        </Box>

                        <Box className="user-profile-page__actions">
                            {canChangePassword && (
                                <Button
                                    variant="outlined"
                                    onClick={() => setChangePasswordOpen(true)}
                                >
                                    Change Password
                                </Button>
                            )}
                            {canEdit && (
                                <Button
                                    variant="contained"
                                    onClick={() => setEditOpen(true)}
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </Box>
                    </Paper>
                )}
            </Box>

            <UserEditDialog
                open={editOpen}
                user={profile}
                onClose={() => setEditOpen(false)}
                onUnauthenticated={onUnauthenticated}
                onSaved={handleSaved}
            />
            <ChangePasswordDialog
                open={changePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
                onChanged={handlePasswordChanged}
                onUnauthenticated={onUnauthenticated}
            />
        </main>
    );
}

export default UserProfilePage;
