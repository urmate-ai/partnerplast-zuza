import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CalendarCallbackDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  authuser?: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  calendar?: string;
}

export class CalendarDisconnectDto {
  @IsString()
  @IsNotEmpty()
  integrationId: string;
}

export class GetEventsDto {
  @IsOptional()
  @IsString()
  calendarId?: string;

  @IsOptional()
  @IsDateString()
  timeMin?: string;

  @IsOptional()
  @IsDateString()
  timeMax?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxResults?: number;
}

class EventDateTimeDto {
  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;
}

class AttendeeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @ValidateNested()
  @Type(() => EventDateTimeDto)
  start: EventDateTimeDto;

  @ValidateNested()
  @Type(() => EventDateTimeDto)
  end: EventDateTimeDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees?: AttendeeDto[];
}

export class UpdateEventDto {
  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventDateTimeDto)
  start?: EventDateTimeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventDateTimeDto)
  end?: EventDateTimeDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees?: AttendeeDto[];
}

export class DeleteEventDto {
  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;
}
