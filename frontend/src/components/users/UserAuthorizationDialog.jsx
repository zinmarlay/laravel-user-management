import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

function UserAuthorizationDialog({ open, message, onClose }) {
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
                Permission required
            </DialogTitle>
            <DialogContent dividers>
                <Typography id="user-authorization-dialog-description">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserAuthorizationDialog;
