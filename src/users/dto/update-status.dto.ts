/**
 * Update User Status DTO
 * Validates status toggle request
 */
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
    @IsBoolean({ message: 'is_active must be a boolean' })
    @IsNotEmpty({ message: 'is_active status is required' })
    is_active: boolean;
}
