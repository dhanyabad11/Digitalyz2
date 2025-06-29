'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileSpreadsheet, 
  Settings, 
  CheckCircle2, 
  AlertTriangle,
  Package
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export function ExportPanel() {
  const { state } = useData();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const criticalErrors = state.validationErrors.filter(e => e.severity === 'error').length;
  const warnings = state.validationErrors.filter(e => e.severity === 'warning').length;
  const canExport = criticalErrors === 0;

  const exportData = async () => {
    if (!canExport) {
      toast.error('Cannot export with validation errors', {
        description: 'Please fix all critical errors before exporting'
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Clean data (remove error fields)
      const cleanClients = state.clients.map(({ _errors, ...client }) => client);
      const cleanWorkers = state.workers.map(({ _errors, ...worker }) => ({
        ...worker,
        Skills: worker.Skills.join(', '),
        AvailableSlots: worker.AvailableSlots.join(', ')
      }));
      const cleanTasks = state.tasks.map(({ _errors, ...task }) => ({
        ...task,
        RequiredSkills: task.RequiredSkills.join(', '),
        PreferredPhases: task.PreferredPhases.join(', ')
      }));

      // Add data sheets
      const clientsSheet = XLSX.utils.json_to_sheet(cleanClients);
      const workersSheet = XLSX.utils.json_to_sheet(cleanWorkers);
      const tasksSheet = XLSX.utils.json_to_sheet(cleanTasks);

      XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');
      XLSX.utils.book_append_sheet(workbook, workersSheet, 'Workers');
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

      // Export data file
      XLSX.writeFile(workbook, 'data-alchemist-cleaned-data.xlsx');

      // Create rules configuration
      const rulesConfig = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRules: state.rules.length,
          dataStats: {
            clients: state.clients.length,
            workers: state.workers.length,
            tasks: state.tasks.length
          }
        },
        priorities: state.priorities,
        rules: state.rules.map(rule => ({
          id: rule.id,
          type: rule.type,
          description: rule.description,
          config: rule.config,
          priority: rule.priority
        })),
        validationSummary: {
          totalErrors: state.validationErrors.length,
          criticalErrors,
          warnings,
          lastValidated: new Date().toISOString()
        }
      };

      // Export rules file
      const rulesBlob = new Blob([JSON.stringify(rulesConfig, null, 2)], {
        type: 'application/json'
      });
      const rulesUrl = URL.createObjectURL(rulesBlob);
      const rulesLink = document.createElement('a');
      rulesLink.href = rulesUrl;
      rulesLink.download = 'data-alchemist-rules-config.json';
      rulesLink.click();
      URL.revokeObjectURL(rulesUrl);

      clearInterval(progressInterval);
      setExportProgress(100);

      toast.success('Export completed successfully', {
        description: 'Downloaded cleaned data and rules configuration'
      });

      setTimeout(() => setExportProgress(0), 2000);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: 'An error occurred during export'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSampleData = () => {
    // Create sample data for testing
    const sampleClients = [
      {
        ClientID: 'C001',
        ClientName: 'Acme Corp',
        PriorityLevel: 4,
        RequestedTaskIDs: 'T001,T002',
        GroupTag: 'enterprise',
        AttributesJSON: '{"budget": 50000, "deadline": "2024-03-01"}'
      },
      {
        ClientID: 'C002',
        ClientName: 'Tech Solutions',
        PriorityLevel: 3,
        RequestedTaskIDs: 'T003,T004',
        GroupTag: 'standard',
        AttributesJSON: '{"budget": 25000, "deadline": "2024-04-01"}'
      }
    ];

    const sampleWorkers = [
      {
        WorkerID: 'W001',
        WorkerName: 'Alice Johnson',
        Skills: 'Python,AI,Machine Learning',
        AvailableSlots: '1,2,3',
        MaxLoadPerPhase: 2,
        WorkerGroup: 'AI Team',
        QualificationLevel: 5
      },
      {
        WorkerID: 'W002',
        WorkerName: 'Bob Smith',
        Skills: 'JavaScript,React,Node.js',
        AvailableSlots: '2,3,4',
        MaxLoadPerPhase: 3,
        WorkerGroup: 'Frontend Team',
        QualificationLevel: 4
      }
    ];

    const sampleTasks = [
      {
        TaskID: 'T001',
        TaskName: 'AI Model Development',
        Category: 'Development',
        Duration: 2,
        RequiredSkills: 'Python,AI',
        PreferredPhases: '1,2',
        MaxConcurrent: 1
      },
      {
        TaskID: 'T002',
        TaskName: 'Web Application',
        Category: 'Development',
        Duration: 3,
        RequiredSkills: 'JavaScript,React',
        PreferredPhases: '2,3,4',
        MaxConcurrent: 2
      }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sampleClients), 'Clients');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sampleWorkers), 'Workers');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sampleTasks), 'Tasks');
    
    XLSX.writeFile(workbook, 'data-alchemist-sample-data.xlsx');
    
    toast.success('Sample data exported', {
      description: 'Use this file to test the application'
    });
  };

  return (
    <div className="space-y-6">
      {/* Export Status */}
      <Card className={`border-2 ${canExport ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {canExport ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${canExport ? 'text-green-900' : 'text-red-900'}`}>
                {canExport ? 'Ready for Export' : 'Export Blocked'}
              </h3>
              <p className={`text-sm ${canExport ? 'text-green-700' : 'text-red-700'}`}>
                {canExport 
                  ? 'All critical validations passed. Your data is ready for export.'
                  : `${criticalErrors} critical error${criticalErrors !== 1 ? 's' : ''} must be fixed before export.`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{state.clients.length + state.workers.length + state.tasks.length}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-lg font-semibold">{state.clients.length + state.workers.length + state.tasks.length}</div>
            <div className="text-sm text-gray-600">Data Records</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-lg font-semibold">{state.rules.length}</div>
            <div className="text-sm text-gray-600">Business Rules</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-semibold">2</div>
            <div className="text-sm text-gray-600">Export Files</div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      {state.validationErrors.length > 0 && (
        <Alert className={criticalErrors > 0 ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}>
          <AlertTriangle className={`h-4 w-4 ${criticalErrors > 0 ? 'text-red-600' : 'text-orange-600'}`} />
          <AlertDescription className={criticalErrors > 0 ? 'text-red-800' : 'text-orange-800'}>
            <strong>Validation Summary:</strong> {criticalErrors} critical errors, {warnings} warnings.
            {criticalErrors > 0 && ' Please fix critical errors before exporting.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Export Progress */}
      {exportProgress > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Export Progress</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              Export Production Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Download your cleaned and validated data along with the complete rules configuration 
              for use in downstream allocation systems.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">📊 data-alchemist-cleaned-data.xlsx</Badge>
                <span className="text-sm text-gray-600">Cleaned client, worker, and task data</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">⚙️ data-alchemist-rules-config.json</Badge>
                <span className="text-sm text-gray-600">Complete rules and priority configuration</span>
              </div>
            </div>

            <Button 
              onClick={exportData} 
              disabled={!canExport || isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Package className="w-4 h-4 mr-2 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Complete Package
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Download sample data files to test the application or use as templates for your own data.
            </p>
            
            <Button 
              onClick={exportSampleData} 
              variant="outline"
              className="w-full"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Sample Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">After Export:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Use the cleaned data file in your resource allocation system</li>
              <li>Import the rules configuration to apply business logic</li>
              <li>Configure the allocation engine with your priority weights</li>
              <li>Run allocation algorithms with the validated constraints</li>
            </ol>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">File Formats:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>XLSX:</strong> Compatible with Excel, Google Sheets, and most data tools</li>
              <li>• <strong>JSON:</strong> Standard format for configuration and API integration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}