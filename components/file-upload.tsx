'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Brain } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { parseFile, intelligentHeaderMapping, convertToClients, convertToWorkers, convertToTasks } from '@/lib/data-parser';
import { toast } from 'sonner';

export function FileUpload() {
  const { state, dispatch } = useData();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'uploading' | 'success' | 'error'>>({});
  const [geminiKey, setGeminiKey] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const fileName = file.name;
      setFileStatuses(prev => ({ ...prev, [fileName]: 'uploading' }));
      setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileName] || 0;
            if (current < 90) {
              return { ...prev, [fileName]: current + 10 };
            }
            return prev;
          });
        }, 100);

        // Parse file
        const parsedData = await parseFile(file);
        const entityType = detectEntityType(fileName, parsedData.headers);
        
        if (!entityType) {
          throw new Error('Could not determine entity type from file name or headers');
        }

        // Use AI for intelligent header mapping if Gemini key is provided
        const mapping = await intelligentHeaderMapping(
          parsedData.headers, 
          entityType, 
          geminiKey || state.geminiApiKey
        );

        // Convert data based on entity type
        let convertedData;
        switch (entityType) {
          case 'clients':
            convertedData = convertToClients(parsedData, mapping);
            dispatch({ type: 'SET_CLIENTS', payload: convertedData });
            break;
          case 'workers':
            convertedData = convertToWorkers(parsedData, mapping);
            dispatch({ type: 'SET_WORKERS', payload: convertedData });
            break;
          case 'tasks':
            convertedData = convertToTasks(parsedData, mapping);
            dispatch({ type: 'SET_TASKS', payload: convertedData });
            break;
        }

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        setFileStatuses(prev => ({ ...prev, [fileName]: 'success' }));
        
        toast.success(`Successfully uploaded ${entityType} data`, {
          description: `Processed ${convertedData.length} records with AI-powered header mapping`
        });

      } catch (error) {
        setFileStatuses(prev => ({ ...prev, [fileName]: 'error' }));
        toast.error('Upload failed', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }
  }, [dispatch, geminiKey, state.geminiApiKey]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const saveGeminiKey = () => {
    if (geminiKey.trim()) {
      dispatch({ type: 'SET_GEMINI_API_KEY', payload: geminiKey.trim() });
      toast.success('Gemini API key saved', {
        description: 'AI features are now enabled for intelligent data processing'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Gemini API Key Input */}
      <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">AI Enhancement</h3>
              <p className="text-sm text-purple-700">
                Provide your Gemini API key to enable intelligent header mapping and AI-powered features
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="gemini-key" className="sr-only">Gemini API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="Enter your Gemini API key (optional)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button onClick={saveGeminiKey} disabled={!geminiKey.trim()}>
              <Brain className="w-4 h-4 mr-2" />
              Enable AI
            </Button>
          </div>
          {state.geminiApiKey && (
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
              AI features enabled
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              cursor-pointer transition-all duration-200 rounded-lg border-2 border-dashed p-8 text-center
              ${isDragActive 
                ? 'border-blue-500 bg-blue-100' 
                : 'border-blue-300 hover:border-blue-400 hover:bg-blue-100/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {isDragActive ? 'Drop your files here' : 'Upload your data files'}
                </h3>
                <p className="text-blue-700 mt-1">
                  Drag and drop CSV or XLSX files for clients, workers, and tasks
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Status */}
      {Object.keys(uploadProgress).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Upload Status</h3>
            <div className="space-y-4">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-sm font-medium">{fileName}</span>
                      {fileStatuses[fileName] === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      {fileStatuses[fileName] === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Data Summary */}
      {(state.clients.length > 0 || state.workers.length > 0 || state.tasks.length > 0) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Loaded Data Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{state.clients.length}</div>
                <div className="text-sm text-blue-800">Clients</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{state.workers.length}</div>
                <div className="text-sm text-emerald-800">Workers</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{state.tasks.length}</div>
                <div className="text-sm text-orange-800">Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function detectEntityType(fileName: string, headers: string[]): 'clients' | 'workers' | 'tasks' | null {
  const name = fileName.toLowerCase();
  
  // Check filename first
  if (name.includes('client')) return 'clients';
  if (name.includes('worker')) return 'workers';
  if (name.includes('task')) return 'tasks';
  
  // Check headers
  const headerSet = new Set(headers.map(h => h.toLowerCase()));
  
  if (headerSet.has('clientid') || headerSet.has('client_id')) return 'clients';
  if (headerSet.has('workerid') || headerSet.has('worker_id')) return 'workers';
  if (headerSet.has('taskid') || headerSet.has('task_id')) return 'tasks';
  
  return null;
}