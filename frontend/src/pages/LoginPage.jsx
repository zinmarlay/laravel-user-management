import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LoginForm from "../components/auth/LoginForm";
import "../App.css";

function LoginPage({ onAuthenticated }) {
    return (
        <main className="login-page">
            <Box className="login-page__content">
                <Paper className="login-page__card" elevation={0}>
                    <Box className="login-page__brand-mark" aria-hidden="true">
                        UM
                    </Box>
                    <Typography className="login-page__brand" component="p">
                        User Management
                    </Typography>
                    <Typography
                        className="login-page__title"
                        component="h1"
                        variant="h3"
                    >
                        Sign in
                    </Typography>
                    <Typography className="login-page__description">
                        Sign in to securely manage your users and account access.
                    </Typography>
                    <LoginForm onAuthenticated={onAuthenticated} />
                </Paper>
                <Typography className="login-page__footer" component="p">
                    Secure access to your user management workspace
                </Typography>
            </Box>
        </main>
    );
}

export default LoginPage;
