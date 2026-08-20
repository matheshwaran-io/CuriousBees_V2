import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/supabase.guard';
import { ApprovedGuard } from '../../auth/approved.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationsService } from '../services/integrations.service';
import { GoogleWorkspaceService } from '../services/google-workspace.service';
import { IntegrationProvider } from '@prisma/client';

@Controller('workspaces/:workspaceId/collaboration')
@UseGuards(SupabaseAuthGuard, ApprovedGuard)
export class WorkspaceCollaborationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly googleWorkspace: GoogleWorkspaceService
  ) {}

  /**
   * Updates the selected collaboration provider for a research workspace
   */
  @Post('provider')
  async setCollaborationProvider(
    @Req() req: any,
    @Param('workspaceId') workspaceId: string,
    @Body('provider') provider: IntegrationProvider,
    @Body('externalMeetingUrl') externalMeetingUrl?: string
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isMember = workspace.members.some((m) => m.userId === req.user.id);
    if (!isMember) {
      throw new ForbiddenException('You are not authorized to configure this workspace.');
    }

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        collaborationProvider: provider,
        externalMeetingUrl: externalMeetingUrl || undefined,
      },
    });

    return updated;
  }

  /**
   * Connects/creates a dedicated Google Chat Space for this workspace
   */
  @Post('chat-space')
  async connectChatSpace(@Req() req: any, @Param('workspaceId') workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const isMember = workspace.members.some((m) => m.userId === req.user.id);
    if (!isMember) {
      throw new ForbiddenException('You are not authorized to configure this workspace.');
    }

    // Retrieve active user's Google Workspace token
    const accessToken = await this.integrationsService.getValidAccessToken(
      req.user.id,
      IntegrationProvider.GOOGLE_WORKSPACE
    );

    if (!accessToken) {
      throw new BadRequestException(
        'Google Workspace is not connected. Please connect Google Workspace in Settings to create a Chat Space.'
      );
    }

    const memberEmails = workspace.members.map((m) => m.user.email);
    const creatorEmail = req.user.email;

    const chatSpace = await this.googleWorkspace.createSpace(accessToken, {
      workspaceTitle: workspace.title,
      creatorEmail,
      memberEmails,
    });

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        googleChatSpaceId: chatSpace.spaceId,
        googleChatSpaceUrl: chatSpace.spaceUrl,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CHAT_SPACE_CREATED',
        details: `Created Google Chat Space "${chatSpace.displayName}" for workspace ${workspaceId}`,
      },
    }).catch(() => {});

    return {
      success: true,
      googleChatSpaceId: updated.googleChatSpaceId,
      googleChatSpaceUrl: updated.googleChatSpaceUrl,
    };
  }
}
