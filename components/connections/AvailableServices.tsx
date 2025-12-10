"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Loader2, 
  Check, 
  ExternalLink,
  Mail,
  MessageSquare,
  FileText,
  Database,
  Calendar,
  Trello,
  Github,
  Slack
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  connected: boolean;
  connectedSince?: string;
  connectionType: "OAuth" | "APIKey";
}

const availableServices: Service[] = [
  { id: "gmail", name: "Gmail", description: "Send and receive emails", icon: Mail, iconColor: "text-red-400", connected: true, connectedSince: "2025-01-10", connectionType: "OAuth" },
  { id: "slack", name: "Slack", description: "Team messaging and notifications", icon: Slack, iconColor: "text-purple-400", connected: true, connectedSince: "2025-01-08", connectionType: "OAuth" },
  { id: "notion", name: "Notion", description: "Documents and databases", icon: FileText, iconColor: "text-foreground", connected: false, connectionType: "OAuth" },
  { id: "google-calendar", name: "Google Calendar", description: "Calendar events and scheduling", icon: Calendar, iconColor: "text-blue-400", connected: false, connectionType: "OAuth" },
  { id: "trello", name: "Trello", description: "Project boards and tasks", icon: Trello, iconColor: "text-sky-400", connected: false, connectionType: "OAuth" },
  { id: "github", name: "GitHub", description: "Code repositories and issues", icon: Github, iconColor: "text-foreground", connected: false, connectionType: "OAuth" },
  { id: "airtable", name: "Airtable", description: "Spreadsheets and databases", icon: Database, iconColor: "text-yellow-400", connected: false, connectionType: "APIKey" },
  { id: "hubspot", name: "HubSpot", description: "CRM and marketing automation", icon: MessageSquare, iconColor: "text-orange-400", connected: false, connectionType: "APIKey" },
];

interface AvailableServicesProps {
  onConnectionChange?: () => void;
}

const AvailableServices = ({ onConnectionChange }: AvailableServicesProps) => {
  const [services, setServices] = useState<Service[]>(availableServices);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const handleConnect = async (serviceId: string) => {
    setConnectingId(serviceId);
    
    // Simulate OAuth flow
    toast.info(`Connecting to ${services.find(s => s.id === serviceId)?.name}...`);
    await new Promise(r => setTimeout(r, 2000));
    
    setServices(prev => prev.map(s => 
      s.id === serviceId 
        ? { ...s, connected: true, connectedSince: new Date().toISOString().split('T')[0] }
        : s
    ));
    
    setConnectingId(null);
    toast.success(`Successfully connected to ${services.find(s => s.id === serviceId)?.name}!`);
    onConnectionChange?.();
  };

  const handleDisconnect = async (serviceId: string) => {
    setDisconnectingId(serviceId);
    
    await new Promise(r => setTimeout(r, 1000));
    
    setServices(prev => prev.map(s => 
      s.id === serviceId 
        ? { ...s, connected: false, connectedSince: undefined }
        : s
    ));
    
    setDisconnectingId(null);
    toast.success(`Disconnected from ${services.find(s => s.id === serviceId)?.name}`);
    onConnectionChange?.();
  };

  const connectedServices = services.filter(s => s.connected);
  const availableToConnect = services.filter(s => !s.connected);

  return (
    <div className="space-y-8">
      {/* Connected Services */}
      {connectedServices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Connected Services ({connectedServices.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg border border-green-500/30 bg-green-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${service.iconColor}`}>
                    <service.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{service.name}</h4>
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Since {service.connectedSince}</span>
                      <span>•</span>
                      <span>{service.connectionType}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Manage
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(service.id)}
                    disabled={disconnectingId === service.id}
                  >
                    {disconnectingId === service.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    Disconnect
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Services */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Available Services ({availableToConnect.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableToConnect.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted ${service.iconColor}`}>
                  <service.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{service.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {service.connectionType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleConnect(service.id)}
                  disabled={connectingId === service.id}
                >
                  {connectingId === service.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services available at this time.</p>
        </div>
      )}
    </div>
  );
};

export default AvailableServices;




