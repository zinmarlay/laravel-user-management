import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { changePassword } from "../../services/authApi";

function getFieldErrors(error) {
    const errors = error?.payload?.errors;
    if (!errors || typeof errors !== "object") {
        return {};
    }

    const fieldMap = {
        current_password: "currentPassword",
        password: "newPassword",
        password_confirmation: "passwordConfirmation",
    };

    return Object.fromEntries(
        Object.entries(fieldMap)
            .filter(([backendField]) => errors[backendField])
            .map(([backendField, field]) => [
                field,
                Array.isArray(errors[backendField])
                    ? errors[backendField].join(" ")
                    : String(errors[backendField]),
            ]),
    );
}

function validateDraft(draft) {
    const errors = {};

    if (!draft.currentPassword) {
        errors.currentPassword = "Current password is required.";
    }

    if (!draft.newPassword) {
        errors.newPassword = "New password is required.";
    } else if (draft.newPassword.length < 8) {
        errors.newPassword = "New password must be at least 8 characters.";
    }

    if (!draft.passwordConfirmation) {
        errors.passwordConfirmation = "Please confirm your new password.";
    } else if (draft.newPassword !== draft.passwordConfirmation) {
        errors.passwordConfirmation = "Passwords do not match.";
    }

    return errors;
}

function getErrorMessage(error) {
    if (error?.code === "network") {
        return "We could not connect to the server. Check your connection and try again.";
    }

    if (error?.code === "forbidden") {
        return "You are not authorized to change your password.";
    }

    if (error?.code === "validation") {
        return error.message;
    }

    if (error?.code === "request-failed" || error?.code === "invalid-response") {
        return error.message || "Password change failed. Please try again.";
    }

    return "Password change failed. Please try again.";
}

function ChangePasswordDialog({
    open,
    onClose,
    onChanged,
    onUnauthenticated,
}) {
    const [draft, setDraft] = useState({
        currentPassword: "",
        newPassword: "",
        passwordConfirmation: "",
    });
    const [visibleFields, setVisibleFields] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [actionError, setActionError] = useState(null);
    const [saving, setSaving] = useState(false);

    function clearDraft() {
        setDraft({
            currentPassword: "",
            newPassword: "",
            passwordConfirmation: "",
        });
        setVisibleFields({});
    }

    function handleClose() {
        if (saving) {
            return;
        }

        clearDraft();
        setFieldErrors({});
        setActionError(null);
        onClose();
    }

    function updateField(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setActionError(null);
    }

    function toggleVisibility(field) {
        setVisibleFields((current) => ({
            ...current,
            [field]: !current[field],
        }));
    }

    function renderVisibilityControl(field, label) {
        const visible = Boolean(visibleFields[field]);

        return (
            <InputAdornment position="end">
                <IconButton
                    type="button"
                    edge="end"
                    onClick={() => toggleVisibility(field)}
                    aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                    disabled={saving}
                    size="small"
                >
                    <span aria-hidden="true">{visible ? "Hide" : "Show"}</span>
                </IconButton>
            </InputAdornment>
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) {
            return;
        }

        const validationErrors = validateDraft(draft);
        setFieldErrors(validationErrors);
        setActionError(null);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        setSaving(true);

        try {
            await changePassword(
                draft.currentPassword,
                draft.newPassword,
                draft.passwordConfirmation,
            );
            clearDraft();
            setFieldErrors({});
            setActionError(null);
            await onChanged();
        } catch (error) {
            clearDraft();

            if (error?.code === "unauthenticated") {
                onUnauthenticated();
                return;
            }

            setFieldErrors(
                error?.code === "validation" ? getFieldErrors(error) : {},
            );
            setActionError({ message: getErrorMessage(error) });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            disableEscapeKeyDown={saving}
            aria-labelledby="change-password-dialog-title"
        >
            <form onSubmit={handleSubmit} noValidate>
                <DialogTitle id="change-password-dialog-title">
                    Change password
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {actionError && (
                            <Alert severity="error" role="alert">
                                {actionError.message}
                            </Alert>
                        )}

                        <TextField
                            autoFocus
                            fullWidth
                            required
                            type={
                                visibleFields.currentPassword
                                    ? "text"
                                    : "password"
                            }
                            label="Current password"
                            name="current_password"
                            autoComplete="current-password"
                            value={draft.currentPassword}
                            onChange={(event) =>
                                updateField("currentPassword", event.target.value)
                            }
                            error={Boolean(fieldErrors.currentPassword)}
                            helperText={fieldErrors.currentPassword || " "}
                            disabled={saving}
                            slotProps={{
                                input: {
                                    endAdornment: renderVisibilityControl(
                                        "currentPassword",
                                        "current password",
                                    ),
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            required
                            type={visibleFields.newPassword ? "text" : "password"}
                            label="New password"
                            name="password"
                            autoComplete="new-password"
                            value={draft.newPassword}
                            onChange={(event) =>
                                updateField("newPassword", event.target.value)
                            }
                            error={Boolean(fieldErrors.newPassword)}
                            helperText={fieldErrors.newPassword || " "}
                            disabled={saving}
                            slotProps={{
                                input: {
                                    endAdornment: renderVisibilityControl(
                                        "newPassword",
                                        "new password",
                                    ),
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            required
                            type={
                                visibleFields.passwordConfirmation
                                    ? "text"
                                    : "password"
                            }
                            label="Confirm new password"
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={draft.passwordConfirmation}
                            onChange={(event) =>
                                updateField(
                                    "passwordConfirmation",
                                    event.target.value,
                                )
                            }
                            error={Boolean(fieldErrors.passwordConfirmation)}
                            helperText={fieldErrors.passwordConfirmation || " "}
                            disabled={saving}
                            slotProps={{
                                input: {
                                    endAdornment: renderVisibilityControl(
                                        "passwordConfirmation",
                                        "password confirmation",
                                    ),
                                },
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button type="button" onClick={handleClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={
                            saving ? <CircularProgress color="inherit" size={18} /> : null
                        }
                    >
                        {saving ? "Changing password…" : "Change Password"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default ChangePasswordDialog;
