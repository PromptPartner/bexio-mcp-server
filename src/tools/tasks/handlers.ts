/**
 * Tasks tool handlers.
 * Implements the logic for each tasks tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListTasksParamsSchema,
  GetTaskParamsSchema,
  CreateTaskParamsSchema,
  UpdateTaskParamsSchema,
  DeleteTaskParamsSchema,
  SearchTasksParamsSchema,
  ListTaskPrioritiesParamsSchema,
  ListTaskStatusesParamsSchema,
  RESOURCE_TYPE_MAP,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_tasks: async (client, args) => {
    const params = ListTasksParamsSchema.parse(args);
    const queryParams: Record<string, unknown> = {
      limit: params.limit,
      offset: params.offset,
    };
    if (params.order_by) queryParams.order_by = params.order_by;
    if (params.user_id) queryParams.user_id = params.user_id;
    return client.listTasks(queryParams);
  },

  get_task: async (client, args) => {
    const { task_id } = GetTaskParamsSchema.parse(args);
    const task = await client.getTask(task_id);
    if (!task) {
      throw McpError.notFound("Task", task_id);
    }
    return task;
  },

  create_task: async (client, args) => {
    const params = CreateTaskParamsSchema.parse(args);
    const payload: Record<string, unknown> = {
      subject: params.subject,
      user_id: params.user_id,
    };
    if (params.description) payload.description = params.description;
    if (params.finish_date) payload.finish_date = params.finish_date;
    // bexio's task fields are todo_priority_id / todo_status_id; task_* is ignored.
    if (params.task_priority_id) payload.todo_priority_id = params.task_priority_id;
    if (params.task_status_id) payload.todo_status_id = params.task_status_id;
    if (params.info) payload.info = params.info;
    if (params.resource_type) {
      payload.module_id = RESOURCE_TYPE_MAP[params.resource_type];
      if (params.resource_id) payload.entry_id = params.resource_id;
    }
    return client.createTask(payload);
  },

  update_task: async (client, args) => {
    const { task_id, task_data } = UpdateTaskParamsSchema.parse(args);
    return client.updateTask(task_id, task_data);
  },

  delete_task: async (client, args) => {
    const { task_id } = DeleteTaskParamsSchema.parse(args);
    return client.deleteTask(task_id);
  },

  search_tasks: async (client, args) => {
    const params = SearchTasksParamsSchema.parse(args);
    return client.searchTasks(params.search_criteria, { limit: params.limit });
  },

  list_task_priorities: async (client, args) => {
    ListTaskPrioritiesParamsSchema.parse(args);
    return client.listTaskPriorities();
  },

  list_task_statuses: async (client, args) => {
    ListTaskStatusesParamsSchema.parse(args);
    return client.listTaskStatuses();
  },
};
