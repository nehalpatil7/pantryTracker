import React, { useState } from 'react';
import {
    Box,
    DialogActions,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';
import openai from "./openaiSetup";


const RecipeSuggestion = ({ open, onClose, inventoryItems }) => {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const aiRecipeGenerator = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
                return NextResponse.json({ error: 'OpenAI API key is not set' }, { status: 500 });
            }
            const completion = await openai.chat.completions.create({
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that suggests recipes based on available food ingredients. NOTE: Do not give any helper statements or any text formatting, give me only the content needed."
                    },
                    {
                        role: "user",
                        content: `Some of the following items are food items, ${inventoryItems.join(', ')}. Filter them and suggest a recipe using some or all of those ingredients. Provide the recipe name, ingredients list, and step-by-step instructions.`
                    }
                ],
            });
            return completion?.choices[0]?.message?.content;
        } catch (error) {
            console.error('Error getting recipe from AI: ', error);
            setError('Failed to get recipe. Please try again.');
            return null;
        }
    };

    const getRecipeSuggestion = async () => {
        setLoading(true);
        setError(null);
        try {
            const recipeText = await aiRecipeGenerator();
            if (!recipeText) {
                console.error('Error generating recipe');
                throw new Error('API error!');
            } else {
                const recipeParts = recipeText.split('\n\n');
                const recipe = {
                    name: recipeParts[0].replace('Recipe Name: ', ''),
                    ingredients: recipeParts[1].replace('Ingredients:\n', '').split('\n'),
                    steps: recipeParts[2].replace('Instructions:\n', '').split('\n'),
                };
                setRecipe(recipe);
                console.log("Recipe generated, ", recipe?.name);
            }
        } catch (error) {
            console.error('Error generating recipe: ', error);
            setError('An error occurred while generating/extarcting the recipe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box open={open} onClose={onClose} maxWidth="md" fullwidth="true">
            <Typography variant="h6" gutterBottom padding={2}>
                Available Ingredients:
            </Typography>
            <List dense>
                {inventoryItems.map((item) => (
                    <ListItem key={item}>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>
            {loading ? (
                <CircularProgress />
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : recipe ? (
                <>
                    <Typography variant="h6" gutterBottom>
                        Suggested Recipe: {recipe.name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Ingredients:
                    </Typography>
                    <List dense>
                        {recipe.ingredients.map((ingredient, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={ingredient} />
                            </ListItem>
                        ))}
                    </List>
                    <Typography variant="subtitle1" gutterBottom>
                        Steps:
                    </Typography>
                    <List dense>
                        {recipe.steps.map((step, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={`${step}`} />
                            </ListItem>
                        ))}
                    </List>
                </>
            ) : (
                <Typography padding={2}>Click &apos;Get Recipe Suggestion&apos; to generate a recipe.</Typography>
            )}
            <DialogActions>
                <Button onClick={getRecipeSuggestion} color="primary" disabled={loading}>
                    Get Recipe Suggestion
                </Button>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Box>
    );
};

export default RecipeSuggestion;