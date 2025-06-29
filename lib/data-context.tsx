'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string[];
  GroupTag: string;
  AttributesJSON: string;
  _errors?: string[];
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  AvailableSlots: number[];
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
  _errors?: string[];
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string[];
  PreferredPhases: number[];
  MaxConcurrent: number;
  _errors?: string[];
}

export interface Rule {
  id: string;
  type: string;
  description: string;
  config: any;
  priority: number;
}

export interface ValidationError {
  id: string;
  type: string;
  entity: string;
  entityId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DataState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: Rule[];
  validationErrors: ValidationError[];
  priorities: Record<string, number>;
  isLoading: boolean;
  geminiApiKey: string;
}

type DataAction =
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'SET_WORKERS'; payload: Worker[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_RULE'; payload: Rule }
  | { type: 'REMOVE_RULE'; payload: string }
  | { type: 'SET_VALIDATION_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_PRIORITIES'; payload: Record<string, number> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GEMINI_API_KEY'; payload: string }
  | { type: 'UPDATE_CLIENT'; payload: { id: string; data: Partial<Client> } }
  | { type: 'UPDATE_WORKER'; payload: { id: string; data: Partial<Worker> } }
  | { type: 'UPDATE_TASK'; payload: { id: string; data: Partial<Task> } };

const initialState: DataState = {
  clients: [],
  workers: [],
  tasks: [],
  rules: [],
  validationErrors: [],
  priorities: {
    priorityLevel: 0.3,
    requestFulfillment: 0.25,
    fairness: 0.2,
    efficiency: 0.15,
    skillMatch: 0.1,
  },
  isLoading: false,
  geminiApiKey: '',
};

function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };
    case 'SET_WORKERS':
      return { ...state, workers: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_RULE':
      return { ...state, rules: [...state.rules, action.payload] };
    case 'REMOVE_RULE':
      return { ...state, rules: state.rules.filter(rule => rule.id !== action.payload) };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'SET_PRIORITIES':
      return { ...state, priorities: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_GEMINI_API_KEY':
      return { ...state, geminiApiKey: action.payload };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(client =>
          client.ClientID === action.payload.id
            ? { ...client, ...action.payload.data }
            : client
        ),
      };
    case 'UPDATE_WORKER':
      return {
        ...state,
        workers: state.workers.map(worker =>
          worker.WorkerID === action.payload.id
            ? { ...worker, ...action.payload.data }
            : worker
        ),
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.TaskID === action.payload.id
            ? { ...task, ...action.payload.data }
            : task
        ),
      };
    default:
      return state;
  }
}

const DataContext = createContext<{
  state: DataState;
  dispatch: React.Dispatch<DataAction>;
} | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}