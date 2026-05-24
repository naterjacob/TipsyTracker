//getting user info from clerk
import { useUser, UserButton } from "@clerk/clerk-react";

//navigating to differnt pages
import { Link, useNavigate } from "react-router-dom";

import { useState } from "react";

//imported react library components
import {AppBar, Box, Toolbar, Typography, Button, Stack, DialogTitle, Dialog, DialogContent, TextField, Select, MenuItem,
FormControl, Checkbox, ListItemText, InputLabel, DialogActions} from "@mui/material"
import PersonIcon from "@mui/icons-material/Person";



//Diaglog here just means popup window
export interface SimpleDialogProps {
    open: boolean;
    selectedValue: string;
    onClose: (value: string) => void;
}

function SimpleDialog(props: SimpleDialogProps) {
    const { onClose, selectedValue, open } = props;

    const handleClose = () => {
        onClose(selectedValue);

    };

    //Saving info
    const [caption, setCaption] = useState("");
    const [bars, setBars] = useState<string[]>([]);


    const handlePost = () => {
        const newPost = {
            caption,
            bars,
        };

        //Seeing if the post button does anything
        console.log("Posting:", newPost);

        // reset fields
        setCaption("");
        setBars([]);

        // close dialog
        handleClose();

    };
    return (
        <Dialog onClose={handleClose} open={open} maxWidth="md" fullWidth>
            <DialogTitle>Make a post</DialogTitle>
            {/*text box to make a caption */}
            <DialogContent>
                <TextField
                    autoFocus
                    multiline
                    minRows={3}
                    placeholder="Write a caption..."
                    fullWidth
                    variant="filled"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                />

                {/*drop down menu for bars, will connect to backend later */}
                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Bars Hopped</InputLabel>

                    <Select
                        multiple
                        value={bars}
                        onChange={(e) => setBars(e.target.value as string[])}
                        renderValue={(selected) => selected.join(", ")}
                        label="Categories"
                    >
                        <MenuItem value="Frog & Peach Pub">
                            <Checkbox checked={bars.includes("Frog & Peach Pub")} />
                            <ListItemText primary="Frog & Peach Pub" />
                        </MenuItem>

                        <MenuItem value="Black Sheep Bar">
                            <Checkbox checked={bars.includes("Black Sheep Bar")} />
                            <ListItemText primary="Black Sheep Bar" />
                        </MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>

            {/*post and cancel buttons */}
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>

                <Button
                    onClick={handlePost}
                    variant="contained"
                    disabled={!caption.trim()}
                >
                    Post
                </Button>
            </DialogActions>

        </Dialog>
    );
}


export default function Header() {
    //setting up page navigation and curent logged user info
    const navigate = useNavigate();
    const { user } = useUser();

    //place holder if not able to get username
    if (!user) return null;

    //stuff for pop up to make a post
    const [showPost, setShowPost] = useState(false);

    const handleClickOpen = () => {
        setShowPost(true);
    };

    const handleClose = () => {
        setShowPost(false);
    };


    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ backgroundColor: '#ffffff' }}>
                <Toolbar>
                    {/*Logo button */}
                    <Typography variant="h4" component={Link} to={"/home"}
                        sx={{ flexGrow: 1, color: '#034078', fontFamily: `sans-serif`, fontStyle: 'italic' }}>
                        TipsyTracker
                    </Typography>

                    {/*right side buttons */}
                    <Stack spacing={2} direction="row">

                        {/*post button */}
                        <Button variant="outlined" sx={{
                            color: '#034078',
                            borderColor: '#034078',
                            fontStyle: 'bold',
                            fontWeight: 800,
                            fontSize: 24
                        }} onClick={handleClickOpen}>+</Button>

                        {/*user menu button and making it bigger */}
                        <UserButton appearance={{
                            elements: {
                                userButtonAvatarBox: {
                                    width: "48px",
                                    height: "48px",
                                },
                                userButtonTrigger: {
                                    width: "48px",
                                    height: "48px",
                                },
                            },
                        }}>
                            <UserButton.MenuItems>
                                <UserButton.Action
                                    label="Account"
                                    labelIcon={<PersonIcon />}
                                    onClick={() => navigate(`/users/${user.username}`)}
                                />
                            </UserButton.MenuItems>
                        </UserButton>

                        {/*loads in the pop up */}
                        <SimpleDialog
                            selectedValue={""}
                            open={showPost}
                            onClose={handleClose}
                        />
                    </Stack>
                </Toolbar>
            </AppBar>
        </Box>
    )

}