import { ConfigService, registerAs } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";

type StringValue =
    | `${number}`
    | `${number}${'d' | 'h' | 'm' | 's' | 'ms' | 'y' | 'w'}`
    | `${number} ${'d' | 'h' | 'm' | 's' | 'ms' | 'y' | 'w'}`;

export default registerAs('jwt', (): JwtModuleOptions => {
    const configService = new ConfigService()
    return {
        secret: configService.get<string>('JWT_SECRET', ''),
        signOptions: {
            expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN', "1d")
        }
    }
})