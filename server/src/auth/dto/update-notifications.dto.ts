import { IsBoolean } from 'class-validator';

export class UpdateNotificationsDto {
  @IsBoolean({ message: 'pushNotifications musi być wartością boolean' })
  pushNotifications?: boolean;

  @IsBoolean({ message: 'emailNotifications musi być wartością boolean' })
  emailNotifications?: boolean;

  @IsBoolean({ message: 'soundEnabled musi być wartością boolean' })
  soundEnabled?: boolean;
}

