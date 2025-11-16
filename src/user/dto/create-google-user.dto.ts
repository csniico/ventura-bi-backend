export class CreateGoogleUserDto {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    googleId?: string;
    avatarUrl?: string;
}