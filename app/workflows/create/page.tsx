"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import JsonEditor from "@/components/ui/json-editor";
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from "@/lib/templates/workflowTemplates";

export default function CreateWorkflowPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missingApps, setMissingApps] = useState<string[] | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const router = useRouter();

  const validateJson = (jsonString: string): boolean => {
    if (!jsonString.trim()) {
      setJsonError("JSON cannot be empty");
      return false;
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      // Basic structure validation
      if (typeof parsed !== "object" || parsed === null) {
        setJsonError("JSON must be an object");
        return false;
      }

      if (!parsed.name) {
        setJsonError("JSON must include a 'name' field");
        return false;
      }

      setJsonError(null);
      return true;
    } catch (err: any) {
      setJsonError(`Invalid JSON: ${err.message}`);
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setSubmitError(null);
    setMissingApps(null);
    setDetails(null);
    
    // Clear JSON error if user is typing
    if (jsonError) {
      validateJson(value);
    }
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    const templateJson = JSON.stringify(template.json, null, 2);
    setJsonInput(templateJson);
    setJsonError(null);
    setSubmitError(null);
    setMissingApps(null);
    setDetails(null);
  };

  const handleGenerateDraft = async () => {
    if (!aiPrompt.trim()) {
      setGenerateError("Please enter a workflow description");
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setJsonError(null);
    setSubmitError(null);
    setMissingApps(null);
    setDetails(null);

    try {
      const res = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setGenerateError(data.error || "Failed to generate workflow draft");
        setGenerating(false);
        return;
      }

      // Inject generated draft into JSON editor
      const draftJson = JSON.stringify(data.draft, null, 2);
      setJsonInput(draftJson);
      setAiPrompt(""); // Clear the prompt
      setGenerating(false);
    } catch (err: any) {
      setGenerateError(err.message || "An error occurred while generating the workflow");
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setSubmitError(null);
    setMissingApps(null);
    setDetails(null);

    // Validate JSON
    if (!validateJson(jsonInput)) {
      return;
    }

    setLoading(true);

    try {
      const workflowData = JSON.parse(jsonInput);

      const res = await fetch("/api/workflows/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle error response
        setSubmitError(data.error || "Failed to create workflow");
        if (data.details) {
          setDetails(data.details);
        }
        if (data.missingApps) {
          setMissingApps(data.missingApps);
        }
        setLoading(false);
        return;
      }

      // Success - redirect to workflow detail page
      // API returns workflow object directly with id field
      const workflowId = data.id || (data.data && data.data.id);
      if (workflowId) {
        router.push(`/workflows/${workflowId}`);
      } else {
        setSubmitError("Workflow created but no ID returned");
        setLoading(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred while creating the workflow");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Create Workflow</h1>
          <p className="text-gray-400 text-sm">
            Use AI to generate a draft, select a template, or paste your workflow JSON below. The workflow will be validated before creation.
          </p>
        </div>

        {/* Template Selector Section */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">Workflow Templates</h2>
            <p className="text-sm text-gray-400">
              Select a template to pre-fill the workflow JSON.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="text-left p-4 border border-gray-700 rounded-md hover:border-[#194c92] hover:bg-gray-800/50 transition-colors"
              aria-label={`Select template: ${template.name}`}
            >
              <h3 className="font-semibold text-white mb-1">{template.name}</h3>
              <p className="text-sm text-gray-400">{template.description}</p>
            </button>
          ))}
          </div>
        </Card>

        {/* AI Draft Generator Section */}
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-1">Autopilot Mode (Draft Generator)</h2>
            <p className="text-sm text-gray-400">
              Describe your workflow in natural language and we'll generate a draft JSON for you.
            </p>
          </div>
          <div className="space-y-3">
            <textarea
            value={aiPrompt}
            onChange={(e) => {
              setAiPrompt(e.target.value);
              setGenerateError(null);
            }}
            placeholder='e.g., "When a new lead comes in, email them + notify Slack."'
              className="w-full h-24 p-3 bg-black/40 border border-gray-700 rounded-md text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#194c92] focus:border-[#194c92] resize-none"
            />
            {generateError && (
              <p className="text-sm text-red-400">{generateError}</p>
            )}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={handleGenerateDraft}
                loading={generating}
                disabled={generating || !aiPrompt.trim()}
              >
                Generate Workflow Draft
              </Button>
            </div>
          </div>
        </Card>

        {/* JSON Editor Section */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Workflow JSON</h2>
          <JsonEditor
            value={jsonInput}
            onChange={handleJsonChange}
            error={jsonError || undefined}
          />
        </Card>

        {/* Error Display */}
        {submitError && (
          <Card className="border-red-800 bg-red-900/10">
            <div className="space-y-2">
              <p className="text-red-400 font-medium">Error: {submitError}</p>
              {details && (
                <div>
                  <p className="text-sm text-gray-300 mb-1">Details:</p>
                  <pre className="text-xs text-gray-400 bg-black/40 p-3 rounded overflow-x-auto">
                    {typeof details === "string" ? details : JSON.stringify(details, null, 2)}
                  </pre>
                </div>
              )}
              {missingApps && missingApps.length > 0 && (
                <div>
                  <p className="text-sm text-gray-300 mb-1">Missing App Connections:</p>
                  <ul className="list-disc list-inside text-sm text-red-300">
                    {missingApps.map((app, idx) => (
                      <li key={idx}>{app}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || !jsonInput.trim()}
          >
            Create Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}

