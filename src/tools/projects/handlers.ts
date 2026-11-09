/**
 * Projects tool handlers.
 * Implements the logic for each projects tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import { withRequiredFields } from "../../shared/merge.js";
import {
  // Projects
  ListProjectsParamsSchema,
  GetProjectParamsSchema,
  CreateProjectParamsSchema,
  UpdateProjectParamsSchema,
  DeleteProjectParamsSchema,
  ArchiveProjectParamsSchema,
  UnarchiveProjectParamsSchema,
  SearchProjectsParamsSchema,
  // Project Types
  ListProjectTypesParamsSchema,
  GetProjectTypeParamsSchema,
  // Project Statuses
  ListProjectStatusesParamsSchema,
  GetProjectStatusParamsSchema,
  // Milestones
  ListMilestonesParamsSchema,
  GetMilestoneParamsSchema,
  CreateMilestoneParamsSchema,
  DeleteMilestoneParamsSchema,
  // Work Packages
  ListWorkPackagesParamsSchema,
  GetWorkPackageParamsSchema,
  CreateWorkPackageParamsSchema,
  UpdateWorkPackageParamsSchema,
  DeleteWorkPackageParamsSchema,
  UpdateMilestoneParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== PROJECTS (PROJ-01) =====
  list_projects: async (client, args) => {
    const params = ListProjectsParamsSchema.parse(args);
    return client.listProjects(params);
  },

  get_project: async (client, args) => {
    const { project_id } = GetProjectParamsSchema.parse(args);
    const project = await client.getProject(project_id);
    if (!project) {
      throw McpError.notFound("Project", project_id);
    }
    return project;
  },

  create_project: async (client, args) => {
    const params = CreateProjectParamsSchema.parse(args);
    return client.createProject(params);
  },

  update_project: async (client, args) => {
    const { project_id, project_data } = UpdateProjectParamsSchema.parse(args);
    return client.updateProject(project_id, project_data);
  },

  delete_project: async (client, args) => {
    const { project_id } = DeleteProjectParamsSchema.parse(args);
    return client.deleteProject(project_id);
  },

  archive_project: async (client, args) => {
    const { project_id } = ArchiveProjectParamsSchema.parse(args);
    return client.archiveProject(project_id);
  },

  unarchive_project: async (client, args) => {
    const { project_id } = UnarchiveProjectParamsSchema.parse(args);
    return client.unarchiveProject(project_id);
  },

  search_projects: async (client, args) => {
    const { search_criteria } = SearchProjectsParamsSchema.parse(args);
    return client.searchProjects(search_criteria);
  },

  // ===== PROJECT TYPES (PROJ-02) =====
  list_project_types: async (client, args) => {
    const params = ListProjectTypesParamsSchema.parse(args);
    return client.listProjectTypes(params);
  },

  get_project_type: async (client, args) => {
    const { type_id } = GetProjectTypeParamsSchema.parse(args);
    const projectType = await client.getProjectType(type_id);
    if (!projectType) {
      throw McpError.notFound("Project Type", type_id);
    }
    return projectType;
  },

  // ===== PROJECT STATUSES (PROJ-03) =====
  list_project_statuses: async (client, args) => {
    const params = ListProjectStatusesParamsSchema.parse(args);
    return client.listProjectStatuses(params);
  },

  get_project_status: async (client, args) => {
    const { status_id } = GetProjectStatusParamsSchema.parse(args);
    const status = await client.getProjectStatus(status_id);
    if (!status) {
      throw McpError.notFound("Project Status", status_id);
    }
    return status;
  },

  // ===== MILESTONES (PROJ-04) =====
  list_milestones: async (client, args) => {
    const { project_id, ...params } = ListMilestonesParamsSchema.parse(args);
    return client.listMilestones(project_id, params);
  },

  get_milestone: async (client, args) => {
    const { project_id, milestone_id } = GetMilestoneParamsSchema.parse(args);
    const milestone = await client.getMilestone(project_id, milestone_id);
    if (!milestone) {
      throw McpError.notFound("Milestone", milestone_id);
    }
    return milestone;
  },

  create_milestone: async (client, args) => {
    const { project_id, ...data } = CreateMilestoneParamsSchema.parse(args);
    return client.createMilestone(project_id, data);
  },

  delete_milestone: async (client, args) => {
    const { project_id, milestone_id } = DeleteMilestoneParamsSchema.parse(args);
    return client.deleteMilestone(project_id, milestone_id);
  },

  // ===== WORK PACKAGES (PROJ-05) =====
  list_work_packages: async (client, args) => {
    const { project_id, ...params } = ListWorkPackagesParamsSchema.parse(args);
    return client.listWorkPackages(project_id, params);
  },

  get_work_package: async (client, args) => {
    const { project_id, workpackage_id } = GetWorkPackageParamsSchema.parse(args);
    const pkg = await client.getWorkPackage(project_id, workpackage_id);
    if (!pkg) {
      throw McpError.notFound("Work Package", workpackage_id);
    }
    return pkg;
  },

  create_work_package: async (client, args) => {
    const { project_id, ...data } = CreateWorkPackageParamsSchema.parse(args);
    return client.createWorkPackage(project_id, data);
  },

  update_work_package: async (client, args) => {
    const { project_id, workpackage_id, workpackage_data } = UpdateWorkPackageParamsSchema.parse(args);
    return client.updateWorkPackage(project_id, workpackage_id, workpackage_data);
  },

  delete_work_package: async (client, args) => {
    const { project_id, workpackage_id } = DeleteWorkPackageParamsSchema.parse(args);
    return client.deleteWorkPackage(project_id, workpackage_id);
  },

  update_milestone: async (client, args) => {
    const { project_id, milestone_id, milestone_data } = UpdateMilestoneParamsSchema.parse(args);
    const current = await client.getMilestone(project_id, milestone_id);
    return client.updateMilestone(project_id, milestone_id, withRequiredFields(current, milestone_data, ["name"]));
  },
};
