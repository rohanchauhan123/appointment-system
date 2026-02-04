/**
 * Update Appointment DTO
 * Validates appointment update request (all fields optional)
 */
import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsDateString,
    Min,
} from 'class-validator';

export class UpdateAppointmentDto {
    @IsString()
    @IsNotEmpty({ message: 'Patient name is required' })
    @IsOptional()
    patient_name?: string;

    @IsString()
    @IsNotEmpty({ message: 'Test name is required' })
    @IsOptional()
    test_name?: string;

    @IsString()
    @IsNotEmpty({ message: 'Branch location is required' })
    @IsOptional()
    branch_location?: string;

    @IsDateString({}, { message: 'Valid appointment date is required' })
    @IsOptional()
    appointment_date?: string;

    @IsNumber({}, { message: 'Amount must be a number' })
    @Min(0, { message: 'Amount cannot be negative' })
    @IsOptional()
    amount?: number;

    @IsNumber({}, { message: 'Advance amount must be a number' })
    @Min(0, { message: 'Advance amount cannot be negative' })
    @IsOptional()
    advance_amount?: number;

    @IsString()
    @IsOptional()
    pro_details?: string;

    @IsString()
    @IsNotEmpty({ message: 'Contact number is required' })
    @IsOptional()
    contact_number?: string;
}
