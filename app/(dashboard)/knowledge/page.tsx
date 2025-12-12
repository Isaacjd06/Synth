"use client";

import { PageTransition } from "@/components/app/PageTransition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StructuredContextSection from "@/components/knowledge/StructuredContextSection";
import UnstructuredKnowledgeSection from "@/components/knowledge/UnstructuredKnowledgeSection";
import BusinessRulesSection from "@/components/knowledge/BusinessRulesSection";
import GlossarySection from "@/components/knowledge/GlossarySection";
import FileUploadSection from "@/components/knowledge/FileUploadSection";
import KnowledgeSuggestions from "@/components/knowledge/KnowledgeSuggestions";

export default function KnowledgePage() {
  return (
    <PageTransition className="max-w-7xl mx-auto">
      <div className="space-y-6 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
          Knowledge & Context
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-3xl">
          This is where you teach Synth about your business, systems, processes, definitions, 
          preferences, and rules. The more information you provide, the better Synth performs.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="structured" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="structured">Profile</TabsTrigger>
              <TabsTrigger value="unstructured">Notes</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <TabsContent value="structured">
              <StructuredContextSection />
            </TabsContent>

            <TabsContent value="unstructured">
              <UnstructuredKnowledgeSection />
            </TabsContent>

            <TabsContent value="rules">
              <BusinessRulesSection />
            </TabsContent>

            <TabsContent value="glossary">
              <GlossarySection />
            </TabsContent>

            <TabsContent value="files">
              <FileUploadSection />
            </TabsContent>
          </Tabs>
        </div>

        {/* Suggestions Sidebar */}
        <div className="lg:w-80 shrink-0">
          <KnowledgeSuggestions />
        </div>
        </div>
      </div>
      </PageTransition>
  );
}

