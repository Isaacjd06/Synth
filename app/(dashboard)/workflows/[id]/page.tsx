"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, Play, Pencil, Zap, Trash2, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PageTransition, PageItem } from "@/components/app/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  LockedActionPanel,
  LockedButton,
} from "@/app/(dashboard)/_components/subscription";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  intent: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  trigger: { type: string; config: unknown } | null;
  actions: unknown[];
  steps?: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    metadata: unknown;
  }>;
  stats?: {
    totalRuns: number;
    avgTime: number;
    successRate: number;
    lastRunAt: string | null;
  };
  timeline?: Array<{
    date: string;
    runs: number;
    successes: number;
    failures: number;
  }>;
}

interface Execution {
  id: string;
  status: string;
  created_at: string;
  finished_at: string | null;
  input_data: unknown;
  output_data: unknown;
  error_message?: string | null;
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isSubscribed, openSubscriptionModal } = useSubscription();
  const id = params.id as string;
  
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Loading states
  const [isRunning, setIsRunning] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Dialogs
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Run form
  const [inputData, setInputData] = useState("");
  const [inputDataError, setInputDataError] = useState<string | null>(null);
  
  // Execution result
  const [lastExecution, setLastExecution] = useState<{
    id: string;
    data: unknown;
    finished_at: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workflowRes, executionsRes] = await Promise.all([
          fetch(`/api/workflows/${id}`),
          fetch(`/api/workflows/${id}/executions`)
        ]);
        
        // Check content types before parsing
        const workflowContentType = workflowRes.headers.get("content-type");
        const executionsContentType = executionsRes.headers.get("content-type");
        
        if (!workflowRes.ok) {
          throw new Error("Failed to fetch workflow");
        }
        
        if (!workflowContentType || !workflowContentType.includes("application/json")) {
          throw new Error("Unexpected response from server");
        }
        
        const workflowData = await workflowRes.json();
        let executionsList: Execution[] = [];
        
        if (executionsRes.ok && executionsContentType && executionsContentType.includes("application/json")) {
          const executionsData = await executionsRes.json();
          // Handle both response formats
          if (executionsData.ok && executionsData.executions) {
            executionsList = executionsData.executions;
          } else if (Array.isArray(executionsData)) {
            executionsList = executionsData;
          }
        }
        
        if (workflowData.id) {
          setWorkflow({
            ...workflowData,
            status: workflowData.active ? "active" : "inactive",
          });
        }
        setExecutions(executionsList);
      } catch (err) {
        console.error("Error fetching workflow:", err);
        toast.error("Failed to load workflow");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleActivate = async () => {
    if (!workflow) return;
    setIsActivating(true);
    
    try {
      const response = await fetch(`/api/workflows/activate`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (response.ok) {
        setWorkflow({ ...workflow, status: "active", active: true });
        toast.success("Workflow activated successfully");
      } else {
        toast.error(data.error || "Failed to activate workflow");
      }
    } catch (err) {
      toast.error("Failed to activate workflow");
    } finally {
      setIsActivating(false);
    }
  };

  const handleOpenRunDialog = () => {
    setInputData("");
    setInputDataError(null);
    setLastExecution(null);
    setIsRunDialogOpen(true);
  };

  const handleRun = async () => {
    // Validate inputData if provided
    let parsedInputData = {};
    if (inputData.trim()) {
      try {
        parsedInputData = JSON.parse(inputData);
      } catch {
        setInputDataError("Invalid JSON");
        return;
      }
    }
    setInputDataError(null);

    setIsRunning(true);
    
    try {
      const response = await fetch(`/api/workflows/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsedInputData }),
      });
      const data = await response.json();
      
      if (data.ok && data.data) {
        const result = {
          id: data.data.executionId,
          data: data.data.outputPreview || { success: true },
          finished_at: data.data.finishedAt || new Date().toISOString(),
          status: data.data.status || "success",
        };
        setLastExecution(result);
        toast.success("Workflow executed successfully");
        
        // Refresh workflow data and executions list
        const [workflowRes, executionsRes] = await Promise.all([
          fetch(`/api/workflows/${id}`),
          fetch(`/api/workflows/${id}/executions`),
        ]);
        
        if (workflowRes.ok) {
          const workflowData = await workflowRes.json();
          if (workflowData.id) {
            setWorkflow({
              ...workflowData,
              status: workflowData.active ? "active" : "inactive",
            });
          }
        }
        
        if (executionsRes.ok) {
          const executionsData = await executionsRes.json();
          // Handle both response formats
          if (executionsData.ok && executionsData.executions) {
            setExecutions(executionsData.executions || []);
          } else if (Array.isArray(executionsData)) {
            setExecutions(executionsData);
          }
        }
      } else {
        const errorMessage = data.error || "Failed to run workflow";
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to run workflow";
      toast.error(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!workflow) return;
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/workflows/delete`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success("Workflow deleted successfully");
        router.push("/app/workflows");
      } else {
        toast.error(data.error || "Failed to delete workflow");
      }
    } catch (err) {
      toast.error("Failed to delete workflow");
    } finally {
      setIsDeleting(false);
    }
  };


  const getStatusVariant = (status: string) => {
    switch (status) {
      case "success":
        return "success";
      case "error":
      case "failure":
        return "error";
      case "running":
        return "running";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <PageTransition className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted/50 rounded w-3/4" />
            <div className="h-32 bg-muted/50 rounded" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!workflow) {
    return (
      <PageTransition className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <p className="text-muted-foreground">Workflow not found</p>
        </div>
      </PageTransition>
    );
  }

  // Convert workflow actions to steps format for display
  const workflowSteps = workflow.actions && Array.isArray(workflow.actions) 
    ? workflow.actions.map((action: any, index: number) => ({
        type: index === 0 ? "trigger" : "action",
        label: action.name || action.type || `Step ${index + 1}`,
      }))
    : [];

  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Back Button */}
        <PageItem>
          <Button variant="ghost" size="sm" asChild className="group">
            <Link href="/app/workflows" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Workflows
            </Link>
          </Button>
        </PageItem>

        {/* Header with Actions */}
        <PageItem>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <motion.h1 
                  className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  {workflow.name}
                </motion.h1>
                <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                  {workflow.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground max-w-xl">
                {workflow.description || "No description provided."}
              </p>
            </div>

            {/* Action Buttons */}
            {isSubscribed ? (
              <div className="flex flex-wrap gap-3">
                {workflow.status !== "active" && (
                  <Button 
                    variant="outline" 
                    onClick={handleActivate} 
                    disabled={isActivating}
                    className="gap-2"
                  >
                    {isActivating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Activating...</>
                    ) : (
                      <><Zap className="w-4 h-4" />Activate</>
                    )}
                  </Button>
                )}
                <Button onClick={handleOpenRunDialog} disabled={isRunning} className="gap-2">
                  <Play className="w-4 h-4" />
                  Run Workflow
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            ) : (
              <LockedActionPanel
                title="Actions Locked"
                message="Workflow actions require an active subscription. Subscribe to run, edit, and manage workflows."
                onUpgradeClick={() => openSubscriptionModal()}
              />
            )}
          </div>
        </PageItem>

        {/* Workflow Intelligence Overview */}
        <PageItem>
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Workflow Intelligence Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Trigger Type</p>
                  <p className="text-foreground font-medium">
                    {workflow.trigger ? (typeof workflow.trigger === 'object' ? JSON.stringify(workflow.trigger).slice(0, 20) : String(workflow.trigger)) : "Not configured"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Actions Count</p>
                  <p className="text-foreground font-medium">
                    {workflow.actions && Array.isArray(workflow.actions) ? workflow.actions.length : 0} steps
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Modified</p>
                  <p className="text-foreground font-medium">{formatDate(workflow.updated_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Executions</p>
                  <p className="text-foreground font-medium text-green-400">{executions.length} total</p>
                </div>
              </div>
              
              {/* Synth Insight */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Synth Insight:</span>{" "}
                  {executions.length > 0 
                    ? "This automation has execution history. Review recent runs to optimize performance."
                    : "This automation is ready to run. Execute it to generate insights."}
                </p>
              </div>
            </CardContent>
          </Card>
        </PageItem>

        {/* Workflow Structure */}
        {workflowSteps.length > 0 && (
          <PageItem>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Workflow Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-8">
                  {workflowSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      className="relative pb-6 last:pb-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Connecting Line */}
                      {index < workflowSteps.length - 1 && (
                        <div className="absolute left-[-20px] top-8 w-px h-[calc(100%-16px)] bg-gradient-to-b from-primary/50 to-primary/20" />
                      )}
                      
                      {/* Step Node */}
                      <div className="absolute left-[-28px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        {step.type === "trigger" ? (
                          <Zap className="w-2 h-2 text-primary" />
                        ) : (
                          <span className="text-[10px] text-primary font-bold">{index}</span>
                        )}
                      </div>
                      
                      {/* Step Card */}
                      <motion.div 
                        className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
                        whileHover={{ x: 4, boxShadow: "0 0 20px rgba(26, 106, 255, 0.1)" }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            {step.type === "trigger" ? "Trigger" : `Step ${index}`}
                          </span>
                        </div>
                        <p className="text-foreground mt-1">{step.label}</p>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PageItem>
        )}

        {/* Recent Executions */}
        <PageItem>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    This automation has not run yet. Execute it to generate insights.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {executions.slice(0, 5).map((exec) => (
                    <motion.div
                      key={exec.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30 hover:border-primary/20 hover:bg-card/50 transition-all duration-300 group cursor-pointer"
                      whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}
                      onClick={() => setExpandedExecution(
                        expandedExecution === exec.id ? null : exec.id
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant={getStatusVariant(exec.status) as any}>
                          {exec.status === "success" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {exec.status === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                          {exec.status === "success" ? "Success" : exec.status === "error" ? "Error" : exec.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{formatDateTime(exec.created_at)}</span>
                        {exec.finished_at && (
                          <span className="text-sm text-muted-foreground font-mono">
                            {Math.round((new Date(exec.finished_at).getTime() - new Date(exec.created_at).getTime()) / 1000)}s
                          </span>
                        )}
                      </div>
                      <button className="opacity-70 group-hover:opacity-100 transition-opacity">
                        {expandedExecution === exec.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                  
                  {expandedExecution && executions.find(e => e.id === expandedExecution) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-4 p-4 rounded-lg bg-card/50 border border-border/30"
                    >
                      {(() => {
                        const exec = executions.find(e => e.id === expandedExecution);
                        if (!exec) return null;
                        return (
                          <>
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Input Data</h4>
                              <pre className="bg-background/40 p-3 rounded-lg text-xs font-mono text-foreground overflow-x-auto">
                                {exec.input_data ? JSON.stringify(exec.input_data, null, 2) : "null"}
                              </pre>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Output Data</h4>
                              <pre className="bg-background/40 p-3 rounded-lg text-xs font-mono text-foreground overflow-x-auto">
                                {exec.output_data ? JSON.stringify(exec.output_data, null, 2) : "null"}
                              </pre>
                            </div>

                            {exec.error_message && (
                              <div className="p-3 rounded-lg bg-red-900/20 border border-red-700">
                                <h4 className="text-sm font-medium text-red-400 mb-1">Error Message</h4>
                                <p className="text-sm text-red-400">{exec.error_message}</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </PageItem>
      </PageTransition>

      {/* Run Dialog */}
      <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Input Data (optional JSON)</Label>
              <Textarea
                placeholder='{"key": "value"}'
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className={`font-mono text-sm min-h-[120px] ${inputDataError ? "border-red-500" : ""}`}
              />
              {inputDataError && <p className="text-xs text-red-400">{inputDataError}</p>}
              <p className="text-xs text-muted-foreground">
                Leave empty to run with no input data.
              </p>
            </div>

            {lastExecution && (
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
                <h4 className="text-sm font-medium text-green-400 mb-2">Execution Result</h4>
                <div className="space-y-1 text-xs text-foreground">
                  <p>ID: <span className="font-mono">{lastExecution.id}</span></p>
                  <p>Status: <span className="text-green-400">{lastExecution.status}</span></p>
                  <p>Finished: {formatDateTime(lastExecution.finished_at)}</p>
                </div>
                <pre className="mt-2 bg-background/40 p-2 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(lastExecution.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRunDialogOpen(false)}>
              {lastExecution ? "Close" : "Cancel"}
            </Button>
            {!lastExecution && (
              <Button onClick={handleRun} disabled={isRunning}>
                {isRunning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />Run</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflow.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
