import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import RegisterForm from "../components/auth/RegisterForm";
import "../App.css";

function RegisterPage({ onAuthenticated, onLogin }) {
    return (
        <main className="login-page register-page">
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
                        Create account
                    </Typography>
                    <Typography className="login-page__description">
                        Register a secure account to manage your users and access.
                    </Typography>
                    <RegisterForm onAuthenticated={onAuthenticated} />
                    <Typography className="login-page__switch" component="p">
                        Already have an account?{" "}
                        <Button
                            type="button"
                            className="login-page__switch-button"
                            onClick={onLogin}
                        >
                            Sign in
                        </Button>
                    </Typography>
                </Paper>
                <Typography className="login-page__footer" component="p">
                    Secure access to your user management workspace
                </Typography>
            </Box>
        </main>
    );
}

export default RegisterPage;
