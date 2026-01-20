import { IsOptional, IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  // Allow token in body to avoid "property token should not exist" error
  // even if frontend sends it by mistake.
  @IsOptional()
  @IsString()
  public token?: string;

  @MaxLength(100)
  @IsStrongPassword(
    {},
    {
      message:
        'New password must be at least 8 characters and include ' +
        'uppercase, lowercase, number, and symbol',
    },
  )
  public newPassword: string;
}
