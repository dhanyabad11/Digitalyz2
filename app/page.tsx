'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/file-upload';
import { DataGrid } from '@/components/data-grid';
import { ValidationPanel } from '@/components/validation-panel';
import { RuleBuilder } from '@/components/rule-builder';
import { PrioritizationPanel } from '@/components/prioritization-panel';
import { NaturalLanguageQuery } from '@/components/natural-language-query';
import { ExportPanel } from '@/components/export-panel';
import { Button } from '@/components/ui/button';
import { Brain, Database, Settings, Download, Sparkles } from 'lucide-react';
import { DataProvider } from '@/lib/data-context';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <DataProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Data Alchemist
                </h1>
                <p className="text-slate-600 text-lg">
                  AI-Powered Resource Allocation Configurator
                </p>
              </div>
            </div>
            <p className="text-slate-700 max-w-3xl">
              Transform messy spreadsheets into clean, validated data with intelligent parsing, 
              real-time validation, and AI-powered rule generation. Upload your CSV/XLSX files 
              and let our AI help you create perfect resource allocation configurations.
            </p>
          </div>

          {/* Main Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Database className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Brain className="w-4 h-4" />
                Data & AI
              </TabsTrigger>
              <TabsTrigger value="validation" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Settings className="w-4 h-4" />
                Validation
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Sparkles className="w-4 h-4" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="priorities" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Settings className="w-4 h-4" />
                Priorities
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Download className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    Data Ingestion
                  </CardTitle>
                  <CardDescription>
                    Upload your CSV or XLSX files for clients, workers, and tasks. 
                    Our AI will intelligently parse and map columns even with non-standard headers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <div className="grid gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-emerald-600" />
                      Natural Language Query
                    </CardTitle>
                    <CardDescription>
                      Search your data using plain English. Try queries like "Show me all high priority clients" 
                      or "Find workers with skills in AI and available in phase 2".
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NaturalLanguageQuery />
                  </CardContent>
                </Card>
                
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>
                      View and edit your data with real-time validation and AI-powered suggestions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataGrid />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    Validation & Quality Control
                  </CardTitle>
                  <CardDescription>
                    Comprehensive validation engine with 12+ validation rules and AI-powered error detection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ValidationPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Rule Builder
                  </CardTitle>
                  <CardDescription>
                    Create business rules using our intuitive interface or natural language. 
                    Generate comprehensive rule configurations for your allocation system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RuleBuilder />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priorities" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    Prioritization & Weights
                  </CardTitle>
                  <CardDescription>
                    Configure how the allocation system should balance different criteria and constraints.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PrioritizationPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-600" />
                    Export Configuration
                  </CardTitle>
                  <CardDescription>
                    Download your cleaned, validated data and complete rule configuration for the allocation system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExportPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DataProvider>
  );
}