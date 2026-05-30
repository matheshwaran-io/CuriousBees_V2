import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface ExtractedEventData {
  title: string;
  description: string;
  department: string;
  venue: string;
  date: string; // ISO format or YYYY-MM-DD
  time: string;
  category: string;
  tags: string[];
  organizerEmail?: string;
  registrationLink?: string;
}

@Injectable()
export class AiExtractionService {
  private readonly logger = new Logger(AiExtractionService.name);
  private ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini SDK. It automatically picks up GEMINI_API_KEY from environment variables.
    this.ai = new GoogleGenAI({});
  }

  /**
   * Processes the raw email body and extracts structured event data using Gemini.
   */
  async extractEventData(subject: string, emailBody: string): Promise<ExtractedEventData> {
    this.logger.log(`Starting AI extraction for email subject: "${subject}"`);

    const prompt = `
      You are an expert AI event coordinator. Your task is to extract structured event information from the following university email.
      
      Email Subject: ${subject}
      Email Body:
      ${emailBody}

      Extract the following fields into a JSON object:
      - title: The title of the event
      - description: A short, coherent summary of the event details
      - department: The department organizing or associated with the event (e.g., "Computer Science", "Physics")
      - venue: The exact location where the event is taking place
      - date: The date of the event in YYYY-MM-DD format
      - time: The time of the event (e.g., "10:00 AM")
      - category: The type of event (e.g., "Workshop", "Seminar", "Hackathon", "Conference")
      - tags: An array of 3-5 relevant keywords for this event (e.g., ["AI", "Research", "Networking"])
      - organizerEmail: If mentioned, the email address of the organizer or contact person
      - registrationLink: Any URL provided for registration or RSVP

      If a required field (title, venue, date, time) is completely missing and cannot be inferred, leave it as an empty string.

      Respond ONLY with valid JSON. Do not include markdown formatting or backticks.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Even lower temperature for more factual extraction and less token usage
          maxOutputTokens: 500, // Limit output tokens since we only want a small JSON object
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini returned an empty response');
      }

      const extractedData: ExtractedEventData = JSON.parse(text);
      this.logger.log('Successfully extracted event data via AI.');
      return extractedData;

    } catch (error: any) {
      this.logger.error(`Failed to extract event data: ${error.message}`);
      // If it's a rate limit error or quota error, we provide a mock fallback for testing purposes
      if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
        this.logger.warn(`[MOCK FALLBACK] Gemini API quota exceeded. Using mock data for testing.`);
        return {
          title: subject.replace('EVENT: ', ''),
          department: 'Computer Science',
          venue: 'Main Auditorium',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time: '10:00 AM',
          category: 'Workshop',
          tags: ['Mock', 'Fallback'],
          description: emailBody,
        };
      }
      throw error;
    }
  }
}
