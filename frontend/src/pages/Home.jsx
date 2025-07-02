import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield, LogOut, FileText, Upload, Edit, Lock } from 'lucide-react';

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
      // Clear the access token from localStorage
      localStorage.removeItem('accessToken');
      navigate('/login');
    } catch (err) {
      // Even if logout fails, clear the token and redirect
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await axiosInstance.put('/auth/profile', profileData);
      if (response.data.success) {
        setUser(response.data.data.user);
        setIsEditProfileOpen(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Failed to update profile' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setErrors({ confirmNewPassword: "New passwords don't match" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmNewPassword
      });
      
      if (response.data.success) {
        setIsChangePasswordOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        alert('Password changed successfully!');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Failed to change password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openEditProfile = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setErrors({});
    setIsEditProfileOpen(true);
  };

  const openChangePassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setErrors({});
    setIsChangePasswordOpen(true);
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center space-x-2 md:space-x-4">
            <FileText className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-semibold truncate">PDF Signature App</h1>
          </div>
          <div className="ml-auto flex items-center space-x-2 md:space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="sm:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Sidebar - Quick Actions */}
        <aside className="w-full lg:w-64 border-b lg:border-r lg:border-b-0 bg-card p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <p className="text-sm text-muted-foreground mb-4 hidden lg:block">
                Common tasks and shortcuts.
              </p>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              <Button className="w-full" variant="outline" onClick={() => navigate('/documents')}>
                <FileText className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">View Documents</span>
              </Button>
              <Button className="w-full" variant="outline" onClick={openEditProfile}>
                <Edit className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Edit Profile</span>
              </Button>
              <Button className="w-full" variant="outline" onClick={openChangePassword}>
                <Lock className="h-4 w-4 lg:mr-2" />
                <span className="hidden lg:inline">Change Password</span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            {/* Welcome Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Welcome back!</span>
                </CardTitle>
                <CardDescription>
                  Here's what's happening with your account today.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account details and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 rounded-md border p-3 md:p-4">
                  <User className="h-5 w-5 md:h-6 md:w-6" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Full Name</p>
                    <p className="text-sm text-muted-foreground break-words">{user?.name}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 rounded-md border p-3 md:p-4">
                  <Mail className="h-5 w-5 md:h-6 md:w-6" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Email Address</p>
                    <p className="text-sm text-muted-foreground break-words">{user?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 rounded-md border p-3 md:p-4">
                  <Shield className="h-5 w-5 md:h-6 md:w-6" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Account Status</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 rounded-md border p-3 md:p-4">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Profile Dialog */}
      {isEditProfileOpen && (
        <DialogContent onClose={() => setIsEditProfileOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your account information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfile}>
            <div className="grid gap-4 py-4 px-6">
              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {errors.general}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}

      {/* Change Password Dialog */}
      {isChangePasswordOpen && (
        <DialogContent onClose={() => setIsChangePasswordOpen(false)}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4 px-6">
              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {errors.general}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
                {errors.confirmNewPassword && (
                  <p className="text-sm text-red-600">{errors.confirmNewPassword}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </div>
  );
};

export default Home;
