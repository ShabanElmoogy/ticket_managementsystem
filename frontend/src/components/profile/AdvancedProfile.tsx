import React, { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  LinearProgress,
  Paper,
  Stack,
} from "@mui/material";
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  PhotoCamera as PhotoCameraIcon,
  Download as DownloadIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../../stores/authStore";

const AdvancedProfile: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    ticketUpdates: true,
    mentions: true,
    reminders: true,
  });
  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC-5",
    theme: "auto",
    dateFormat: "MM/DD/YYYY",
  });

  const mockStats = {
    totalTickets: 45,
    resolvedTickets: 38,
    avgResolutionTime: "2.3 hours",
    rating: 4.8,
    completionRate: 84,
    streak: 12,
    badges: 8,
  };

  const mockAchievements = [
    {
      title: "Speed Demon",
      description: "Resolved 10 tickets in one day",
      icon: "⚡",
      earned: true,
    },
    {
      title: "Customer Hero",
      description: "Received 5-star rating 20 times",
      icon: "🏆",
      earned: true,
    },
    {
      title: "Team Player",
      description: "Helped 5 colleagues this month",
      icon: "🤝",
      earned: false,
    },
  ];

  const mockActivity = [
    { action: "Resolved ticket #1234", time: "2 hours ago", type: "success" },
    { action: "Updated ticket #1235", time: "4 hours ago", type: "info" },
    { action: "Created new ticket", time: "1 day ago", type: "primary" },
  ];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const ProfileTab = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: "auto",
                  mb: 2,
                  fontSize: "3rem",
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
              <Button
                size="small"
                sx={{
                  position: "absolute",
                  bottom: 16,
                  right: -8,
                  minWidth: "auto",
                  borderRadius: "50%",
                  p: 1,
                }}
                variant="contained"
              >
                <PhotoCameraIcon sx={{ fontSize: "1rem" }} />
              </Button>
            </Box>
            <Typography variant="h5" gutterBottom>
              {user?.name}
            </Typography>
            <Chip
              label={user?.role}
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Member since January 2024
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip
                size="small"
                icon={<EmojiEventsIcon />}
                label={`${mockStats.badges} Badges`}
              />
              <Chip
                size="small"
                icon={<TimelineIcon />}
                label={`${mockStats.streak} Day Streak`}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  defaultValue={user?.name}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={user?.email || "user@example.com"}
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  defaultValue="+1 (555) 123-4567"
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Department"
                  defaultValue="IT Support"
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  defaultValue="Experienced support specialist focused on customer satisfaction."
                  variant="outlined"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button variant="contained">Save Changes</Button>
              <Button variant="outlined">Cancel</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />}>
                Export Profile
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const StatsTab = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">{mockStats.totalTickets}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total Tickets
            </Typography>
          </CardContent>
        </Card>
      </Grid>

     <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">{mockStats.resolvedTickets}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Resolved
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AccessTimeIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">
                {mockStats.avgResolutionTime}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Avg Resolution
            </Typography>
          </CardContent>
        </Card>
      </Grid>

     <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <StarIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">{mockStats.rating}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Rating
            </Typography>
          </CardContent>
        </Card>
      </Grid>

     <Grid size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Overview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Completion Rate: {mockStats.completionRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={mockStats.completionRate}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              You're performing above average! Keep up the great work.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{xs:12,md:6}}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Achievements
            </Typography>
            <Stack spacing={1}>
              {mockAchievements.map((achievement, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    opacity: achievement.earned ? 1 : 0.5,
                  }}
                >
                  <Typography sx={{ fontSize: "1.5rem" }}>
                    {achievement.icon}
                  </Typography>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {achievement.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {achievement.description}
                    </Typography>
                  </Box>
                  {achievement.earned && (
                    <CheckCircleIcon color="success" sx={{ ml: "auto" }} />
                  )}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const NotificationsTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={notifications.email}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    email: e.target.checked,
                  })
                }
              />
            }
            label="Email Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.push}
                onChange={(e) =>
                  setNotifications({ ...notifications, push: e.target.checked })
                }
              />
            }
            label="Push Notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.ticketUpdates}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    ticketUpdates: e.target.checked,
                  })
                }
              />
            }
            label="Ticket Updates"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.mentions}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    mentions: e.target.checked,
                  })
                }
              />
            }
            label="Mentions & Comments"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifications.reminders}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    reminders: e.target.checked,
                  })
                }
              />
            }
            label="Due Date Reminders"
          />
        </Stack>
        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          System Preferences
        </Typography>
        <Grid container spacing={2}>
            <Grid size={{xs:12,md:6}}>
            <TextField
              fullWidth
              select
              label="Language"
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </TextField>
          </Grid>
            <Grid size={{xs:12,md:6}}>
            <TextField
              fullWidth
              select
              label="Timezone"
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences({ ...preferences, timezone: e.target.value })
              }
              SelectProps={{ native: true }}
            >
              <option value="UTC-5">Eastern Time</option>
              <option value="UTC-6">Central Time</option>
              <option value="UTC-8">Pacific Time</option>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained">Save Preferences</Button>
        </Box>
      </CardContent>
    </Card>
  );

  const ActivityTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {mockActivity.map((activity, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Badge color={activity.type as 'success' | 'info' | 'primary'} variant="dot">
                  <TrendingUpIcon />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={activity.action}
                secondary={activity.time}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const SecurityTab = () => (
    <Grid container spacing={3}>
        <Grid size={{xs:12,md:6}}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                variant="outlined"
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                variant="outlined"
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                variant="outlined"
              />
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<LockIcon />}>
                Update Password
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add an extra layer of security to your account
            </Typography>
            <FormControlLabel control={<Switch />} label="Enable 2FA" />
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<VpnKeyIcon />}>
                Setup 2FA
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<AssessmentIcon />} label="Statistics" />
          <Tab icon={<NotificationsIcon />} label="Preferences" />
          <Tab icon={<ScheduleIcon />} label="Activity" />
          <Tab icon={<SecurityIcon />} label="Security" />
        </Tabs>
      </Paper>

      <Box>
        {activeTab === 0 && <ProfileTab />}
        {activeTab === 1 && <StatsTab />}
        {activeTab === 2 && <NotificationsTab />}
        {activeTab === 3 && <ActivityTab />}
        {activeTab === 4 && <SecurityTab />}
      </Box>
    </Box>
  );
};

export default AdvancedProfile;
