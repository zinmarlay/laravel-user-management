import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useTranslation } from "../../i18n/LanguageContext";

function UserAuthorizationDialog({ open, message, onClose }) {
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            aria-labelledby="user-authorization-dialog-title"
            aria-describedby="user-authorization-dialog-description"
        >
            <DialogTitle id="user-authorization-dialog-title">
                {t("dialogs.permissionRequired")}
            </DialogTitle>
            <DialogContent dividers>
                <Typography id="user-authorization-dialog-description">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    {t("common.close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserAuthorizationDialog;
