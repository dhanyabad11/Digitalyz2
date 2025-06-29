import { Client, Worker, Task, ValidationError } from './data-context';

export class ValidationEngine {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];

  setData(clients: Client[], workers: Worker[], tasks: Task[]) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
  }

  validateAll(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Core validations
    errors.push(...this.validateMissingRequiredColumns());
    errors.push(...this.validateDuplicateIDs());
    errors.push(...this.validateMalformedLists());
    errors.push(...this.validateOutOfRangeValues());
    errors.push(...this.validateBrokenJSON());
    errors.push(...this.validateUnknownReferences());
    errors.push(...this.validateCircularCoRunGroups());
    errors.push(...this.validateOverloadedWorkers());
    errors.push(...this.validatePhaseSlotSaturation());
    errors.push(...this.validateSkillCoverageMatrix());
    errors.push(...this.validateMaxConcurrencyFeasibility());
    errors.push(...this.validateConflictingRules());

    return errors;
  }

  private validateMissingRequiredColumns(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check required client fields
    this.clients.forEach(client => {
      if (!client.ClientID) {
        errors.push({
          id: `missing-client-id-${Math.random()}`,
          type: 'missing_required_field',
          entity: 'clients',
          entityId: client.ClientID || 'unknown',
          field: 'ClientID',
          message: 'ClientID is required',
          severity: 'error'
        });
      }
      if (!client.ClientName) {
        errors.push({
          id: `missing-client-name-${Math.random()}`,
          type: 'missing_required_field',
          entity: 'clients',
          entityId: client.ClientID,
          field: 'ClientName',
          message: 'ClientName is required',
          severity: 'error'
        });
      }
    });

    // Check required worker fields
    this.workers.forEach(worker => {
      if (!worker.WorkerID) {
        errors.push({
          id: `missing-worker-id-${Math.random()}`,
          type: 'missing_required_field',
          entity: 'workers',
          entityId: worker.WorkerID || 'unknown',
          field: 'WorkerID',
          message: 'WorkerID is required',
          severity: 'error'
        });
      }
      if (!worker.WorkerName) {
        errors.push({
          id: `missing-worker-name-${Math.random()}`,
          type: 'missing_required_field',
          entity: 'workers',
          entityId: worker.WorkerID,
          field: 'WorkerName',
          message: 'WorkerName is required',
          severity: 'error'
        });
      }
    });

    // Check required task fields
    this.tasks.forEach(task => {
      if (!task.TaskID) {
        errors.push({
          id: `missing-task-id-${Math.random()}`,
          type: 'missing_required_field',
          entity: 'tasks',
          entityId: task.TaskID || 'unknown',
          field: 'TaskID',
          message: 'TaskID is required',
          severity: 'error'
        });
      }
      if (!task.TaskName) {
        errors.push({
          id: `missing-task-name-${Math.random()}`,
          type: 'missing_required_field',
          entity: 'tasks',
          entityId: task.TaskID,
          field: 'TaskName',
          message: 'TaskName is required',
          severity: 'error'
        });
      }
    });

    return errors;
  }

  private validateDuplicateIDs(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check duplicate ClientIDs
    const clientIds = new Set<string>();
    this.clients.forEach(client => {
      if (clientIds.has(client.ClientID)) {
        errors.push({
          id: `duplicate-client-${client.ClientID}`,
          type: 'duplicate_id',
          entity: 'clients',
          entityId: client.ClientID,
          field: 'ClientID',
          message: `Duplicate ClientID: ${client.ClientID}`,
          severity: 'error'
        });
      }
      clientIds.add(client.ClientID);
    });

    // Check duplicate WorkerIDs
    const workerIds = new Set<string>();
    this.workers.forEach(worker => {
      if (workerIds.has(worker.WorkerID)) {
        errors.push({
          id: `duplicate-worker-${worker.WorkerID}`,
          type: 'duplicate_id',
          entity: 'workers',
          entityId: worker.WorkerID,
          field: 'WorkerID',
          message: `Duplicate WorkerID: ${worker.WorkerID}`,
          severity: 'error'
        });
      }
      workerIds.add(worker.WorkerID);
    });

    // Check duplicate TaskIDs
    const taskIds = new Set<string>();
    this.tasks.forEach(task => {
      if (taskIds.has(task.TaskID)) {
        errors.push({
          id: `duplicate-task-${task.TaskID}`,
          type: 'duplicate_id',
          entity: 'tasks',
          entityId: task.TaskID,
          field: 'TaskID',
          message: `Duplicate TaskID: ${task.TaskID}`,
          severity: 'error'
        });
      }
      taskIds.add(task.TaskID);
    });

    return errors;
  }

  private validateMalformedLists(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.workers.forEach(worker => {
      if (!Array.isArray(worker.AvailableSlots)) {
        errors.push({
          id: `malformed-slots-${worker.WorkerID}`,
          type: 'malformed_list',
          entity: 'workers',
          entityId: worker.WorkerID,
          field: 'AvailableSlots',
          message: 'AvailableSlots must be an array of numbers',
          severity: 'error'
        });
      } else {
        worker.AvailableSlots.forEach(slot => {
          if (!Number.isInteger(slot) || slot < 1) {
            errors.push({
              id: `invalid-slot-${worker.WorkerID}-${slot}`,
              type: 'malformed_list',
              entity: 'workers',
              entityId: worker.WorkerID,
              field: 'AvailableSlots',
              message: `Invalid slot value: ${slot}. Must be positive integer`,
              severity: 'error'
            });
          }
        });
      }
    });

    return errors;
  }

  private validateOutOfRangeValues(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate PriorityLevel (1-5)
    this.clients.forEach(client => {
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        errors.push({
          id: `invalid-priority-${client.ClientID}`,
          type: 'out_of_range',
          entity: 'clients',
          entityId: client.ClientID,
          field: 'PriorityLevel',
          message: `PriorityLevel must be between 1 and 5, got ${client.PriorityLevel}`,
          severity: 'error'
        });
      }
    });

    // Validate Task Duration (>= 1)
    this.tasks.forEach(task => {
      if (task.Duration < 1) {
        errors.push({
          id: `invalid-duration-${task.TaskID}`,
          type: 'out_of_range',
          entity: 'tasks',
          entityId: task.TaskID,
          field: 'Duration',
          message: `Duration must be at least 1, got ${task.Duration}`,
          severity: 'error'
        });
      }
    });

    // Validate MaxLoadPerPhase (>= 1)
    this.workers.forEach(worker => {
      if (worker.MaxLoadPerPhase < 1) {
        errors.push({
          id: `invalid-load-${worker.WorkerID}`,
          type: 'out_of_range',
          entity: 'workers',
          entityId: worker.WorkerID,
          field: 'MaxLoadPerPhase',
          message: `MaxLoadPerPhase must be at least 1, got ${worker.MaxLoadPerPhase}`,
          severity: 'error'
        });
      }
    });

    return errors;
  }

  private validateBrokenJSON(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.clients.forEach(client => {
      try {
        JSON.parse(client.AttributesJSON);
      } catch {
        errors.push({
          id: `broken-json-${client.ClientID}`,
          type: 'broken_json',
          entity: 'clients',
          entityId: client.ClientID,
          field: 'AttributesJSON',
          message: 'Invalid JSON format in AttributesJSON',
          severity: 'error'
        });
      }
    });

    return errors;
  }

  private validateUnknownReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    const taskIds = new Set(this.tasks.map(t => t.TaskID));

    this.clients.forEach(client => {
      client.RequestedTaskIDs.forEach(taskId => {
        if (!taskIds.has(taskId)) {
          errors.push({
            id: `unknown-task-${client.ClientID}-${taskId}`,
            type: 'unknown_reference',
            entity: 'clients',
            entityId: client.ClientID,
            field: 'RequestedTaskIDs',
            message: `Referenced TaskID '${taskId}' does not exist`,
            severity: 'error'
          });
        }
      });
    });

    return errors;
  }

  private validateCircularCoRunGroups(): ValidationError[] {
    // This would require rule definitions which aren't available in base data
    // Placeholder for when rules are implemented
    return [];
  }

  private validateOverloadedWorkers(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.workers.forEach(worker => {
      if (worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
        errors.push({
          id: `overloaded-worker-${worker.WorkerID}`,
          type: 'overloaded_worker',
          entity: 'workers',
          entityId: worker.WorkerID,
          field: 'MaxLoadPerPhase',
          message: `MaxLoadPerPhase (${worker.MaxLoadPerPhase}) exceeds available slots (${worker.AvailableSlots.length})`,
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  private validatePhaseSlotSaturation(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Calculate total worker capacity per phase
    const phaseCapacity: Record<number, number> = {};
    this.workers.forEach(worker => {
      worker.AvailableSlots.forEach(phase => {
        phaseCapacity[phase] = (phaseCapacity[phase] || 0) + worker.MaxLoadPerPhase;
      });
    });

    // Calculate task demand per phase
    const phaseDemand: Record<number, number> = {};
    this.tasks.forEach(task => {
      task.PreferredPhases.forEach(phase => {
        phaseDemand[phase] = (phaseDemand[phase] || 0) + task.Duration;
      });
    });

    // Check for oversaturation
    Object.keys(phaseDemand).forEach(phaseStr => {
      const phase = parseInt(phaseStr);
      const demand = phaseDemand[phase];
      const capacity = phaseCapacity[phase] || 0;
      
      if (demand > capacity) {
        errors.push({
          id: `phase-saturation-${phase}`,
          type: 'phase_saturation',
          entity: 'system',
          entityId: 'system',
          field: 'phase_capacity',
          message: `Phase ${phase} is oversaturated: demand (${demand}) exceeds capacity (${capacity})`,
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  private validateSkillCoverageMatrix(): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Get all unique skills from workers
    const workerSkills = new Set<string>();
    this.workers.forEach(worker => {
      worker.Skills.forEach(skill => workerSkills.add(skill));
    });

    // Check if all required task skills are covered
    this.tasks.forEach(task => {
      task.RequiredSkills.forEach(skill => {
        if (!workerSkills.has(skill)) {
          errors.push({
            id: `missing-skill-${task.TaskID}-${skill}`,
            type: 'skill_coverage',
            entity: 'tasks',
            entityId: task.TaskID,
            field: 'RequiredSkills',
            message: `Required skill '${skill}' is not available in any worker`,
            severity: 'error'
          });
        }
      });
    });

    return errors;
  }

  private validateMaxConcurrencyFeasibility(): ValidationError[] {
    const errors: ValidationError[] = [];

    this.tasks.forEach(task => {
      // Count workers who have all required skills
      const qualifiedWorkers = this.workers.filter(worker =>
        task.RequiredSkills.every(skill => worker.Skills.includes(skill))
      ).length;

      if (task.MaxConcurrent > qualifiedWorkers) {
        errors.push({
          id: `infeasible-concurrency-${task.TaskID}`,
          type: 'max_concurrency',
          entity: 'tasks',
          entityId: task.TaskID,
          field: 'MaxConcurrent',
          message: `MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers})`,
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  private validateConflictingRules(): ValidationError[] {
    // This would require rule definitions which aren't available in base data
    // Placeholder for when rules are implemented
    return [];
  }
}