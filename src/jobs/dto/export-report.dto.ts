/**
 * Export Report DTO
 * Validates export request with custom email recipients
 */
import { IsArray, IsEmail, IsOptional, ArrayMinSize, IsDateString } from 'class-validator';

export class ExportReportDto {
    @IsArray()
    @IsEmail({}, { each: true, message: 'Each recipient must be a valid email' })
    @ArrayMinSize(1, { message: 'At least one email recipient is required' })
    recipients: string[];

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
