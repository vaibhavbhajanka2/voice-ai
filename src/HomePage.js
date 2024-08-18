import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { io } from "socket.io-client";

const HomePage = ({ user }) => {
    const [socket, setSocket] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [chunks, setChunks] = useState([]);
    const [conversation, setConversation] = useState([]);

    useEffect(() => {
        const newSocket = io('http://localhost:5002');
        setSocket(newSocket);

        // Listen for the greeting audio event
        newSocket.on('greeting', (audioBuffer) => {
            const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
        });

        // Listen for the transcription event
        newSocket.on('transcription', (text) => {
            setConversation(prev => [...prev, { transcription: text, gptResponse: "" }]);
        });

        newSocket.on('gpt', (audioBuffer) => {
            const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
        });

        newSocket.on('gptResponse', (response) => {
            setConversation(prev => {
                const lastEntry = prev[prev.length - 1];
                lastEntry.gptResponse = response;
                return [...prev.slice(0, -1), lastEntry];
            });
        });

        newSocket.on('error', (errorMessage) => {
            console.error('Error:', errorMessage);
        });

        // Emit the user's name to request a greeting when the socket connects
        if (newSocket && user?.displayName) {
            newSocket.emit('requestGreeting', user.displayName);
        }

        return () => newSocket.disconnect();
    }, [user?.displayName]);

    useEffect(() => {
        console.log("Chunks updated:", chunks.length);
    }, [chunks]);

    const handleToggleRecording = () => {
        if (!isRecording) {
            // Start recording
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    console.log("Audio stream captured:", stream);
                    const recorder = new MediaRecorder(stream);
                    setMediaRecorder(recorder);

                    let localChunks = [];  // Use a local variable to manage chunks

                    recorder.ondataavailable = (e) => {
                        console.log("Chunk data available, size:", e.data.size);
                        if (e.data.size > 0) {
                            localChunks.push(e.data);  // Collect chunks locally
                        }
                    };

                    recorder.onstop = () => {
                        console.log("Recording stopped, processing chunks:", localChunks.length);
                        if (localChunks.length > 0) {
                            const audioBlob = new Blob(localChunks, { 'type': 'audio/webm; codecs=opus' });
                            console.log("Final audio blob size:", audioBlob.size);
                            if (audioBlob.size > 0) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    const arrayBuffer = reader.result;
                                    const uint8Array = new Uint8Array(arrayBuffer);
                                    console.log("Sending audio data to server, size:", uint8Array.length);
                                    socket.emit('audioStream', uint8Array);
                                };
                                reader.readAsArrayBuffer(audioBlob);
                            } else {
                                console.error("Audio blob is empty after stopping recording");
                            }
                        } else {
                            console.error("No audio chunks captured");
                        }
                        setChunks([]);  // Reset chunks state after processing
                    };

                    recorder.start();
                    setIsRecording(true);
                })
                .catch((err) => console.error('Error capturing audio:', err));

        } else {
            // Stop recording
            if (mediaRecorder) {
                mediaRecorder.stop();
                setIsRecording(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
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
            <Button variant="contained" color="secondary" onClick={handleToggleRecording}>
                {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Box>
                {conversation.map((entry, index) => (
                    <Box key={index} mt={2}>
                        <Typography variant="body1">
                            <strong>Transcript:</strong> {entry.transcription}
                        </Typography>
                        <Typography variant="body1">
                            <strong>GPT Response:</strong> {entry.gptResponse}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default HomePage;
