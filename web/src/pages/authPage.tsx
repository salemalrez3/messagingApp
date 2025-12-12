import { Box, Paper, TextField } from "@mui/material";

export const AuthPage = () => {
  return (
    <>
      <Box sx={{justifyContent:"center", alignItems:"center",height:"100dvh"}}>
        <Paper sx={{justifyContent:"center", alignItems:"center",height:"100%", backgroundColor:"darkblue"}}>
        <TextField placeholder="passwind" sx={{justifyContent:"center", alignItems:"center",height:"100dvh"}}></TextField>
        <TextField placeholder="passwind" sx={{justifyContent:"center", alignItems:"center",height:"100dvh"}}></TextField>
        </Paper>
      </Box>
    </>
  );
};
