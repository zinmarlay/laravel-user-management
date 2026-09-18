import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { updateUser } from "../../services/usersApi";

function getInitialDraft(user) {
    return {
        name: user?.name || "",
        email: user?.email || "",
        address: user?.address || "",
    };
}

function getFieldErrors(error) {
    const errors = error?.payload?.errors;
    if (!errors || typeof errors !== "object") {
        return {};
    }

    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages.join(" ") : String(messages),
        ]),
    );
}

function validateDraft(draft) {
    const errors = {};
    const name = draft.name.trim();
    const email = draft.email.trim();

    if (!name) {
        errors.name = "Name is required.";
    } else if (name.length > 255) {
        errors.name = "Name must be 255 characters or fewer.";
    }

    if (!email) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }

    return errors;
}

function UserEditDialog({
    open,
    user,
    onClose,
    onSaved,
    onUnauthenticated,
}) {
    const [draft, setDraft] = useState(() => getInitialDraft(user));
    const [fieldErrors, setFieldErrors] = useState({});
    const [actionError, setActionError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            return;
        }

        // Intentional synchronization when the selected user changes.
        // oxlint-disable-next-line react/set-state-in-effect
        setDraft(getInitialDraft(user));
        setFieldErrors({});
        setActionError(null);
        setSaving(false);
    }, [user]);

    if (!user) {
        return null;
    }

    function updateField(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => ({ ...current, [field]: undefined }));
        setActionError(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const validationErrors = validateDraft(draft);

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setActionError({
                message: "Please correct the highlighted fields.",
            });
            return;
        }

        const payload = {
            name: draft.name.trim(),
            email: draft.email.trim(),
            address: draft.address.trim() || null,
        };

        setSaving(true);
        setFieldErrors({});
        setActionError(null);

        try {
            await updateUser(user.id, payload);
            await onSaved();
        } catch (error) {
            if (error.code === "unauthenticated") {
                onUnauthenticated();
                return;
            }

            setFieldErrors(getFieldErrors(error));
            setActionError(error);
        } finally {
            setSaving(false);
        }
    }

    function handleClose() {
        if (!saving) {
            onClose();
        }
    }

    const errorMessage = actionError?.message;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            disableEscapeKeyDown={saving}
            aria-labelledby="edit-user-dialog-title"
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle id="edit-user-dialog-title">Edit user</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {errorMessage && (
                            <Alert
                                severity={
                                    actionError?.code === "unauthenticated"
                                        ? "warning"
                                        : "error"
                                }
                            >
                                {errorMessage}
                            </Alert>
                        )}
                        <TextField
                            autoFocus
                            fullWidth
                            required
                            label="Name"
                            value={draft.name}
                            onChange={(event) =>
                                updateField("name", event.target.value)
                            }
                            error={Boolean(fieldErrors.name)}
                            helperText={fieldErrors.name || " "}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            required
                            type="email"
                            label="Email"
                            value={draft.email}
                            onChange={(event) =>
                                updateField("email", event.target.value)
                            }
                            error={Boolean(fieldErrors.email)}
                            helperText={fieldErrors.email || " "}
                            disabled={saving}
                        />
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Address"
                            value={draft.address}
                            onChange={(event) =>
                                updateField("address", event.target.value)
                            }
                            error={Boolean(fieldErrors.address)}
                            helperText={fieldErrors.address || " "}
                            disabled={saving}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={
                            saving ? <CircularProgress size={16} /> : undefined
                        }
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserEditDialog;
