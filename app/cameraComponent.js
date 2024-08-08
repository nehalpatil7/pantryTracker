import React, { useState, useRef } from 'react';
import { NextResponse } from 'next/server';
import { Camera } from 'react-camera-pro';
import { Button, Box, Typography, TextField } from '@mui/material';
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import openai from "./openaiSetup";


const CameraComponent = ({ onDetection, inventoryItems }) => {
    const camera = useRef(null);
    const [image, setImage] = useState(null);
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState(null);

    const classifyImage = async (imageUrl) => {
        try {
            if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
                return NextResponse.json({ error: 'OpenAI API key is not set' }, { status: 500 });
            }
            const completion = await openai.chat.completions.create({
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `In this image which fruit, vegetable or a food item(basically any edible thing, may it be a packaged item) am I holding in the hand? If it's one of these items: ${inventoryItems.join(', ')}, respond with that item name case sensitively. If it's a fruit or vegetable not in the list, respond with the name of the fruit or vegetable. If it's not a fruit or vegetable, respond with none` },
                            {
                                type: "image_url",
                                image_url: { url: imageUrl },
                            },
                        ],
                    },
                ],
            });
            return completion?.choices[0]?.message?.content;
        } catch (error) {
            console.error('Error classifying image:', error);
            setError('Failed to classify image. Please try again.');
            return [];
        }
    };

    async function uploadImageToStorage(imageSrc) {
        if (!imageSrc) {
            return NextResponse.json({ error: 'No image data received' }, { status: 400 });
        }
        const storageRef = ref(storage, `images_recognition/${Date.now()}.jpg`);
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        return { url, ref: storageRef };
    }

    async function deleteImageFromStorage(storageRef) {
        try {
            await deleteObject(storageRef);
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    const captureImage = async () => {
        setError(null);
        const imageSrc = camera.current.takePhoto();
        setImage(imageSrc);
        setDetecting(true);

        try {
            const { url, ref } = await uploadImageToStorage(imageSrc);

            const labels = await classifyImage(url);
            console.log("Object detected, ", labels);
            const detectedObject = labels.length > 0 ? labels : 'none';

            await deleteImageFromStorage(ref);

            if (detectedObject.toLowerCase() === 'none') {
                setError('No food item detected. Please try again or enter the name manually.');
            } else {
                onDetection(detectedObject);
            }
        } catch (error) {
            console.error('Error detecting object:', error);
            setError('An error occurred while detecting the object');
        } finally {
            setDetecting(false);
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <Box sx={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
                <Camera ref={camera} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            </Box>
            <Button
                variant="contained"
                color="primary"
                onClick={captureImage}
                disabled={detecting}
                fullWidth
                sx={{ mt: 2 }}
            >
                {detecting ? 'Detecting...' : 'Capture and Detect'}
            </Button>
            {image && (
                <Box mt={2}>
                    <img src={image} alt="Captured" style={{ maxWidth: '100%' }} />
                </Box>
            )}
            {error && (
                <Typography color="error" mt={2}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default CameraComponent;