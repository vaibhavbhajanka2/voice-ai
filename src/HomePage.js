import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const HomePage = ({ user }) => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Redirect or update UI after logout if needed
        } catch (error) {
            console.error("Error logging out: ", error);
        }
    };

    return (
        <Box>
            <Typography variant="h4">Welcome to Voice AI, {user?.displayName || "User"}</Typography>
            <Typography variant="body1">Email: {user?.email}</Typography>
            <Button variant="contained" color="primary" onClick={handleLogout}>
                Logout
            </Button>
        </Box>
    );
};

export default HomePage;
