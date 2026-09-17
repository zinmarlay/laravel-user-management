import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { deleteUser } from "../../services/usersApi";

function UserDeleteDialog({
    open,
    user,
    onClose,
    onDeleted,
    onUnauthenticated,
}) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);

    if (!user) {
        return null;
    }

    async function handleDelete() {
        setDeleting(true);
        setError(null);

        try {
            await deleteUser(user.id);
            await onDeleted();
        } catch (requestError) {
            if (requestError.code === "unauthenticated") {
                onUnauthenticated();
                return;
            }

            setError(requestError);
        } finally {
            setDeleting(false);
        }
    }

    function handleClose() {
        if (!deleting) {
            onClose();
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            disableEscapeKeyDown={deleting}
            aria-labelledby="delete-user-dialog-title"
        >
            <DialogTitle id="delete-user-dialog-title">
                Delete user?
            </DialogTitle>
            <DialogContent dividers>
                {error && (
                    <Alert
                        severity={
                            error.code === "unauthenticated" ? "warning" : "error"
                        }
                        sx={{ mb: 2 }}
                    >
                        {error.message}
                    </Alert>
                )}
                <Typography>
                    Delete <strong>{user.name || "this user"}</strong> (
                    {user.email || "no email"})? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={deleting}>
                    Cancel
                </Button>
                <Button
                    color="error"
                    variant="contained"
                    onClick={handleDelete}
                    disabled={deleting}
                    startIcon={
                        deleting ? <CircularProgress color="inherit" size={16} /> : undefined
                    }
                >
                    {deleting ? "Deleting…" : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserDeleteDialog;
