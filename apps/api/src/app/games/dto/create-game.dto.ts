import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  gameId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  playerName?: string;
}
