import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { updateUserRole } from "../../services/usersApi";
import { useTranslation } from "../../i18n/LanguageContext";
import { getLocalizedErrorMessage } from "../../i18n/errorMessages";

const roles = ["user", "admin"];

function getInitialRole(user) {
    return roles.includes(user?.role) ? user.role : "user";
}

function UserRoleDialog({
    open,
    user,
    onClose,
    onChanged,
    onUnauthenticated,
}) {
    const { t } = useTranslation();
    const [role, setRole] = useState(() => getInitialRole(user));
    const [changingRole, setChangingRole] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            return;
        }

        // Intentional synchronization when the selected user changes.
        // oxlint-disable-next-line react/set-state-in-effect
        setRole(getInitialRole(user));
        setError(null);
        setChangingRole(false);
    }, [user]);

    if (!user) {
        return null;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!roles.includes(role) || role === user.role) {
            return;
        }

        setChangingRole(true);
        setError(null);

        try {
            await updateUserRole(user.id, role);
            await onChanged();
        } catch (requestError) {
            if (requestError.code === "unauthenticated") {
                onUnauthenticated();
                return;
            }

            setError(requestError);
        } finally {
            setChangingRole(false);
        }
    }

    function handleClose() {
        if (!changingRole) {
            onClose();
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            disableEscapeKeyDown={changingRole}
            aria-labelledby="change-role-dialog-title"
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle id="change-role-dialog-title">
                    {t("dialogs.changeRoleTitle")}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {error && (
                            <Alert
                                severity={
                                    error.code === "unauthenticated"
                                        ? "warning"
                                        : "error"
                                }
                            >
                                {getLocalizedErrorMessage(error, t, "errors.role")}
                            </Alert>
                        )}
                        <Typography>
                            {t("dialogs.selectRole", {
                                name: user.name || t("common.user"),
                                role:
                                    user.role === "admin"
                                        ? t("roles.admin")
                                        : user.role === "user"
                                            ? t("roles.user")
                                            : t("common.unknown"),
                            })}
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel id="new-user-role-label">
                                {t("dialogs.newRole")}
                            </InputLabel>
                            <Select
                                labelId="new-user-role-label"
                                value={role}
                                label={t("dialogs.newRole")}
                                onChange={(event) => {
                                    setRole(event.target.value);
                                    setError(null);
                                }}
                                disabled={changingRole}
                            >
                                <MenuItem value="user">{t("roles.user")}</MenuItem>
                                <MenuItem value="admin">{t("roles.admin")}</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={changingRole}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={changingRole || role === user.role}
                        startIcon={
                            changingRole ? <CircularProgress size={16} /> : undefined
                        }
                    >
                        {changingRole
                            ? t("dialogs.saving")
                            : t("dialogs.saveRole")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default UserRoleDialog;
