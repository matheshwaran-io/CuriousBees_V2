import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { FeedService } from './feed.service';

@Controller('feed')
@UseGuards(ClerkAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('search')
  async searchFeed(@Query('q') q: string) {
    return this.feedService.searchFeed(q);
  }

  @Get('peers')
  async getSuggestedPeers(@Req() req: any) {
    return this.feedService.getSuggestedPeers(req.user.id);
  }

  @Get('trending')
  async getTrendingResearch() {
    return this.feedService.getTrendingResearch();
  }
}
