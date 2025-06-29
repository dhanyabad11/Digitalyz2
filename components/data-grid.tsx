'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/lib/data-context';
import { Users, Briefcase, ListTodo, Edit, Save, X } from 'lucide-react';

export function DataGrid() {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('clients');
  const [editingCell, setEditingCell] = useState<{ entity: string; id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (entity: string, id: string, field: string, currentValue: any) => {
    setEditingCell({ entity, id, field });
    setEditValue(Array.isArray(currentValue) ? currentValue.join(', ') : String(currentValue || ''));
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { entity, id, field } = editingCell;
    let processedValue: any = editValue;

    // Process value based on field type
    if (field === 'RequestedTaskIDs' || field === 'Skills' || field === 'RequiredSkills') {
      processedValue = editValue.split(',').map(s => s.trim()).filter(s => s);
    } else if (field === 'AvailableSlots' || field === 'PreferredPhases') {
      processedValue = editValue.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    } else if (['PriorityLevel', 'MaxLoadPerPhase', 'QualificationLevel', 'Duration', 'MaxConcurrent'].includes(field)) {
      processedValue = parseInt(editValue) || 0;
    }

    // Dispatch update based on entity type
    if (entity === 'clients') {
      dispatch({ type: 'UPDATE_CLIENT', payload: { id, data: { [field]: processedValue } } });
    } else if (entity === 'workers') {
      dispatch({ type: 'UPDATE_WORKER', payload: { id, data: { [field]: processedValue } } });
    } else if (entity === 'tasks') {
      dispatch({ type: 'UPDATE_TASK', payload: { id, data: { [field]: processedValue } } });
    }

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const renderEditableCell = (entity: string, id: string, field: string, value: any, hasError: boolean = false) => {
    const isEditing = editingCell?.entity === entity && editingCell?.id === id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="sm" variant="ghost" onClick={saveEdit}>
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '');
    
    return (
      <div 
        className={`
          group cursor-pointer p-2 rounded border border-transparent hover:border-blue-200 hover:bg-blue-50
          ${hasError ? 'bg-red-50 border-red-200' : ''}
        `}
        onClick={() => startEdit(entity, id, field, value)}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs truncate flex-1">{displayValue}</span>
          <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const getEntityErrors = (entity: string, id: string) => {
    return state.validationErrors.filter(error => error.entity === entity && error.entityId === id);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clients ({state.clients.length})
          </TabsTrigger>
          <TabsTrigger value="workers" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Workers ({state.workers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Tasks ({state.tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {state.clients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No client data uploaded yet. Please upload a clients CSV or XLSX file.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {state.clients.map((client) => {
                const errors = getEntityErrors('clients', client.ClientID);
                return (
                  <Card key={client.ClientID} className={errors.length > 0 ? 'border-red-200' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{client.ClientName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={client.PriorityLevel >= 4 ? 'destructive' : 'secondary'}>
                            Priority {client.PriorityLevel}
                          </Badge>
                          {errors.length > 0 && (
                            <Badge variant="destructive">{errors.length} error{errors.length !== 1 ? 's' : ''}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Client ID</label>
                          {renderEditableCell('clients', client.ClientID, 'ClientID', client.ClientID, 
                            errors.some(e => e.field === 'ClientID'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Priority Level</label>
                          {renderEditableCell('clients', client.ClientID, 'PriorityLevel', client.PriorityLevel,
                            errors.some(e => e.field === 'PriorityLevel'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Group Tag</label>
                          {renderEditableCell('clients', client.ClientID, 'GroupTag', client.GroupTag)}
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-medium text-gray-700">Requested Tasks</label>
                          {renderEditableCell('clients', client.ClientID, 'RequestedTaskIDs', client.RequestedTaskIDs,
                            errors.some(e => e.field === 'RequestedTaskIDs'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Attributes JSON</label>
                          {renderEditableCell('clients', client.ClientID, 'AttributesJSON', client.AttributesJSON,
                            errors.some(e => e.field === 'AttributesJSON'))}
                        </div>
                      </div>
                      {errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                          <ul className="space-y-1">
                            {errors.map((error) => (
                              <li key={error.id} className="text-sm text-red-700">
                                • {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          {state.workers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No worker data uploaded yet. Please upload a workers CSV or XLSX file.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {state.workers.map((worker) => {
                const errors = getEntityErrors('workers', worker.WorkerID);
                return (
                  <Card key={worker.WorkerID} className={errors.length > 0 ? 'border-red-200' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{worker.WorkerName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Level {worker.QualificationLevel}
                          </Badge>
                          {errors.length > 0 && (
                            <Badge variant="destructive">{errors.length} error{errors.length !== 1 ? 's' : ''}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Worker ID</label>
                          {renderEditableCell('workers', worker.WorkerID, 'WorkerID', worker.WorkerID,
                            errors.some(e => e.field === 'WorkerID'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Max Load/Phase</label>
                          {renderEditableCell('workers', worker.WorkerID, 'MaxLoadPerPhase', worker.MaxLoadPerPhase,
                            errors.some(e => e.field === 'MaxLoadPerPhase'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Worker Group</label>
                          {renderEditableCell('workers', worker.WorkerID, 'WorkerGroup', worker.WorkerGroup)}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Skills</label>
                          {renderEditableCell('workers', worker.WorkerID, 'Skills', worker.Skills,
                            errors.some(e => e.field === 'Skills'))}
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-medium text-gray-700">Available Slots</label>
                          {renderEditableCell('workers', worker.WorkerID, 'AvailableSlots', worker.AvailableSlots,
                            errors.some(e => e.field === 'AvailableSlots'))}
                        </div>
                      </div>
                      {errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                          <ul className="space-y-1">
                            {errors.map((error) => (
                              <li key={error.id} className="text-sm text-red-700">
                                • {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {state.tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No task data uploaded yet. Please upload a tasks CSV or XLSX file.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {state.tasks.map((task) => {
                const errors = getEntityErrors('tasks', task.TaskID);
                return (
                  <Card key={task.TaskID} className={errors.length > 0 ? 'border-red-200' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{task.TaskName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {task.Duration} phase{task.Duration !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="secondary">
                            Max {task.MaxConcurrent}
                          </Badge>
                          {errors.length > 0 && (
                            <Badge variant="destructive">{errors.length} error{errors.length !== 1 ? 's' : ''}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Task ID</label>
                          {renderEditableCell('tasks', task.TaskID, 'TaskID', task.TaskID,
                            errors.some(e => e.field === 'TaskID'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Category</label>
                          {renderEditableCell('tasks', task.TaskID, 'Category', task.Category)}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Duration</label>
                          {renderEditableCell('tasks', task.TaskID, 'Duration', task.Duration,
                            errors.some(e => e.field === 'Duration'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Max Concurrent</label>
                          {renderEditableCell('tasks', task.TaskID, 'MaxConcurrent', task.MaxConcurrent,
                            errors.some(e => e.field === 'MaxConcurrent'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Required Skills</label>
                          {renderEditableCell('tasks', task.TaskID, 'RequiredSkills', task.RequiredSkills,
                            errors.some(e => e.field === 'RequiredSkills'))}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Preferred Phases</label>
                          {renderEditableCell('tasks', task.TaskID, 'PreferredPhases', task.PreferredPhases,
                            errors.some(e => e.field === 'PreferredPhases'))}
                        </div>
                      </div>
                      {errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                          <ul className="space-y-1">
                            {errors.map((error) => (
                              <li key={error.id} className="text-sm text-red-700">
                                • {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}