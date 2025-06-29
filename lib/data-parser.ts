import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Client, Worker, Task } from './data-context';
import { getGeminiInstance } from './gemini-ai';

export interface ParsedData {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  errors: string[];
}

interface FileData {
  headers: string[];
  rows: any[][];
}

// Expected headers for each entity type
const EXPECTED_HEADERS = {
  clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
  workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
  tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
};

export async function parseFile(file: File): Promise<FileData> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload CSV or XLSX files.');
  }
}

async function parseCSV(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          return;
        }
        
        const data = results.data as string[][];
        if (data.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }
        
        const headers = data[0];
        const rows = data.slice(1).filter(row => row.some(cell => cell.trim() !== ''));
        
        resolve({ headers, rows });
      },
      error: (error) => reject(error),
      skipEmptyLines: true
    });
  });
}

async function parseExcel(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }
        
        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell && cell.toString().trim() !== ''));
        
        resolve({ headers, rows });
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function intelligentHeaderMapping(headers: string[], entityType: keyof typeof EXPECTED_HEADERS, geminiApiKey?: string): Promise<Record<string, number>> {
  const expectedHeaders = EXPECTED_HEADERS[entityType];
  const mapping: Record<string, number> = {};
  
  // First, try exact matches (case-insensitive)
  for (const expectedHeader of expectedHeaders) {
    const index = headers.findIndex(h => 
      h.toLowerCase().trim() === expectedHeader.toLowerCase()
    );
    if (index !== -1) {
      mapping[expectedHeader] = index;
    }
  }
  
  // If we have Gemini API key and missing headers, use AI for intelligent mapping
  if (geminiApiKey && Object.keys(mapping).length < expectedHeaders.length) {
    try {
      const gemini = getGeminiInstance(geminiApiKey);
      const unmappedHeaders = expectedHeaders.filter(h => !(h in mapping));
      const availableHeaders = headers.filter((_, i) => !Object.values(mapping).includes(i));
      
      if (unmappedHeaders.length > 0 && availableHeaders.length > 0) {
        const aiMapping = await gemini.generateContent(`
          Map these file headers to expected database columns:
          
          File headers: ${availableHeaders.join(', ')}
          Expected columns: ${unmappedHeaders.join(', ')}
          
          Return a JSON object mapping expected columns to file header names.
          Only map headers that are clearly related. Return {} if no clear mappings exist.
          
          Example: {"ClientID": "ID", "ClientName": "Name", "PriorityLevel": "Priority"}
        `);
        
        try {
          const aiMappingObj = JSON.parse(aiMapping.trim());
          for (const [expectedHeader, fileHeader] of Object.entries(aiMappingObj)) {
            const index = headers.findIndex(h => h === fileHeader);
            if (index !== -1 && expectedHeaders.includes(expectedHeader)) {
              mapping[expectedHeader] = index;
            }
          }
        } catch (e) {
          console.warn('Failed to parse AI mapping response');
        }
      }
    } catch (error) {
      console.warn('AI header mapping failed:', error);
    }
  }
  
  return mapping;
}

export function convertToClients(data: FileData, mapping: Record<string, number>): Client[] {
  return data.rows.map((row, index) => {
    const client: Client = {
      ClientID: row[mapping.ClientID] || `CLIENT_${index + 1}`,
      ClientName: row[mapping.ClientName] || `Client ${index + 1}`,
      PriorityLevel: parseInt(row[mapping.PriorityLevel]) || 1,
      RequestedTaskIDs: parseStringArray(row[mapping.RequestedTaskIDs]),
      GroupTag: row[mapping.GroupTag] || '',
      AttributesJSON: row[mapping.AttributesJSON] || '{}',
      _errors: []
    };
    return client;
  });
}

export function convertToWorkers(data: FileData, mapping: Record<string, number>): Worker[] {
  return data.rows.map((row, index) => {
    const worker: Worker = {
      WorkerID: row[mapping.WorkerID] || `WORKER_${index + 1}`,
      WorkerName: row[mapping.WorkerName] || `Worker ${index + 1}`,
      Skills: parseStringArray(row[mapping.Skills]),
      AvailableSlots: parseNumberArray(row[mapping.AvailableSlots]),
      MaxLoadPerPhase: parseInt(row[mapping.MaxLoadPerPhase]) || 1,
      WorkerGroup: row[mapping.WorkerGroup] || '',
      QualificationLevel: parseInt(row[mapping.QualificationLevel]) || 1,
      _errors: []
    };
    return worker;
  });
}

export function convertToTasks(data: FileData, mapping: Record<string, number>): Task[] {
  return data.rows.map((row, index) => {
    const task: Task = {
      TaskID: row[mapping.TaskID] || `TASK_${index + 1}`,
      TaskName: row[mapping.TaskName] || `Task ${index + 1}`,
      Category: row[mapping.Category] || '',
      Duration: parseInt(row[mapping.Duration]) || 1,
      RequiredSkills: parseStringArray(row[mapping.RequiredSkills]),
      PreferredPhases: parsePhases(row[mapping.PreferredPhases]),
      MaxConcurrent: parseInt(row[mapping.MaxConcurrent]) || 1,
      _errors: []
    };
    return task;
  });
}

function parseStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  
  const str = String(value).trim();
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      return JSON.parse(str);
    } catch {
      // Fallback to comma-separated parsing
    }
  }
  
  return str.split(',').map(s => s.trim()).filter(s => s);
}

function parseNumberArray(value: any): number[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(Number).filter(n => !isNaN(n));
  
  const str = String(value).trim();
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      return JSON.parse(str).map(Number);
    } catch {
      // Fallback to comma-separated parsing
    }
  }
  
  return str.split(',').map(s => {
    const num = parseInt(s.trim());
    return isNaN(num) ? 0 : num;
  }).filter(n => n > 0);
}

function parsePhases(value: any): number[] {
  if (!value) return [];
  
  const str = String(value).trim();
  
  // Handle range format like "1-3"
  if (str.includes('-')) {
    const [start, end] = str.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(start) && !isNaN(end)) {
      const result = [];
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
      return result;
    }
  }
  
  return parseNumberArray(value);
}