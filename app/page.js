'use client'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  CssBaseline,
  Box,
  Button,
  Modal,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Delete as DeleteIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Close as CloseIcon,
  Assistant as AssistantIcon
} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { PieChart } from "@mui/x-charts";
import { useState, useEffect } from "react";
import { firestore } from "../firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from "firebase/firestore";
import CameraComponent from "./cameraComponent";
import RecipeSuggestion from "./recipeSuggestion";
import { SpeedInsights } from "@vercel/speed-insights/next"


export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [openCamera, setOpenCamera] = useState(false);
  const [openRecipe, setOpenRecipe] = useState(false);
  const [openRecipeSuggestion, setOpenRecipeSuggestion] = useState(false);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      })
    })
    setInventory(inventoryList)
  }

  const addItem = async (item, camera=false) => {
    if (camera == true) {
      inventory.forEach(itemDoc => {
        if (item.toLowerCase().includes(itemDoc.name.toLowerCase()) || itemDoc.name.toLowerCase().includes(item.toLowerCase())) {
          item = itemDoc.name;
        }
      });
    }

    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }

  const deleteItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      await deleteDoc(docRef)
    }
    await updateInventory()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleCameraOpen = () => setOpenCamera(true)
  const handleCameraClose = () => setOpenCamera(false)

  const handleRecipeOpen = () => setOpenRecipe(true)
  const handleRecipeClose = () => setOpenRecipe(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Create a theme instance based on the darkMode state
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  });

  const handleDetection = async (detectedObject) => {
    handleCameraClose()
    if (detectedObject !== 'none') {
      await addItem(detectedObject, true);
    } else {
      alert('No valid object detected');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Outer Div */}
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="background.paper"
      >

        {/* Navbar */}
        <Box
          width="100%"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding={2}
          bgcolor="background.paper"
          boxShadow={1}
        >
          <Typography variant="h2" color="text.primary" pl={3}>Manage your Stuff!</Typography>
          <IconButton onClick={toggleDarkMode}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            <SpeedInsights />
          </IconButton>
        </Box>

        {/* Inner Div */}
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          flexGrow={1}
          gap={10}
        >

          {/* Pie Chart */}
          <Box
            position="relative"
            top="43%"
            left="20%"
            sx={{ transform: "translate(-60%,-80%)" }}
            width={500}
            height="450px"
            border={`2px solid ${theme.palette.divider}`}
            boxShadow={20}
            paddingTop={4}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap={3}
          >
            <Typography variant="h5" color="text.primary">Inventory Overview</Typography>
            <PieChart
            series={[
              {
                data: inventory.map(
                  ({name, quantity}) => ({
                    id: name,
                    value: quantity,
                    label: name,
                  })
                ),
                innerRadius: 10,
                outerRadius: 120,
                paddingAngle: 5,
                cornerRadius: 5,
                startAngle: -180,
                endAngle: 180,
                cx: 150,
                cy: 150,
                highlightScope: { faded: 'global', highlighted: 'item' },
                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
              },
            ]}
            width={450}
            height={400}
          />
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            boxShadow={20}
            flexGrow={1}
            gap={2}
          >
            <Modal open={open} onClose={handleClose}>
              <Box
                position="relative"
                top="50%"
                left="50%"
                sx={{ transform: "translate(-50%,-50%)" }}
                width={400}
                bgcolor="background.paper"
                border={`2px solid ${theme.palette.divider}`}
                p={4}
                display="flex"
                flexDirection="column"
                gap={3}
              >
                <Typography variant="h6" color="text.primary">ADD NEW ITEM</Typography>
                <Stack width="100%" direction="row" spacing={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    value={itemName}
                    onChange={(e) => { setItemName(e.target.value) }}
                  />
                  <Button variant="outlined" onClick={() => { addItem(itemName); setItemName(''); handleClose() }}>ADD</Button>
                </Stack>
              </Box>
            </Modal>

            {/* Inventory Items Div */}
            <Box border={`1px solid ${theme.palette.divider}`}>
              <Box
                width="800px"
                height="150px"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                bgcolor="#ADD8E6"
              >
                <Box
                  width="100%"
                  display="flex"
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h5" color="text.primary" sx={{ marginLeft: 5 }}>Inventory Items</Typography>
                  <Stack direction="row" spacing={2} pr={5}>
                    <Button
                      variant="contained"
                      sx={{ marginRight: 5 }}
                      startIcon={<AddShoppingCartIcon />}
                      onClick={() => { handleOpen() }}
                    >ADD NEW ITEM</Button>
                    <Button
                      variant="contained"
                      sx={{ marginRight: 5 }}
                      startIcon={<AssistantIcon />}
                      onClick={() => { handleCameraOpen() }}
                    >CAPTURE ITEM</Button>
                    <Button
                      variant="contained"
                      sx={{ marginRight: 5 }}
                      startIcon={<AssistantIcon />}
                      onClick={() => { handleRecipeOpen() }}
                    >GET RECIPE</Button>
                  </Stack>

                  {/* Camera Dialog */}
                  <Dialog
                    open={openCamera}
                    onClose={() => handleCameraClose()}
                    maxWidth="md"
                    fullWidth
                    border={`2px solid ${theme.palette.divider}`}
                    p={4}
                    gap={3}
                  >
                    <DialogTitle>
                      <Stack
                        display="flex"
                        direction="row"
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                        padding={2}
                      >
                        <Typography color="text.primary">IDENTIFY item USING IMAGE RECOGNITION</Typography>
                        <IconButton onClick={() => handleCameraClose()}>
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    </DialogTitle>
                    <DialogContent>
                      <CameraComponent
                        onDetection={handleDetection}
                        onClose={() => handleCameraClose()}
                        inventoryItems={inventory.map(item => item.name)}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Recipe Dialog */}
                  <Dialog
                    open={openRecipe}
                    onClose={() => handleRecipeClose()}
                    maxWidth="md"
                    fullWidth
                    border={`2px solid ${theme.palette.divider}`}
                    p={4}
                    gap={3}
                  >
                    <DialogTitle>
                      <Stack
                        display="flex"
                        direction="row"
                        spacing={2}
                        justifyContent="space-between"
                        alignItems="center"
                        padding={2}
                      >
                        <Typography color="text.primary">GENERATE RECIPE FROM AVAILABLE INVENTORY USING AI</Typography>
                        <IconButton onClick={() => handleRecipeClose()}>
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    </DialogTitle>
                    <DialogContent>
                      <RecipeSuggestion
                        open={openRecipeSuggestion}
                        onClose={() => handleRecipeClose()}
                        inventoryItems={inventory.map(item => item.name)}
                      />
                    </DialogContent>
                  </Dialog>

                </Box>
                <TextField
                  variant="outlined"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mt: 2, width: '90%' }}
                />
              </Box>
              <Stack width="800px" height="300px" direction="column" overflow="auto" spacing={-8}>
                {
                  inventory.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase())).map(({ name, quantity }) => (
                    <Box
                      key={name}
                      width="100%"
                      minHeight="150px"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      bgcolor="background.paper"
                      padding={10}
                    >
                      <Typography
                        variant="subtitle1"
                        fontSize="25px"
                        color="text.primary"
                        textAlign="center"
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)} : {quantity}</Typography>
                      <Stack direction="row" spacing={2}>
                        <Button variant="contained" onClick={() => { addItem(name) }}>ADD</Button>
                        <Button variant="contained" onClick={() => { removeItem(name) }}>Remove</Button>
                        <Button variant="outlined" startIcon={<DeleteIcon />} onClick={() => { deleteItem(name) }}>Delete</Button>
                      </Stack>
                    </Box>
                  ))
                }
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
