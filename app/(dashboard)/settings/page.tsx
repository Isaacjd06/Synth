"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  User, 
  Shield, 
  Link2, 
  CreditCard, 
  Loader2, 
  Check, 
  Camera,
  AlertTriangle,
  Trash2
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Mock user data
const mockUser = {
  id: "user_123",
  name: "John Doe",
  email: "john@example.com",
  avatar: null,
  authProvider: "google" as const,
  createdAt: "2025-01-01T00:00:00Z",
  lastLogin: "2025-01-15T10:30:00Z",
  subscription: {
    plan: "Growth",
    status: "active",
    trialEndsAt: null,
  },
  stats: {
    activeWorkflows: 5,
    totalExecutions: 1234,
    connectedServices: 4,
  }
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  
  // Profile state
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  
  // Account state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSavingProfile(false);
    setProfileSaved(true);
    toast.success("Profile updated successfully");
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") return;
    
    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    toast.success("Account deletion initiated. You will receive a confirmation email.");
  };

  const isEmailEditable = mockUser.authProvider !== "google";

  return (
    <AppShell>
      <div className="px-4 lg:px-6 py-4 lg:py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your profile, account, and preferences.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="connections" asChild>
            <Link href="/settings/connections" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Connections</span>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href="/billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </Link>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile picture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-foreground">
                      {mockUser.avatar ? (
                        <img src={mockUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors">
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or GIF. Max 2MB.</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Change Photo
                    </Button>
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address
                    {!isEmailEditable && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Google Account
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={!isEmailEditable}
                    className={!isEmailEditable ? "bg-muted cursor-not-allowed" : ""}
                  />
                  {!isEmailEditable && (
                    <p className="text-xs text-muted-foreground">
                      Email is managed by your Google account and cannot be changed here.
                    </p>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile || !name.trim()}
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : profileSaved ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Saved!
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Account Details */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
                <CardDescription>View your account information and subscription status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium text-foreground">{mockUser.email}</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Account Created</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(mockUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Last Login</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(mockUser.lastLogin).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Subscription</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{mockUser.subscription.plan}</p>
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                        {mockUser.subscription.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
                <CardDescription>Overview of your Synth usage.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{mockUser.stats.activeWorkflows}</p>
                    <p className="text-xs text-muted-foreground">Active Workflows</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{mockUser.stats.totalExecutions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Executions</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-border bg-muted/30">
                    <p className="text-2xl font-bold text-foreground">{mockUser.stats.connectedServices}</p>
                    <p className="text-xs text-muted-foreground">Connected Services</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50 bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible and destructive actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete Account</p>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action is permanent and cannot be undone. The following will be deleted:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>All your workflows and executions</li>
                <li>All connected services and integrations</li>
                <li>All knowledge base entries and files</li>
                <li>Your subscription and billing history</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="deleteConfirm" className="text-foreground">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm:
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppShell>
  );
}

