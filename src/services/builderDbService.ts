import { prisma } from "@/lib/prisma";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content: string;
  documentStructure?: string;
  customFields?: string;
  createdBy: string;
  createdByName?: string;
  createdByRank?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  content?: string;
  documentStructure?: string;
  customFields?: string;
  status?: string;
}

export interface CreateDraftInput {
  name: string;
  description?: string;
  content: string;
  documentStructure?: string;
  customFields?: string;
  caseId?: string;
  complaintNumber?: string;
  templateId?: string;
  createdBy: string;
  createdByName?: string;
  createdByRank?: string;
  status?: string;
}

export interface UpdateDraftInput {
  name?: string;
  description?: string;
  content?: string;
  documentStructure?: string;
  customFields?: string;
  caseId?: string;
  complaintNumber?: string;
  status?: string;
}

export const BuilderDbService = {
  // ================= TEMPLATES =================
  async getTemplates(params?: {
    search?: string;
    createdBy?: string;
    status?: string;
    sortBy?: "name" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
  }) {
    try {
      const where: any = {};
      if (params?.status) {
        where.status = params.status;
      } else {
        where.status = "ACTIVE";
      }

      if (params?.createdBy) {
        where.createdBy = params.createdBy;
      }

      if (params?.search) {
        const query = params.search.trim();
        where.OR = [
          { name: { contains: query } },
          { description: { contains: query } },
        ];
      }

      const orderBy: any = {};
      const field = params?.sortBy || "updatedAt";
      const direction = params?.sortOrder || "desc";
      orderBy[field] = direction;

      return await prisma.builderTemplate.findMany({
        where,
        orderBy,
        include: {
          _count: {
            select: { drafts: true },
          },
        },
      });
    } catch (err) {
      console.error("BuilderDbService.getTemplates error:", err);
      return [];
    }
  },

  async getTemplateById(id: string) {
    try {
      return await prisma.builderTemplate.findUnique({
        where: { id },
        include: {
          drafts: {
            orderBy: { updatedAt: "desc" },
            take: 10,
          },
        },
      });
    } catch (err) {
      console.error(`BuilderDbService.getTemplateById error for ${id}:`, err);
      return null;
    }
  },

  async createTemplate(data: CreateTemplateInput) {
    return await prisma.builderTemplate.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        content: data.content,
        documentStructure: data.documentStructure || null,
        customFields: data.customFields || null,
        createdBy: data.createdBy,
        createdByName: data.createdByName || null,
        createdByRank: data.createdByRank || null,
        version: 1,
        status: "ACTIVE",
      },
    });
  },

  async updateTemplate(id: string, data: UpdateTemplateInput) {
    const existing = await prisma.builderTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error("Template not found");

    const newVersion = data.content && data.content !== existing.content
      ? existing.version + 1
      : existing.version;

    return await prisma.builderTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.documentStructure !== undefined ? { documentStructure: data.documentStructure } : {}),
        ...(data.customFields !== undefined ? { customFields: data.customFields } : {}),
        ...(data.status ? { status: data.status } : {}),
        version: newVersion,
      },
    });
  },

  async deleteTemplate(id: string) {
    return await prisma.builderTemplate.delete({
      where: { id },
    });
  },

  // ================= DRAFTS =================
  async getDrafts(params?: {
    search?: string;
    caseId?: string;
    createdBy?: string;
    status?: string;
    templateId?: string;
    sortBy?: "name" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
  }) {
    try {
      const where: any = {};
      if (params?.status) {
        where.status = params.status;
      }

      if (params?.caseId) {
        where.caseId = params.caseId;
      }

      if (params?.templateId) {
        where.templateId = params.templateId;
      }

      if (params?.createdBy) {
        where.createdBy = params.createdBy;
      }

      if (params?.search) {
        const query = params.search.trim();
        where.OR = [
          { name: { contains: query } },
          { description: { contains: query } },
          { complaintNumber: { contains: query } },
        ];
      }

      const orderBy: any = {};
      const field = params?.sortBy || "updatedAt";
      const direction = params?.sortOrder || "desc";
      orderBy[field] = direction;

      return await prisma.builderDraft.findMany({
        where,
        orderBy,
        include: {
          template: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (err) {
      console.error("BuilderDbService.getDrafts error:", err);
      return [];
    }
  },

  async getDraftById(id: string) {
    try {
      return await prisma.builderDraft.findUnique({
        where: { id },
        include: {
          template: true,
        },
      });
    } catch (err) {
      console.error(`BuilderDbService.getDraftById error for ${id}:`, err);
      return null;
    }
  },

  async createDraft(data: CreateDraftInput) {
    return await prisma.builderDraft.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        content: data.content,
        documentStructure: data.documentStructure || null,
        customFields: data.customFields || null,
        caseId: data.caseId || null,
        complaintNumber: data.complaintNumber || null,
        templateId: data.templateId || null,
        createdBy: data.createdBy,
        createdByName: data.createdByName || null,
        createdByRank: data.createdByRank || null,
        status: data.status || "DRAFT",
        version: 1,
      },
    });
  },

  async updateDraft(id: string, data: UpdateDraftInput) {
    const existing = await prisma.builderDraft.findUnique({ where: { id } });
    if (!existing) throw new Error("Draft not found");

    const newVersion = data.content && data.content !== existing.content
      ? existing.version + 1
      : existing.version;

    return await prisma.builderDraft.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.documentStructure !== undefined ? { documentStructure: data.documentStructure } : {}),
        ...(data.customFields !== undefined ? { customFields: data.customFields } : {}),
        ...(data.caseId !== undefined ? { caseId: data.caseId } : {}),
        ...(data.complaintNumber !== undefined ? { complaintNumber: data.complaintNumber } : {}),
        ...(data.status ? { status: data.status } : {}),
        version: newVersion,
      },
    });
  },

  async deleteDraft(id: string) {
    return await prisma.builderDraft.delete({
      where: { id },
    });
  },
};
