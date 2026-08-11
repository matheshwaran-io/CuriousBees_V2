import { Injectable, Logger } from '@nestjs/common';

export interface ParsedEventEmail {
  title: string;
  speaker?: string;
  date: Date;
  time: string;
  venue: string;
  department?: string;
  description?: string;
  senderEmail: string;
  eventType?: string;
}

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  /**
   * Parses inbound email body & subject text, extracting event parameters.
   * Subject Tag examples: [WORKSHOP], [SEMINAR], [EVENT], [DEFENSE]
   */
  parseEmail(body: string, senderEmail: string, subject?: string): ParsedEventEmail {
    this.logger.log(`Parsing inbound email from: ${senderEmail} with subject: ${subject}`);

    // 1. Analyze Subject Line for Event Type and fallback Title
    let derivedEventType = 'Email Intake';
    let cleanedSubject = subject ? subject.trim() : '';

    if (cleanedSubject) {
      // Extract tags like [WORKSHOP], [SEMINAR], [DEFENSE], etc.
      const tagMatch = cleanedSubject.match(/\[(WORKSHOP|SEMINAR|SYMPOSIUM|CONFERENCE|WEBINAR|GUEST_LECTURE|EVENT|DEFENSE|ANNOUNCEMENT)\]/i);
      if (tagMatch) {
        derivedEventType = tagMatch[1].toUpperCase();
      }

      // Clean subject prefix like Fwd:, Re:, Event Announcement, [NEW EVENT], [EVENT]
      cleanedSubject = cleanedSubject
        .replace(/^(Fwd|Re):\s*/i, '')
        .replace(/^\[?Event\s+Announcement\]?:?\s*/i, '')
        .replace(/\[(NEW\s+EVENT|EVENT|WORKSHOP|SEMINAR|SYMPOSIUM|CONFERENCE|WEBINAR|DEFENSE|ANNOUNCEMENT)\]/i, '')
        .trim();
    }

    // 2. Parse Body lines for Key-Value Pairs
    const lines = body.split(/\r?\n/);
    const extracted: Record<string, string> = {};

    let currentKey: string | null = null;
    let descriptionLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Match keys like Title:, Speaker:, Date:, Time:, Venue:, Department:, Description:
      const match = line.match(/^(Title|Speaker|Date|Time|Venue|Department|Description):\s*(.*)$/i);
      
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();

        if (key === 'description') {
          currentKey = 'description';
          if (value) descriptionLines.push(value);
        } else {
          currentKey = key;
          extracted[key] = value;
        }
      } else if (currentKey === 'description' && line) {
        descriptionLines.push(line);
      }
    }

    // 3. Fallback assignments
    const title = extracted['title'] || cleanedSubject || 'Untitled Event Update';
    const time = extracted['time'] || '10:00 AM';
    const venue = extracted['venue'] || 'SRM Campus Venue';
    const speaker = extracted['speaker'] || undefined;
    const department = extracted['department'] || undefined;
    const description = descriptionLines.length > 0 
      ? descriptionLines.join('\n') 
      : (extracted['description'] || undefined);

    // 4. Parse Date
    let eventDate = new Date();
    if (extracted['date']) {
      const parsedDate = new Date(extracted['date']);
      if (!isNaN(parsedDate.getTime())) {
        eventDate = parsedDate;
      }
    } else {
      // Try finding date string YYYY-MM-DD in body
      const dateInText = body.match(/\b(20\d{2}[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01]))\b/);
      if (dateInText) {
        const parsedDate = new Date(dateInText[1]);
        if (!isNaN(parsedDate.getTime())) {
          eventDate = parsedDate;
        }
      }
    }

    return {
      title,
      speaker,
      date: eventDate,
      time,
      venue,
      department,
      description,
      senderEmail: senderEmail.toLowerCase(),
      eventType: derivedEventType,
    };
  }
}
