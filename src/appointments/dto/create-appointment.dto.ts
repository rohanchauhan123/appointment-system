/**
 * Create Appointment DTO
 * Validates appointment creation request
 */
import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsDateString,
    Min,
} from 'class-validator';

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty({ message: 'Patient name is required' })
    patient_name: string;

    @IsString()
    @IsNotEmpty({ message: 'Test name is required' })
    test_name: string;

    @IsString()
    @IsNotEmpty({ message: 'Branch location is required' })
    branch_location: string;

    @IsDateString({}, { message: 'Valid appointment date is required' })
    @IsNotEmpty({ message: 'Appointment date is required' })
    appointment_date: string;

    @IsNumber({}, { message: 'Amount must be a number' })
    @Min(0, { message: 'Amount cannot be negative' })
    amount: number;

    @IsNumber({}, { message: 'Advance amount must be a number' })
    @Min(0, { message: 'Advance amount cannot be negative' })
    @IsOptional()
    advance_amount?: number = 0;

    @IsString()
    @IsOptional()
    pro_details?: string;

    @IsString()
    @IsNotEmpty({ message: 'Contact number is required' })
    contact_number: string;

    @IsString()
    @IsOptional()
    agent_id?: string;
}
