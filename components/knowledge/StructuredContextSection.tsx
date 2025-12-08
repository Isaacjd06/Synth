"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, Building2, Users, Package, Wrench, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  pricing: string;
  delivery: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  responsibilities: string;
}

export default function StructuredContextSection() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Company Info
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [keyMetrics, setKeyMetrics] = useState("");
  const [objectives, setObjectives] = useState("");

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  
  // Team Members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // Tools
  const [tools, setTools] = useState<string[]>([]);
  const [newTool, setNewTool] = useState("");
  const [connectedTools, setConnectedTools] = useState<string[]>([]);

  // Load data on mount
  useEffect(() => {
    loadStructuredKnowledge();
    loadConnectedTools();
  }, []);

  const loadStructuredKnowledge = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/knowledge/structured");
      const data = await response.json();
      
      if (data.ok && data.items) {
        // Load company info
        const companyInfo = data.items.find((item: { type: string }) => item.type === "company_info");
        if (companyInfo && companyInfo.data) {
          setCompanyName(companyInfo.data.companyName || "");
          setIndustry(companyInfo.data.industry || "");
          setTargetCustomer(companyInfo.data.targetCustomer || "");
          setKeyMetrics(companyInfo.data.keyMetrics || "");
          setObjectives(companyInfo.data.objectives || "");
        }

        // Load products
        const productItems = data.items.filter((item: { type: string }) => item.type === "product");
        setProducts(productItems.map((item: { id: string; data: unknown }) => ({
          id: item.id,
          ...(item.data as Product),
        })));

        // Load team members
        const teamItems = data.items.filter((item: { type: string }) => item.type === "team_member");
        setTeamMembers(teamItems.map((item: { id: string; data: unknown }) => ({
          id: item.id,
          ...(item.data as TeamMember),
        })));

        // Load tools
        const toolItems = data.items.filter((item: { type: string }) => item.type === "tool");
        setTools(toolItems.map((item: { data: { name?: string } }) => item.data.name || "").filter(Boolean));
      }
    } catch (error) {
      console.error("Error loading structured knowledge:", error);
      toast.error("Failed to load structured knowledge");
    } finally {
      setLoading(false);
    }
  };

  const loadConnectedTools = async () => {
    try {
      const response = await fetch("/api/connections");
      const data = await response.json();
      if (data.ok && data.connections) {
        setConnectedTools(data.connections.map((c: { service_name: string }) => c.service_name));
      }
    } catch (error) {
      // Ignore errors - connections might not be available
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const itemsToSave = [];

      // Save company info
      if (companyName || industry || targetCustomer || keyMetrics || objectives) {
        itemsToSave.push({
          type: "company_info",
          data: {
            companyName,
            industry,
            targetCustomer,
            keyMetrics,
            objectives,
          },
        });
      }

      // Save products
      products.forEach((product) => {
        itemsToSave.push({
          type: "product",
          data: product,
        });
      });

      // Save team members
      teamMembers.forEach((member) => {
        itemsToSave.push({
          type: "team_member",
          data: member,
        });
      });

      // Save tools
      tools.forEach((tool) => {
        itemsToSave.push({
          type: "tool",
          data: { name: tool },
        });
      });

      // First, get existing items to update company_info if it exists
      const existingResponse = await fetch("/api/knowledge/structured?type=company_info");
      const existingData = await existingResponse.json();
      const existingCompanyInfo = existingData.ok && existingData.items.length > 0 
        ? existingData.items[0] 
        : null;

      // Delete all existing structured knowledge and recreate (simpler for MVP)
      // In production, you'd want to update existing items instead
      if (itemsToSave.length > 0) {
        const response = await fetch("/api/knowledge/structured", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemsToSave),
        });

        const data = await response.json();
        
        if (data.ok) {
          toast.success("Structured knowledge saved");
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } else {
          throw new Error(data.error || "Failed to save");
        }
      }
    } catch (error) {
      console.error("Error saving structured knowledge:", error);
      toast.error("Failed to save structured knowledge");
    } finally {
      setIsSaving(false);
    }
  };

  const addProduct = () => {
    setProducts([...products, {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      pricing: "",
      delivery: ""
    }]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, {
      id: crypto.randomUUID(),
      name: "",
      role: "",
      responsibilities: ""
    }]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addTool = () => {
    if (newTool.trim() && !tools.includes(newTool.trim())) {
      setTools([...tools, newTool.trim()]);
      setNewTool("");
    }
  };

  const removeTool = (tool: string) => {
    setTools(tools.filter(t => t !== tool));
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            Company Information
          </CardTitle>
          <CardDescription>Basic information about your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCustomer">Target Customer Type</Label>
            <Input
              id="targetCustomer"
              placeholder="e.g., Small business owners, Enterprise companies, Startups"
              value={targetCustomer}
              onChange={(e) => setTargetCustomer(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyMetrics">Key Metrics</Label>
            <Textarea
              id="keyMetrics"
              placeholder="What metrics matter most to your business? (e.g., MRR, Churn rate, CAC, LTV)"
              value={keyMetrics}
              onChange={(e) => setKeyMetrics(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Primary Objectives</Label>
            <Textarea
              id="objectives"
              placeholder="What are your main business goals?"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products/Services */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-primary" />
                Products & Services
              </CardTitle>
              <CardDescription>Your offerings and their details</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addProduct}>
              <Plus className="w-4 h-4 mr-1" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No products added yet. Click "Add Product" to get started.
            </p>
          ) : (
            products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Product {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Product name"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Pricing (e.g., $99/mo)"
                    value={product.pricing}
                    onChange={(e) => updateProduct(product.id, "pricing", e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Product description"
                  value={product.description}
                  onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                  className="min-h-[60px]"
                />
                <Textarea
                  placeholder="Delivery details"
                  value={product.delivery}
                  onChange={(e) => updateProduct(product.id, "delivery", e.target.value)}
                  className="min-h-[60px]"
                />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription>Key people in your organization</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addTeamMember}>
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No team members added yet. Click "Add Member" to get started.
            </p>
          ) : (
            teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Member {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeTeamMember(member.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => updateTeamMember(member.id, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Role"
                    value={member.role}
                    onChange={(e) => updateTeamMember(member.id, "role", e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Responsibilities"
                  value={member.responsibilities}
                  onChange={(e) => updateTeamMember(member.id, "responsibilities", e.target.value)}
                  className="min-h-[60px]"
                />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tools & Platforms */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="w-5 h-5 text-primary" />
            Tools & Platforms
          </CardTitle>
          <CardDescription>Software and tools your business uses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tool (e.g., Salesforce, HubSpot)"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTool()}
            />
            <Button variant="outline" onClick={addTool}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <Badge
                key={tool}
                variant={connectedTools.includes(tool) ? "default" : "secondary"}
                className="px-3 py-1.5 cursor-pointer"
              >
                {tool}
                {connectedTools.includes(tool) && (
                  <Check className="w-3 h-3 ml-1" />
                )}
                <button
                  onClick={() => removeTool(tool)}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {tools.length === 0 && (
              <p className="text-muted-foreground text-sm">No tools added yet.</p>
            )}
          </div>
          
          {tools.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <Check className="w-3 h-3 inline mr-1" />
              Connected tools are highlighted. Connect more in the Connections page.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

