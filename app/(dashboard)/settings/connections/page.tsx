"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Link2, Key, Globe, Zap } from "lucide-react";
import { PageTransition } from "@/components/app/PageTransition";
import AppCard from "@/components/app/AppCard";
import StatusBadge from "@/components/app/StatusBadge";
import AvailableServices from "@/components/connections/AvailableServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Connection {
  id: string;
  service_name: string;
  status: "active" | "inactive";
  connection_type: "OAuth" | "APIKey" | null;
  created_at: string;
  last_verified: string | null;
}

const mockConnections: Connection[] = [
  { id: "1", service_name: "Gmail", status: "active", connection_type: "OAuth", created_at: "2025-01-10T10:00:00Z", last_verified: "2025-01-15T10:00:00Z" },
  { id: "2", service_name: "Slack", status: "active", connection_type: "OAuth", created_at: "2025-01-08T14:30:00Z", last_verified: "2025-01-15T09:00:00Z" },
  { id: "3", service_name: "Notion", status: "active", connection_type: "APIKey", created_at: "2025-01-05T09:00:00Z", last_verified: null },
  { id: "4", service_name: "Airtable", status: "inactive", connection_type: "APIKey", created_at: "2025-01-01T12:00:00Z", last_verified: null },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>(mockConnections);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [serviceName, setServiceName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [connectionType, setConnectionType] = useState<"OAuth" | "APIKey" | "">("");

  const resetForm = () => {
    setServiceName("");
    setStatus("active");
    setConnectionType("");
  };

  const handleAdd = async () => {
    if (!serviceName.trim()) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    
    const newConnection: Connection = {
      id: crypto.randomUUID(),
      service_name: serviceName.trim(),
      status,
      connection_type: connectionType || null,
      created_at: new Date().toISOString(),
      last_verified: null,
    };
    
    setConnections([newConnection, ...connections]);
    setIsAddOpen(false);
    resetForm();
    setIsLoading(false);
    toast.success("Connection created successfully");
  };

  const handleEdit = async () => {
    if (!selectedConnection || !serviceName.trim()) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    
    setConnections(connections.map(c => 
      c.id === selectedConnection.id 
        ? { ...c, service_name: serviceName, status, connection_type: connectionType || null }
        : c
    ));
    setIsEditOpen(false);
    setSelectedConnection(null);
    resetForm();
    setIsLoading(false);
    toast.success("Connection updated successfully");
  };

  const handleDelete = async () => {
    if (!selectedConnection) return;
    
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 500));
    
    setConnections(connections.filter(c => c.id !== selectedConnection.id));
    setIsDeleteOpen(false);
    setSelectedConnection(null);
    setIsLoading(false);
    toast.success("Connection deleted successfully");
  };

  const openEditDialog = (connection: Connection) => {
    setSelectedConnection(connection);
    setServiceName(connection.service_name);
    setStatus(connection.status);
    setConnectionType(connection.connection_type || "");
    setIsEditOpen(true);
  };

  const getConnectionIcon = (type: string | null) => {
    if (type === "OAuth") return <Globe className="w-4 h-4" />;
    if (type === "APIKey") return <Key className="w-4 h-4" />;
    return <Link2 className="w-4 h-4" />;
  };

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Connected Services</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Connect your favorite apps and services to enable powerful automations. 
          Synth integrates with popular tools to streamline your workflows.
        </p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Browse Services
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Custom Connections
          </TabsTrigger>
        </TabsList>

        {/* Browse Services Tab */}
        <TabsContent value="browse">
          <AvailableServices />
        </TabsContent>

        {/* Custom Connections Tab */}
        <TabsContent value="custom">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Connection
            </Button>
          </div>

          {/* Connections Grid */}
          {connections.length === 0 ? (
            <AppCard>
              <p className="text-muted-foreground text-center py-8">
                No custom connections yet. Add your first connection to get started.
              </p>
            </AppCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {connections.map((connection) => (
                <AppCard key={connection.id} className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getConnectionIcon(connection.connection_type)}
                      <h3 className="text-lg font-semibold text-foreground">{connection.service_name}</h3>
                    </div>
                    <StatusBadge variant={connection.status === "active" ? "active" : "inactive"}>
                      {connection.status === "active" ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <p>Type: {connection.connection_type || "Not specified"}</p>
                    <p>Created: {formatDate(connection.created_at)}</p>
                    <p>Last verified: {connection.last_verified ? formatDate(connection.last_verified) : "Never"}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(connection)}>
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => { setSelectedConnection(connection); setIsDeleteOpen(true); }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                placeholder="e.g., Gmail, Slack, HubSpot"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Connection Type</Label>
              <Select value={connectionType} onValueChange={(v) => setConnectionType(v as "OAuth" | "APIKey" | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OAuth">OAuth</SelectItem>
                  <SelectItem value="APIKey">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!serviceName.trim() || isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editServiceName">Service Name *</Label>
              <Input
                id="editServiceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Connection Type</Label>
              <Select value={connectionType} onValueChange={(v) => setConnectionType(v as "OAuth" | "APIKey" | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OAuth">OAuth</SelectItem>
                  <SelectItem value="APIKey">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!serviceName.trim() || isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the connection to {selectedConnection?.service_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </PageTransition>
  );
}
