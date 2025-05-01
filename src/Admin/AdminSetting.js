import React, { useState } from "react";
import { Button, Card, Grid, MenuItem, Select, Switch, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";
import "./AdminSetting.css";

const AdminSetting = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [userRole, setUserRole] = useState("Admin");

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="admin-settings-container">
      <Typography variant="h4" className="title">
        Admin Settings Panel
      </Typography>

      <Grid container spacing={3} justifyContent="center">
        {/* User Management */}
        <Grid item xs={12} sm={6} md={4}>
          <Card className="setting-card">
            <Typography variant="h6" className="section-title">
              User Management
            </Typography>
            <div className="card-content">
              <TextField label="Search User" variant="outlined" fullWidth />
              <Select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="role-dropdown"
                fullWidth
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Editor">Organization</MenuItem>
                <MenuItem value="Viewer">ProjectMember</MenuItem>
              </Select>
              <Button className="save-button" onClick={handleSaveSettings} fullWidth>
                Save Changes
              </Button>
            </div>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} sm={6} md={4}>
          <Card className="setting-card">
            <Typography variant="h6" className="section-title">
              Security & Authentication
            </Typography>
            <div className="card-content">
              <Switch
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <Typography>Enable Dark Mode</Typography>
              <Button className="save-button" onClick={() => toast.warning("Password reset is required!")} fullWidth>
                Reset Passwords
              </Button>
            </div>
          </Card>
        </Grid>

        {/* System Logs */}
        <Grid item xs={12} sm={6} md={4}>
          <Card className="setting-card">
            <Typography variant="h6" className="section-title">
              System Logs & Reports
            </Typography>
            <div className="card-content">
              <Button className="save-button" onClick={() => toast.info("Downloading logs...")} fullWidth>
                Download Logs
              </Button>
              <Button className="save-button" onClick={() => toast.success("Reports Generated!")} fullWidth>
                Generate Reports
              </Button>
            </div>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AdminSetting;
