import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationsDto {
  @IsOptional()
  @IsBoolean({ message: 'pushNotifications musi być wartością boolean' })
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'emailNotifications musi być wartością boolean' })
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'soundEnabled musi być wartością boolean' })
  soundEnabled?: boolean;
}

